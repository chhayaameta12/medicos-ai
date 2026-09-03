import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const router = express.Router();

const RXNORM_URL = "https://rxnav.nlm.nih.gov/REST";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DDINTER_DIR = path.join(
  __dirname,
  "../data/ddinter"
);

/*
==================================================
NORMALIZE DRUG NAME
==================================================
*/

function normalizeDrugName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[–—]/g, "-")
    .replace(/[()]/g, "")
    .replace(/['"]/g, "")
    .replace(/[.,;:!?]+$/g, "")
    .replace(/\s+/g, " ");
}

/*
==================================================
CSV PARSER
==================================================
*/

function parseCSVLine(line) {
  const result = [];

  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (
      char === "," &&
      !insideQuotes
    ) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);

  return result;
}

/*
==================================================
LOAD ONE CSV FILE
==================================================
*/

function loadCSVFile(filePath) {
  const content = fs.readFileSync(
    filePath,
    "utf8"
  );

  const lines = content
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCSVLine(lines[0]).map(
    (header) =>
      header
        .replace(/^\uFEFF/, "")
        .trim()
  );

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    const record = {};

    headers.forEach((header, index) => {
      record[header] =
        values[index]?.trim() || "";
    });

    records.push(record);
  }

  return records;
}

/*
==================================================
DDINTER DATABASE
==================================================
*/

let ddinterRecords = [];

const drugIndex = new Map();

const pairIndex = new Map();

/*
==================================================
CREATE PAIR KEY
==================================================
*/

function createPairKey(id1, id2) {
  const a = String(id1 || "").trim();
  const b = String(id2 || "").trim();

  if (!a || !b) {
    return null;
  }

  return [a, b]
    .sort((x, y) =>
      x.localeCompare(y)
    )
    .join("|||");
}

/*
==================================================
ADD DRUG TO INDEX
==================================================
*/

function addDrugToIndex(name, id) {
  const normalizedName =
    normalizeDrugName(name);

  const normalizedId =
    String(id || "").trim();

  if (
    !normalizedName ||
    !normalizedId
  ) {
    return;
  }

  if (!drugIndex.has(normalizedName)) {
    drugIndex.set(
      normalizedName,
      new Set()
    );
  }

  drugIndex
    .get(normalizedName)
    .add(normalizedId);
}

/*
==================================================
LOAD DDINTER DATABASE
==================================================
*/

function loadDDInterDatabase() {
  console.log("================================");
  console.log("LOADING DDINTER LOCAL DATABASE");
  console.log("Directory:", DDINTER_DIR);
  console.log("================================");

  if (!fs.existsSync(DDINTER_DIR)) {
    console.error(
      "DDInter directory does not exist:",
      DDINTER_DIR
    );
    return;
  }

  const files = fs
    .readdirSync(DDINTER_DIR)
    .filter((file) =>
      file.toLowerCase().endsWith(".csv")
    );

  if (files.length === 0) {
    console.error(
      "No DDInter CSV files found."
    );
    return;
  }

  console.log(
    `Found ${files.length} DDInter CSV files`
  );

  for (const file of files) {
    const filePath =
      path.join(
        DDINTER_DIR,
        file
      );

    try {
      const records =
        loadCSVFile(filePath);

      console.log(
        `${file}: ${records.length} records`
      );

      ddinterRecords.push(
        ...records
      );
    } catch (error) {
      console.error(
        `Failed to load ${file}:`,
        error.message
      );
    }
  }

  /*
  ================================================
  BUILD INDEXES
  ================================================
  */

  for (const record of ddinterRecords) {
    const idA =
      record.DDInterID_A;

    const idB =
      record.DDInterID_B;

    const drugA =
      record.Drug_A;

    const drugB =
      record.Drug_B;

    addDrugToIndex(
      drugA,
      idA
    );

    addDrugToIndex(
      drugB,
      idB
    );

    const pairKey =
      createPairKey(
        idA,
        idB
      );

    if (!pairKey) {
      continue;
    }

    const existing =
      pairIndex.get(pairKey);

    if (!existing) {
      pairIndex.set(
        pairKey,
        record
      );
    } else {
      const existingLevel =
        Number(existing.Level);

      const newLevel =
        Number(record.Level);

      if (
        Number.isFinite(newLevel) &&
        (
          !Number.isFinite(existingLevel) ||
          newLevel > existingLevel
        )
      ) {
        pairIndex.set(
          pairKey,
          record
        );
      }
    }
  }

  console.log("================================");
  console.log("DDINTER DATABASE READY");
  console.log(
    "Total records:",
    ddinterRecords.length
  );
  console.log(
    "Unique medicine names:",
    drugIndex.size
  );
  console.log(
    "Unique interaction pairs:",
    pairIndex.size
  );
  console.log("================================");
}

loadDDInterDatabase();

/*
==================================================
COMMON ALIASES
==================================================
*/
function createNameAliases(name) {
  const normalized = normalizeDrugName(name);

  if (!normalized) {
    return [];
  }

  return [normalized];
}


/*
==================================================
CREATE SEARCH ALIASES
==================================================
*/



/*
==================================================
FIND DDINTER IDS
==================================================
*/

function findDrugIds(name) {
  const aliases =
    createNameAliases(name);

  const ids = new Set();

  for (const alias of aliases) {
    const found =
      drugIndex.get(alias);

    if (!found) {
      continue;
    }

    for (const id of found) {
      ids.add(id);
    }
  }

  return {
    aliases,
    ids: [...ids],
  };
}

/*
==================================================
SEVERITY
==================================================
*/

function mapLevelToSeverity(level) {
  if (level == null) {
    return "Unknown";
  }

  const value =
    String(level)
      .trim()
      .toLowerCase();

  if (
    value === "major" ||
    value === "severe"
  ) {
    return "Major";
  }

  if (
    value === "moderate" ||
    value === "medium"
  ) {
    return "Moderate";
  }

  if (
    value === "minor" ||
    value === "mild"
  ) {
    return "Minor";
  }

  const n = Number(value);

  if (n === 3) {
    return "Major";
  }

  if (n === 2) {
    return "Moderate";
  }

  if (n === 1) {
    return "Minor";
  }

  return "Unknown";
}

/*
==================================================
RXNORM: GET INGREDIENTS

This is the important new part.

RxCUI can represent:

SBD = branded drug
SCD = clinical drug
IN  = ingredient

We use RxNorm relationships to find
the underlying IN concepts.
==================================================
*/

async function getRxNormIngredients(rxcui) {
  try {
    const response = await axios.get(
      `${RXNORM_URL}/rxcui/${rxcui}/allrelated.json`,
      {
        timeout: 10000,
      }
    );

    const groups =
      response.data?.allRelatedGroup?.conceptGroup || [];

    const ingredients = [];

    for (const group of groups) {
      // We only want ingredient concepts
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

    // Remove duplicate ingredients
    return ingredients.filter(
      (item, index, array) =>
        index ===
        array.findIndex(
          (x) => x.rxcui === item.rxcui
        )
    );
  } catch (error) {
    console.log(
      "Ingredient lookup failed:",
      error.message
    );

    return [];
  }
}

/*
==================================================
RXNORM: RESOLVE INPUT

Accepts either:

"Dolo 650"

OR

"153008"

Returns:

{
  input,
  rxcui,
  name,
  ingredients
}
==================================================
*/

async function resolveMedicineInput(input) {
  const originalInput =
    String(input || "").trim();

  if (!originalInput) {
    throw new Error(
      "Medicine input is empty"
    );
  }

  let rxcui = null;

  /*
  ================================================
  CASE 1
  Frontend sent an RxCUI
  ================================================
  */

  if (
    /^\d+$/.test(
      originalInput
    )
  ) {
    rxcui =
      originalInput;
  }

  /*
  ================================================
  CASE 2
  Frontend sent medicine name
  ================================================
  */

  if (!rxcui) {
    const response =
      await axios.get(
        `${RXNORM_URL}/rxcui.json`,
        {
          params: {
            name: originalInput,
            search: 2,
          },
          timeout: 10000,
        }
      );

    rxcui =
      response.data
        ?.idGroup
        ?.rxnormId?.[0] ||
      null;
  }

  /*
  ================================================
  RxNorm couldn't resolve it.

  Allow direct DDInter substances such
  as ethanol/alcohol.
  ================================================
  */

  if (!rxcui) {
    console.log(
      "RxNorm did not resolve:",
      originalInput
    );

    return {
      input: originalInput,
      rxcui: null,
      name: originalInput,
      ingredients: [
        {
          rxcui: null,
          name: originalInput,
        },
      ],
      resolutionFallback: true,
    };
  }

  /*
  ================================================
  Get RxNorm properties
  ================================================
  */

  let name =
    originalInput;

  try {
    const propertiesResponse =
      await axios.get(
        `${RXNORM_URL}/rxcui/${rxcui}/properties.json`,
        {
          timeout: 10000,
        }
      );

    name =
      propertiesResponse.data
        ?.properties
        ?.name ||
      originalInput;
  } catch (error) {
    console.warn(
      "Could not get RxNorm properties:",
      error.message
    );
  }

  /*
  ================================================
  Get active ingredients
  ================================================
  */

  let ingredients =
    await getRxNormIngredients(
      rxcui
    );

  /*
  If RxNorm itself is already an ingredient,
  use the medicine itself.
  */

  if (
    ingredients.length === 0
  ) {
    ingredients = [
      {
        rxcui,
        name,
      },
    ];
  }

  return {
    input: originalInput,
    rxcui,
    name,
    ingredients,
    resolutionFallback: false,
  };
}

/*
==================================================
RESOLVE ENDPOINT

Used by frontend medicine resolution.
==================================================
*/

router.get(
  "/resolve",
  async (req, res) => {
    const name =
      req.query.name?.trim();

    if (!name) {
      return res.status(400).json({
        message:
          "Medicine name is required",
      });
    }

    console.log("================================");
    console.log("RESOLVING MEDICINE");
    console.log("Search:", name);
    console.log("================================");

    try {
      const medicine =
        await resolveMedicineInput(
          name
        );

      console.log(
        "Resolved medicine:",
        medicine
      );

      return res.json(
        medicine
      );
    } catch (error) {
      console.error(
        "Medicine resolution error:",
        error.message
      );

      return res.status(500).json({
        message:
          "Unable to resolve medicine",
      });
    }
  }
);

/*
==================================================
CHECK INTERACTION

Accepts either:

medicine1 = RxCUI
medicine2 = RxCUI

OR medicine names.

Then:

Input
 ↓
RxNorm
 ↓
Ingredients
 ↓
Local DDInter
==================================================
*/

router.get(
  "/check",
  async (req, res) => {
    const medicine1 =
      req.query.medicine1?.trim();

    const medicine2 =
      req.query.medicine2?.trim();

    console.log("================================");
    console.log("INTERACTION CHECK");
    console.log("Medicine 1:", medicine1);
    console.log("Medicine 2:", medicine2);
    console.log("================================");

    if (
      !medicine1 ||
      !medicine2
    ) {
      return res.status(400).json({
        message:
          "Both medicines are required",
      });
    }

    try {
      /*
      ============================================
      1. RESOLVE BOTH INPUTS
      ============================================
      */

      const [
        resolved1,
        resolved2,
      ] = await Promise.all([
        resolveMedicineInput(
          medicine1
        ),
        resolveMedicineInput(
          medicine2
        ),
      ]);

      console.log(
        "================================"
      );

      console.log(
        "RESOLVED MEDICINES"
      );

      console.log(
        resolved1
      );

      console.log(
        resolved2
      );

      console.log(
        "================================"
      );

      /*
      ============================================
      2. GET INGREDIENTS
      ============================================
      */

      const ingredients1 =
        resolved1.ingredients;

      const ingredients2 =
        resolved2.ingredients;

      console.log(
        "Medicine 1 ingredients:",
        ingredients1
      );

      console.log(
        "Medicine 2 ingredients:",
        ingredients2
      );

      /*
      ============================================
      3. FIND ALL DDINTER IDS

      A medicine can have multiple ingredients.

      Example:

      Combination medicine
          ↓
      Ingredient A
      Ingredient B
          ↓
      check both
      ============================================
      */

      const ingredientMatches1 = [];
      const ingredientMatches2 = [];

      for (
        const ingredient of ingredients1
      ) {
        const match =
          findDrugIds(
            ingredient.name
          );

        ingredientMatches1.push({
          ingredient,
          aliases: match.aliases,
          ids: match.ids,
        });
      }

      for (
        const ingredient of ingredients2
      ) {
        const match =
          findDrugIds(
            ingredient.name
          );

        ingredientMatches2.push({
          ingredient,
          aliases: match.aliases,
          ids: match.ids,
        });
      }

      console.log(
        "DDInter matches for medicine 1:",
        ingredientMatches1
      );

      console.log(
        "DDInter matches for medicine 2:",
        ingredientMatches2
      );

      /*
      ============================================
      4. CHECK EVERY INGREDIENT PAIR
      ============================================
      */

      let interaction = null;

      let matchedIngredient1 = null;
      let matchedIngredient2 = null;

      let matchedId1 = null;
      let matchedId2 = null;

      for (
        const match1 of ingredientMatches1
      ) {
        for (
          const match2 of ingredientMatches2
        ) {
          for (
            const id1 of match1.ids
          ) {
            for (
              const id2 of match2.ids
            ) {
              const pairKey =
                createPairKey(
                  id1,
                  id2
                );

              if (!pairKey) {
                continue;
              }

              const record =
                pairIndex.get(
                  pairKey
                );

              if (record) {
                interaction = record;

                matchedIngredient1 =
                  match1.ingredient;

                matchedIngredient2 =
                  match2.ingredient;

                matchedId1 = id1;
                matchedId2 = id2;

                break;
              }
            }

            if (interaction) {
              break;
            }
          }

          if (interaction) {
            break;
          }
        }

        if (interaction) {
          break;
        }
      }

      /*
      ============================================
      5. INTERACTION FOUND
      ============================================
      */

      if (interaction) {
        const severity =
          mapLevelToSeverity(
            interaction.Level
          );

        console.log("================================");
        console.log("INTERACTION FOUND");
        console.log(
          "User medicine 1:",
          resolved1.name
        );
        console.log(
          "User medicine 2:",
          resolved2.name
        );
        console.log(
          "Ingredient 1:",
          matchedIngredient1
        );
        console.log(
          "Ingredient 2:",
          matchedIngredient2
        );
        console.log(
          "Drug A:",
          interaction.Drug_A
        );
        console.log(
          "Drug B:",
          interaction.Drug_B
        );
        console.log(
          "Level:",
          interaction.Level
        );
        console.log(
          "Severity:",
          severity
        );
        console.log("================================");

        return res.json({
          success: true,

          medicine1: {
            input:
              resolved1.input,

            name:
              resolved1.name,

            rxcui:
              resolved1.rxcui,

            ingredients:
              ingredients1,
          },

          medicine2: {
            input:
              resolved2.input,

            name:
              resolved2.name,

            rxcui:
              resolved2.rxcui,

            ingredients:
              ingredients2,
          },

          interaction: {
            status:
              "interaction_found",

            severity,

            rawLevel:
              interaction.Level,

            drugA:
              interaction.Drug_A,

            drugB:
              interaction.Drug_B,

            matchedIngredients: {
              medicine1:
                matchedIngredient1,

              medicine2:
                matchedIngredient2,
            },

            ddinterIds: {
              medicine1:
                matchedId1,

              medicine2:
                matchedId2,
            },

            interactionText:
              interaction.interaction ||
              null,

            mechanisms: {
              absorption:
                interaction.absorption ===
                "1",

              antagonisticEffect:
                interaction.antagonistic_effect ===
                "1",

              distribution:
                interaction.distribution ===
                "1",

              metabolism:
                interaction.metabolism ===
                "1",

              excretion:
                interaction.excretion ===
                "1",

              synergisticEffect:
                interaction.synergistic_effect ===
                "1",

              others:
                interaction.others ===
                "1",
            },

            message:
              `A ${severity.toLowerCase()} interaction is recorded between ${resolved1.name} and ${resolved2.name}.`,
          },

          source:
            "DDInter 2.0 + RxNorm",
        });
      }

      /*
      ============================================
      6. NO INTERACTION FOUND
      ============================================
      */

      console.log("================================");
      console.log(
        "NO MATCHING INTERACTION FOUND"
      );
      console.log(
        resolved1.name,
        "+",
        resolved2.name
      );
      console.log("================================");

      return res.json({
        success: true,

        medicine1: {
          input:
            resolved1.input,

          name:
            resolved1.name,

          rxcui:
            resolved1.rxcui,

          ingredients:
            ingredients1,

          ddinterMatches:
            ingredientMatches1,
        },

        medicine2: {
          input:
            resolved2.input,

          name:
            resolved2.name,

          rxcui:
            resolved2.rxcui,

          ingredients:
            ingredients2,

          ddinterMatches:
            ingredientMatches2,
        },

        interaction: {
          status:
            "not_found_in_database",

          severity: null,

          message:
            "No matching interaction was found in the current DDInter 2.0 dataset. This does not prove that no interaction exists.",
        },

        source:
          "DDInter 2.0 + RxNorm",
      });
    } catch (error) {
      console.error("================================");
      console.error("INTERACTION ERROR");
      console.error(error.message);
      console.error("================================");

      return res.status(500).json({
        message:
          "Unable to check medicine interaction",

        error:
          error.message,
      });
    }
  }
);

/*
==================================================
DEBUG DDINTER
==================================================
*/

router.get(
  "/debug-ddinter",
  async (req, res) => {
    const name =
      req.query.name?.trim();

    if (!name) {
      return res.status(400).json({
        message:
          "name is required",
      });
    }

    const result =
      findDrugIds(name);

    const interactions = [];

    for (
      const record of ddinterRecords
    ) {
      const idA =
        String(
          record.DDInterID_A || ""
        ).trim();

      const idB =
        String(
          record.DDInterID_B || ""
        ).trim();

      if (
        result.ids.includes(idA) ||
        result.ids.includes(idB)
      ) {
        interactions.push({
          drugA:
            record.Drug_A,

          drugB:
            record.Drug_B,

          idA,
          idB,

          level:
            record.Level,

          interaction:
            record.interaction ||
            null,

          mechanisms: {
            absorption:
              record.absorption ===
              "1",

            antagonisticEffect:
              record.antagonistic_effect ===
              "1",

            distribution:
              record.distribution ===
              "1",

            metabolism:
              record.metabolism ===
              "1",

            excretion:
              record.excretion ===
              "1",

            synergisticEffect:
              record.synergistic_effect ===
              "1",

            others:
              record.others ===
              "1",
          },
        });
      }

      if (
        interactions.length >= 10
      ) {
        break;
      }
    }

    return res.json({
      query: name,

      aliases:
        result.aliases,

      ddinterIds:
        result.ids,

      found:
        result.ids.length > 0,

      sampleInteractions:
        interactions,

      databaseStats: {
        totalRecords:
          ddinterRecords.length,

        uniqueDrugNames:
          drugIndex.size,

        uniquePairs:
          pairIndex.size,
      },
    });
  }
);

export default router;