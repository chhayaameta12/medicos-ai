import express from "express";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

const RXNORM_URL = "https://rxnav.nlm.nih.gov/REST";

// ==================================================
// GEMINI CLIENT
// ==================================================

console.log(
  "Gemini API key loaded:",
  Boolean(process.env.GEMINI_API_KEY),
  "length:",
  process.env.GEMINI_API_KEY?.length || 0
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==================================================
// BACKEND INTERNAL API BASE URL
// ==================================================

const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  `http://localhost:${process.env.PORT || 5000}`;

// ==================================================
// RXNORM MEDICINE LOOKUP
// ==================================================

async function resolveMedicine(medicineName) {
  try {
    console.log("================================");
    console.log("AI MEDICINE LOOKUP");
    console.log("Medicine:", medicineName);
    console.log("================================");

    const response = await axios.get(
      `${RXNORM_URL}/rxcui.json`,
      {
        params: {
          name: medicineName,
          search: 2,
        },
        timeout: 10000,
      }
    );

    const rxcui =
      response.data?.idGroup?.rxnormId?.[0] || null;

    if (!rxcui) {
      console.log(
        "RxNorm could not resolve:",
        medicineName
      );
      return null;
    }

    let properties = {};

    try {
      const propertiesResponse = await axios.get(
        `${RXNORM_URL}/rxcui/${rxcui}/properties.json`,
        {
          timeout: 10000,
        }
      );

      properties =
        propertiesResponse.data?.properties || {};
    } catch (error) {
      console.log(
        "RxNorm properties lookup failed:",
        error.message
      );
    }

    let ingredients = [];

    try {
      const relatedResponse = await axios.get(
        `${RXNORM_URL}/rxcui/${rxcui}/allrelated.json`,
        {
          timeout: 10000,
        }
      );

      const groups =
        relatedResponse.data?.allRelatedGroup
          ?.conceptGroup || [];

      for (const group of groups) {
        if (
          group.tty !== "IN" &&
          group.tty !== "PIN"
        ) {
          continue;
        }

        const concepts =
          group.conceptProperties || [];

        for (const concept of concepts) {
          if (!concept.name) {
            continue;
          }

          ingredients.push({
            rxcui: concept.rxcui,
            name: concept.name,
          });
        }
      }

      ingredients = ingredients.filter(
        (item, index, array) =>
          index ===
          array.findIndex(
            (x) => x.rxcui === item.rxcui
          )
      );
    } catch (error) {
      console.log(
        "RxNorm ingredient lookup failed:",
        error.message
      );
    }

    if (ingredients.length === 0) {
      ingredients = [
        {
          rxcui,
          name:
            properties.name ||
            medicineName,
        },
      ];
    }

    return {
      input: medicineName,
      rxcui,
      name:
        properties.name ||
        medicineName,
      tty: properties.tty || null,
      ingredients,
    };
  } catch (error) {
    console.error(
      "Medicine resolution error:",
      error.message
    );

    return null;
  }
}

// ==================================================
// EXTRACT POSSIBLE MEDICINE NAMES
// ==================================================

function extractInteractionMedicines(question) {
  const text = question
    .toLowerCase()
    .trim();

  const patterns = [
    /can i take (.+?) with (.+?)(?:\?|$)/i,
    /can i take (.+?) together with (.+?)(?:\?|$)/i,
    /can i take (.+?) and (.+?)(?:\?|$)/i,
    /can i use (.+?) with (.+?)(?:\?|$)/i,
    /can i use (.+?) and (.+?)(?:\?|$)/i,
    /(.+?) with (.+?)(?:\?|$)/i,
    /(.+?) together with (.+?)(?:\?|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      const medicine1 = match[1]
        .trim()
        .replace(/[?.!]+$/, "");

      const medicine2 = match[2]
        .trim()
        .replace(/[?.!]+$/, "");

      if (
        medicine1 &&
        medicine2 &&
        medicine1.length < 100 &&
        medicine2.length < 100
      ) {
        return {
          medicine1,
          medicine2,
        };
      }
    }
  }

  return null;
}

// ==================================================
// DETECT INTERACTION QUESTION
// ==================================================

function isInteractionQuestion(question) {
  const text = question.toLowerCase();

  const interactionWords = [
    "interaction",
    "interact",
    "together",
    "combine",
    "combining",
    "take with",
    "taken with",
    "use with",
    "used with",
    "mix",
    "safe with",
  ];

  return interactionWords.some((word) =>
    text.includes(word)
  );
}

// ==================================================
// DETECT MEDICINE QUESTION
// ==================================================

function isMedicineQuestion(question) {
  const text = question.toLowerCase();

  const medicineWords = [
    "medicine",
    "medication",
    "drug",
    "tablet",
    "capsule",
    "dose",
    "dosage",
    "side effect",
    "side effects",
    "uses",
    "used for",
    "purpose",
    "precaution",
    "precautions",
    "pregnancy",
    "pregnant",
    "medicine information",
    "tell me about",
    "what is",
    "what does",
  ];

  return medicineWords.some((word) =>
    text.includes(word)
  );
}

// ==================================================
// EXTRACT MEDICINE FROM GENERAL QUESTION
// ==================================================

function extractPossibleMedicine(question) {
  const text = question.trim();

  const patterns = [
    /tell me about (.+)/i,
    /what is (.+?)(?:\?|$)/i,
    /what are the uses of (.+?)(?:\?|$)/i,
    /what is (.+?) used for(?:\?|$)/i,
    /side effects of (.+?)(?:\?|$)/i,
    /uses of (.+?)(?:\?|$)/i,
    /precautions for (.+?)(?:\?|$)/i,
    /information about (.+?)(?:\?|$)/i,
    /is (.+?) safe(?:\?|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      let medicine = match[1]
        .trim()
        .replace(/[?.!]+$/, "");

      medicine = medicine
        .replace(
          /\s+(during pregnancy|in pregnancy)$/i,
          ""
        )
        .trim();

      if (
        medicine &&
        medicine.length < 100
      ) {
        return medicine;
      }
    }
  }

  return null;
}

// ==================================================
// GEMINI MEDICAL SYSTEM PROMPT
// ==================================================

function createMedicalPrompt(
  userMessage,
  medicineData = null
) {
  let medicineContext = "";

  if (medicineData) {
    medicineContext = `
VERIFIED RXNORM INFORMATION
----------------------------
User medicine input:
${medicineData.input}

RxNorm name:
${medicineData.name}

RxCUI:
${medicineData.rxcui}

TTY:
${medicineData.tty || "Not available"}

Active ingredients:
${
  medicineData.ingredients
    ?.map((item) => item.name)
    .join(", ") ||
  "Not available"
}

IMPORTANT:
Use the verified RxNorm information above as factual context.
Do not invent additional medicine-specific facts when they
are not supported by the provided information.
`;
  }

  return `
You are Medicos AI, an educational medicine information assistant.

Your job is to explain medicine-related information clearly,
simply, and responsibly.

${medicineContext}

USER QUESTION
-------------
${userMessage}

IMPORTANT RULES
---------------

1. Provide educational information only.
2. Do not diagnose diseases.
3. Do not prescribe treatment.
4. Do not tell the user to start, stop, or change a prescription
   medicine without professional medical advice.
5. Do not invent medicine-specific facts.
6. If information is unavailable from the provided data,
   clearly say that it is unavailable rather than guessing.
7. For dosage questions, explain that dosage depends on factors
   such as age, formulation, medical condition, other medicines,
   and professional guidance.
8. For pregnancy, children, elderly patients, kidney disease,
   liver disease, allergies, or serious medical conditions,
   recommend consultation with a doctor or pharmacist.
9. If the user describes severe or emergency symptoms,
   recommend immediate professional medical help.
10. Keep the response easy to understand.
11. Use Markdown formatting.
12. Prefer this structure when appropriate:

### What it is
### Common uses
### Common side effects
### Important precautions
### When to seek medical help
### Important note

13. Do not claim that a medicine is completely safe.
14. Do not replace a doctor or pharmacist.

End with a short educational disclaimer when appropriate.
`;
}

// ==================================================
// INTERACTION EXPLANATION PROMPT
// ==================================================

function createInteractionPrompt(
  userMessage,
  interactionResult
) {
  return `
You are Medicos AI, an educational medicine information assistant.

The user's question is:

"${userMessage}"

The interaction checker has already checked the medicines
against the Medicos AI DDInter 2.0 local database.

You MUST treat the database result below as the source of truth
for whether an interaction was found in this dataset.

Do NOT independently invent or contradict the database result.

DATABASE RESULT
---------------
${JSON.stringify(
  interactionResult,
  null,
  2
)}

INSTRUCTIONS
------------

1. Clearly state whether an interaction was found.

2. If an interaction was found:
   - State the severity.
   - Name the medicines/ingredients involved.
   - Explain the recorded interaction in simple language.
   - Mention the database limitation.

3. If no interaction was found:
   - Say that no matching interaction was found
     in the current DDInter dataset.
   - Explicitly explain that this does NOT prove
     that no interaction exists.
   - Do not say that the combination is automatically safe.

4. Do not prescribe doses.
5. Mention that individual factors can change medicine safety.
6. Recommend a doctor or pharmacist when appropriate.
7. Use Markdown.
8. Keep the answer concise and understandable.

End with an educational disclaimer.
`;
}

// ==================================================
// POST /api/ai/chat
// ==================================================

router.post(
  "/chat",
  async (req, res) => {
    try {
      const {
        message,
        question,
      } = req.body || {};

      const userMessage = (
        message ||
        question ||
        ""
      ).trim();

      if (!userMessage) {
        return res.status(400).json({
          error:
            "Please provide a message.",
        });
      }

      console.log("================================");
      console.log(
        "AI Question:",
        userMessage
      );
      console.log("================================");

      // ==================================================
      // 1. INTERACTION QUESTION
      // ==================================================

      if (
        isInteractionQuestion(
          userMessage
        )
      ) {
        const medicines =
          extractInteractionMedicines(
            userMessage
          );

        if (medicines) {
          console.log(
            "Detected interaction question:"
          );

          console.log(
            "Medicine 1:",
            medicines.medicine1
          );

          console.log(
            "Medicine 2:",
            medicines.medicine2
          );

          try {
            const interactionResponse =
              await axios.get(
                `${API_BASE_URL}/api/interactions/check`,
                {
                  params: {
                    medicine1:
                      medicines.medicine1,
                    medicine2:
                      medicines.medicine2,
                  },
                  timeout: 20000,
                }
              );

            const interactionResult =
              interactionResponse.data;

            console.log(
              "DDInter result received successfully"
            );

            const prompt =
              createInteractionPrompt(
                userMessage,
                interactionResult
              );

            const response =
              await ai.models.generateContent({
                model:
                  "gemini-3.7-flash",
                contents: prompt,
              });

            const answer =
              response.text ||
              "Sorry, I couldn't generate a response right now.";

            console.log(
              "AI Response generated successfully"
            );

            console.log(
              "AI Response length:",
              answer.length
            );

            return res.status(200).json({
              answer,
              type:
                "interaction",
              data:
                interactionResult,
            });
          } catch (interactionError) {
            console.error(
              "DDInter lookup failed:",
              interactionError.message
            );

            return res.status(500).json({
              error:
                "The medicine interaction database could not be checked right now. Please try again.",
            });
          }
        }
      }

      // ==================================================
      // 2. MEDICINE INFORMATION QUESTION
      // ==================================================

      let medicineName = null;

      if (
        isMedicineQuestion(
          userMessage
        )
      ) {
        medicineName =
          extractPossibleMedicine(
            userMessage
          );
      }

      if (medicineName) {
        console.log(
          "Possible medicine detected:",
          medicineName
        );

        const medicineData =
          await resolveMedicine(
            medicineName
          );

        if (medicineData) {
          console.log(
            "Medicine resolved:",
            medicineData.name
          );

          const prompt =
            createMedicalPrompt(
              userMessage,
              medicineData
            );

          const response =
            await ai.models.generateContent({
              model:
                "gemini-3.6-flash",
              contents: prompt,
            });

          const answer =
            response.text ||
            "Sorry, I couldn't generate a response right now.";

          console.log(
            "AI Medicine Response generated successfully"
          );

          console.log(
            "AI Response length:",
            answer.length
          );

          return res.status(200).json({
            answer,
            type:
              "medicine",
            medicine:
              medicineData,
          });
        }

        console.log(
          "Medicine could not be resolved."
        );
      }

      // ==================================================
      // 3. GENERAL AI MEDICAL QUESTION
      // ==================================================

      const prompt =
        createMedicalPrompt(
          userMessage
        );

      const response =
        await ai.models.generateContent({
          model:
            "gemini-3.6-flash",
          contents: prompt,
        });

      const answer =
        response.text ||
        "Sorry, I couldn't generate a response right now.";

      console.log(
        "AI Response generated successfully"
      );

      console.log(
        "AI Response length:",
        answer.length
      );

      return res.status(200).json({
        answer,
        type:
          "general",
      });
    } catch (error) {
      console.error(
        "================================"
      );

      console.error(
        "AI ERROR"
      );

      console.error(
        error
      );

      console.error(
        "================================"
      );

      // ==================================================
      // GEMINI AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.status === 401 ||
        error?.status === 403
      ) {
        return res.status(500).json({
          error:
            "Gemini API authentication failed. Please check your GEMINI_API_KEY.",
        });
      }

      // ==================================================
      // GEMINI QUOTA / RATE LIMIT
      // ==================================================

      if (
        error?.status === 429
      ) {
        return res.status(429).json({
          error:
            "Gemini API quota or rate limit reached. Please try again later.",
        });
      }

      // ==================================================
      // GEMINI TEMPORARILY UNAVAILABLE
      // ==================================================

      if (
        error?.status === 503
      ) {
        return res.status(503).json({
          error:
            "Gemini is temporarily experiencing high demand. Please try again shortly.",
        });
      }

      return res.status(500).json({
        error:
          "AI assistant is currently unavailable.",
      });
    }
  }
);

export default router;