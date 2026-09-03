
import express from "express";
import axios from "axios";

const router = express.Router();

/*
==================================================
API BASE URLS
==================================================
*/

const RXNORM_URL = "https://rxnav.nlm.nih.gov/REST";
const FDA_URL = "https://api.fda.gov/drug/label.json";
const DRUGDB_URL = "https://drugdb.in";
const DAILYMED_URL =
  "https://dailymed.nlm.nih.gov/dailymed/services/v2";

/*
==================================================
AXIOS CLIENTS
==================================================
*/

const rxnorm = axios.create({
  baseURL: RXNORM_URL,
  timeout: 15000,
});

const drugdb = axios.create({
  baseURL: DRUGDB_URL,
  timeout: 15000,
});

const fda = axios.create({
  baseURL: FDA_URL,
  timeout: 15000,
});

const dailymed = axios.create({
  baseURL: DAILYMED_URL,
  timeout: 20000,
});

/*
==================================================
TEXT HELPERS
==================================================
*/

const normalizeText = (value = "") => {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.-]/g, "");
};

const normalizeIngredientName = (value = "") => {
  return normalizeText(value)
    .replace(
      /\b\d+(?:\.\d+)?\s*(mg|mcg|g|kg|ml|l|%|iu)\b/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
};

const safeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [value];
};

/*
==================================================
KNOWN BRAND FALLBACKS
==================================================

These are used ONLY when a brand is known but
DrugDB/RxNorm cannot produce a usable result.

Becosules is an Indian Pfizer brand containing
B-complex + Vitamin C.

We do NOT invent an RxCUI for the whole brand.

Instead we use a valid RxNorm ingredient where
possible and preserve the brand name.
==================================================
*/

const KNOWN_BRANDS = {
  becosules: {
    brand: "Becosules",
    manufacturer: "Pfizer Limited",
    genericName: "B-Complex Forte with Vitamin C",
    ingredientSearches: [
      "thiamine",
      "riboflavin",
      "pyridoxine",
      "niacinamide",
      "folic acid",
      "biotin",
      "ascorbic acid",
    ],
  },
};

/*
==================================================
GET KNOWN BRAND
==================================================
*/

const getKnownBrand = (query = "") => {
  const normalized = normalizeText(query);

  if (KNOWN_BRANDS[normalized]) {
    return KNOWN_BRANDS[normalized];
  }

  return null;
};

/*
==================================================
EXTRACT GENERIC INGREDIENT NAMES
==================================================
*/

const extractGenericIngredients = (genericName = "") => {
  if (!genericName) {
    return [];
  }

  let text = String(genericName);

  /*
  Remove parentheses.
  */
  text = text.replace(/\([^)]*\)/g, " ");

  /*
  Remove strengths.

  Examples:
  650 mg
  500 mg
  5 mL
  1 g
  100 mg/mL
  */
  text = text.replace(
    /\d+(?:\.\d+)?\s*(mg|mcg|g|kg|ml|l|%|iu)(?:\s*\/\s*\d+(?:\.\d+)?\s*(mg|mcg|g|kg|ml|l))?/gi,
    " "
  );

  /*
  Remove common dosage-form words.
  */
  const wordsToRemove = [
    "oral",
    "tablet",
    "tablets",
    "capsule",
    "capsules",
    "caplet",
    "caplets",
    "suspension",
    "solution",
    "syrup",
    "injection",
    "injectable",
    "cream",
    "ointment",
    "gel",
    "drops",
    "drop",
    "inhalation",
    "inhaler",
    "powder",
    "granules",
    "film-coated",
    "coated",
    "extended-release",
    "delayed-release",
    "immediate-release",
    "chewable",
    "dispersible",
    "effervescent",
    "modified-release",
    "prolonged-release",
    "controlled-release",
    "for",
    "infusion",
  ];

  for (const word of wordsToRemove) {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const wordRegex = new RegExp(
      `\\b${escapedWord}\\b`,
      "gi"
    );

    text = text.replace(wordRegex, " ");
  }

  /*
  Normalize plus signs.
  */
  text = text.replace(/\+/g, " and ");

  /*
  Split combination medicines.
  */
  const parts = text.split(/\s+and\s+/i);

  return [
    ...new Set(
      parts
        .map((item) =>
          item
            .replace(/\s+/g, " ")
            .trim()
        )
        .filter(
          (item) =>
            item.length > 0 &&
            !/^\d+$/.test(item)
        )
    ),
  ];
};

/*
==================================================
EXTRACT GENERIC NAMES FROM DRUGDB
==================================================
*/

const extractGenericNames = (
  drugResult,
  genericDetails
) => {
  const names = [];

  /*
  Direct DrugDB generic name.
  */
  if (drugResult?.["generic.genericName"]) {
    names.push(
      drugResult["generic.genericName"]
    );
  }

  /*
  Generic details.
  */
  const possibleValues = [
    genericDetails?.genericName,
    genericDetails?.name,
    genericDetails?.generic?.name,
    genericDetails?.generic?.genericName,
    genericDetails?.description,
  ];

  for (const value of possibleValues) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      names.push(value);
    }
  }

  /*
  Components / ingredients.
  */
  const componentCollections = [
    genericDetails?.components,
    genericDetails?.ingredients,
    genericDetails?.composition,
    genericDetails?.genericIngredients,
  ];

  for (const collection of componentCollections) {
    if (!Array.isArray(collection)) {
      continue;
    }

    for (const component of collection) {
      if (typeof component === "string") {
        names.push(component);
        continue;
      }

      if (
        component &&
        typeof component === "object"
      ) {
        const value =
          component.name ||
          component.ingredientName ||
          component.substanceName ||
          component.ingredient;

        if (value) {
          names.push(value);
        }
      }
    }
  }

  /*
  Convert generic strings into ingredient-like names.
  */
  const ingredients = [];

  for (const name of names) {
    const extracted =
      extractGenericIngredients(name);

    if (extracted.length > 0) {
      ingredients.push(...extracted);
    }
  }

  /*
  Fallback.
  */
  if (ingredients.length === 0) {
    ingredients.push(...names);
  }

  return [
    ...new Set(
      ingredients
        .map((name) => String(name).trim())
        .filter(Boolean)
    ),
  ];
};

/*
==================================================
DRUGDB SEARCH
==================================================
*/

const searchDrugDB = async (query) => {
  try {
    console.log("================================");
    console.log("DRUGDB SEARCH");
    console.log("Query:", query);
    console.log("================================");

    const response = await drugdb.get(
      "/search",
      {
        params: {
          q: query,
          type: "medicine",
          limit: 20,
        },
      }
    );

    const results =
      response.data?.results || [];

    console.log(
      "DrugDB results:",
      results.length
    );

    return results;
  } catch (error) {
    console.error(
      "DrugDB search failed:",
      error.response?.data ||
        error.message
    );

    return [];
  }
};

/*
==================================================
CHOOSE BEST DRUGDB RESULT
==================================================
*/

const chooseBestDrugDBResult = (
  results,
  originalQuery
) => {
  if (!results.length) {
    return null;
  }

  const query = normalizeText(
    originalQuery
  );

  const queryWords = query
    .split(/\s+/)
    .filter(Boolean);

  const scored = results.map((item) => {
    const medicineName =
      normalizeText(
        item.medicineName || ""
      );

    const brandName =
      normalizeText(
        item["brand.brandName"] || ""
      );

    const genericName =
      normalizeText(
        item["generic.genericName"] || ""
      );

    let score = 0;

    /*
    Exact brand.
    */
    if (brandName === query) {
      score += 150;
    }

    /*
    Exact medicine.
    */
    if (medicineName === query) {
      score += 140;
    }

    /*
    Starts with query.
    */
    if (brandName.startsWith(query)) {
      score += 70;
    }

    if (medicineName.startsWith(query)) {
      score += 60;
    }

    /*
    Contains query.
    */
    if (medicineName.includes(query)) {
      score += 30;
    }

    if (brandName.includes(query)) {
      score += 25;
    }

    /*
    Generic exists.
    */
    if (genericName) {
      score += 15;
    }

    /*
    SCTID exists.
    */
    if (item.medicineSctid) {
      score += 5;
    }

    /*
    Reward matching words.
    */
    for (const word of queryWords) {
      if (medicineName.includes(word)) {
        score += 20;
      }

      if (brandName.includes(word)) {
        score += 15;
      }

      if (genericName.includes(word)) {
        score += 10;
      }
    }

    /*
    Penalize related products when an exact
    brand exists.
    */
    if (
      brandName !== query &&
      brandName.startsWith(query)
    ) {
      score -= 5;
    }

    return {
      item,
      score,
    };
  });

  scored.sort(
    (a, b) =>
      b.score - a.score
  );

  console.log(
    "DrugDB ranking:",
    scored.slice(0, 5).map(
      (entry) => ({
        name:
          entry.item.medicineName,
        brand:
          entry.item[
            "brand.brandName"
          ],
        generic:
          entry.item[
            "generic.genericName"
          ],
        score:
          entry.score,
      })
    )
  );

  return (
    scored[0]?.item || null
  );
};

/*
==================================================
DRUGDB MEDICINE DETAILS
==================================================
*/

const getDrugDBMedicine = async (
  sctid
) => {
  if (!sctid) {
    return null;
  }

  try {
    const response =
      await drugdb.get(
        `/dis/medicine/${encodeURIComponent(
          sctid
        )}`
      );

    return response.data || null;
  } catch (error) {
    console.log(
      "DrugDB medicine detail unavailable:",
      error.response?.status ||
        error.message
    );

    return null;
  }
};

/*
==================================================
DRUGDB GENERIC DETAILS
==================================================
*/

const getDrugDBGeneric = async (
  sctid
) => {
  if (!sctid) {
    return null;
  }

  try {
    const response =
      await drugdb.get(
        `/dis/generic/${encodeURIComponent(
          sctid
        )}`
      );

    return response.data || null;
  } catch (error) {
    console.log(
      "DrugDB generic detail unavailable:",
      error.response?.status ||
        error.message
    );

    return null;
  }
};

/*
==================================================
RXNORM SEARCH
==================================================
*/

const searchRxNorm = async (
  name
) => {
  try {
    console.log(
      "RxNorm search:",
      name
    );

    const response =
      await rxnorm.get(
        "/drugs.json",
        {
          params: {
            name,
          },
        }
      );

    const groups =
      response.data
        ?.drugGroup
        ?.conceptGroup || [];

    const concepts = [];

    for (const group of groups) {
      for (
        const concept of
        group.conceptProperties || []
      ) {
        concepts.push({
          rxcui: concept.rxcui,
          name: concept.name,
          synonym: concept.synonym,
          tty: concept.tty,
          language: concept.language,
        });
      }
    }

    return concepts;
  } catch (error) {
    console.log(
      "RxNorm search failed:",
      name,
      error.message
    );

    return [];
  }
};

/*
==================================================
RXNORM APPROXIMATE SEARCH
==================================================
*/

const approximateRxNorm = async (
  name
) => {
  try {
    const response =
      await rxnorm.get(
        "/approximateTerm.json",
        {
          params: {
            term: name,
            maxEntries: 10,
            option: 0,
          },
        }
      );

    return (
      response.data
        ?.approximateGroup
        ?.candidate || []
    );
  } catch (error) {
    console.log(
      "RxNorm approximate search failed:",
      error.message
    );

    return [];
  }
};

/*
==================================================
RXNORM PROPERTIES
==================================================
*/

const getRxNormProperties = async (
  rxcui
) => {
  try {
    const response =
      await rxnorm.get(
        `/rxcui/${rxcui}/properties.json`
      );

    return (
      response.data?.properties ||
      null
    );
  } catch (error) {
    return null;
  }
};

/*
==================================================
RESOLVE INGREDIENT TO RXNORM
==================================================
*/

const resolveIngredientToRxNorm =
  async (ingredient) => {
    if (!ingredient) {
      return null;
    }

    /*
    1. Direct search.
    */
    let concepts =
      await searchRxNorm(
        ingredient
      );

    const ingredientConcept =
      concepts.find(
        (concept) =>
          concept.tty === "IN" ||
          concept.tty === "PIN"
      );

    if (ingredientConcept) {
      return ingredientConcept;
    }

    /*
    2. Cleaned ingredient.
    */
    const cleaned =
      normalizeIngredientName(
        ingredient
      );

    if (
      cleaned &&
      cleaned !==
        normalizeText(ingredient)
    ) {
      concepts =
        await searchRxNorm(
          cleaned
        );

      const cleanedConcept =
        concepts.find(
          (concept) =>
            concept.tty === "IN" ||
            concept.tty === "PIN"
        );

      if (cleanedConcept) {
        return cleanedConcept;
      }
    }

    /*
    3. Approximate matching.
    */
    const candidates =
      await approximateRxNorm(
        cleaned || ingredient
      );

    for (
      const candidate of candidates
    ) {
      if (!candidate.rxcui) {
        continue;
      }

      const properties =
        await getRxNormProperties(
          candidate.rxcui
        );

      if (!properties) {
        continue;
      }

      if (
        properties.tty === "IN" ||
        properties.tty === "PIN"
      ) {
        return {
          rxcui:
            properties.rxcui,
          name:
            properties.name,
          synonym:
            properties.synonym,
          tty:
            properties.tty,
        };
      }
    }

    return null;
  };

/*
==================================================
RESOLVE DRUGDB → RXNORM
==================================================
*/

const resolveDrugDBToRxNorm =
  async (
    drugResult,
    genericDetails
  ) => {
    const genericNames =
      extractGenericNames(
        drugResult,
        genericDetails
      );

    console.log(
      "Generic names extracted:",
      genericNames
    );

    const resolved = [];

    for (
      const genericName of genericNames
    ) {
      const ingredient =
        await resolveIngredientToRxNorm(
          genericName
        );

      if (ingredient) {
        resolved.push(
          ingredient
        );
      }
    }

    return resolved.filter(
      (item, index, array) =>
        index ===
        array.findIndex(
          (other) =>
            other.rxcui ===
            item.rxcui
        )
    );
  };

/*
==================================================
GET RXNORM INGREDIENTS
==================================================
*/

const getIngredients = async (
  rxcui
) => {
  try {
    const response =
      await rxnorm.get(
        `/rxcui/${rxcui}/allrelated.json`
      );

    const groups =
      response.data
        ?.allRelatedGroup
        ?.conceptGroup || [];

    const ingredients = [];

    for (const group of groups) {
      if (
        group.tty !== "IN" &&
        group.tty !== "PIN"
      ) {
        continue;
      }

      for (
        const ingredient of
        group.conceptProperties || []
      ) {
        ingredients.push({
          rxcui:
            ingredient.rxcui,
          name:
            ingredient.name,
        });
      }
    }

    return ingredients.filter(
      (item, index, array) =>
        index ===
        array.findIndex(
          (other) =>
            other.rxcui ===
            item.rxcui
        )
    );
  } catch (error) {
    console.log(
      "RxNorm ingredient lookup failed:",
      error.message
    );

    return [];
  }
};

/*
==================================================
FDA LABEL BY INGREDIENT
==================================================
*/

const findFDALabelByIngredient =
  async (ingredientName) => {
    if (!ingredientName) {
      return null;
    }

    const cleaned =
      normalizeIngredientName(
        ingredientName
      );

    if (!cleaned) {
      return null;
    }

    try {
      console.log(
        "FDA ingredient search:",
        cleaned
      );

      const response =
        await fda.get(
          "",
          {
            params: {
              search:
                `active_ingredient:"${cleaned}"`,
              limit: 1,
            },
          }
        );

      return (
        response.data
          ?.results?.[0] ||
        null
      );
    } catch (error) {
      console.log(
        "FDA ingredient search failed:",
        error.response?.status ||
          error.message
      );

      return null;
    }
  };

/*
==================================================
FDA LABEL BY BRAND
==================================================
*/

const findFDALabelByBrand =
  async (brandName) => {
    if (!brandName) {
      return null;
    }

    try {
      console.log(
        "FDA brand search:",
        brandName
      );

      const response =
        await fda.get(
          "",
          {
            params: {
              search:
                `openfda.brand_name:"${brandName}"`,
              limit: 1,
            },
          }
        );

      return (
        response.data
          ?.results?.[0] ||
        null
      );
    } catch (error) {
      console.log(
        "FDA brand search failed:",
        error.response?.status ||
          error.message
      );

      return null;
    }
  };

/*
==================================================
DAILYMED SEARCH BY RXCUI
==================================================
*/

const findDailyMedByRxCUI =
  async (rxcui) => {
    if (!rxcui) {
      return null;
    }

    try {
      console.log(
        "DailyMed RxCUI search:",
        rxcui
      );

      const response =
        await dailymed.get(
          "/spls.json",
          {
            params: {
              rxcui,
              pagesize: 10,
              page: 1,
            },
          }
        );

      const results =
        response.data?.data || [];

      if (
        !Array.isArray(results) ||
        results.length === 0
      ) {
        console.log(
          "DailyMed: no RxCUI labels found"
        );

        return null;
      }

      results.sort((a, b) => {
        const dateA =
          new Date(
            a.published_date || 0
          ).getTime();

        const dateB =
          new Date(
            b.published_date || 0
          ).getTime();

        return dateB - dateA;
      });

      return results[0];
    } catch (error) {
      console.log(
        "DailyMed RxCUI search failed:",
        error.response?.status ||
          error.message
      );

      return null;
    }
  };

/*
==================================================
DAILYMED SEARCH BY DRUG NAME
==================================================
*/

const findDailyMedByName =
  async (drugName) => {
    if (!drugName) {
      return null;
    }

    try {
      console.log(
        "DailyMed drug-name search:",
        drugName
      );

      const response =
        await dailymed.get(
          "/spls.json",
          {
            params: {
              drug_name:
                drugName,
              name_type: "both",
              pagesize: 10,
              page: 1,
            },
          }
        );

      const results =
        response.data?.data || [];

      if (
        !Array.isArray(results) ||
        results.length === 0
      ) {
        return null;
      }

      results.sort((a, b) => {
        const dateA =
          new Date(
            a.published_date || 0
          ).getTime();

        const dateB =
          new Date(
            b.published_date || 0
          ).getTime();

        return dateB - dateA;
      });

      return results[0];
    } catch (error) {
      console.log(
        "DailyMed drug-name search failed:",
        error.response?.status ||
          error.message
      );

      return null;
    }
  };

/*
==================================================
DAILYMED GET SPL DOCUMENT
==================================================
*/

const getDailyMedDocument =
  async (setid) => {
    if (!setid) {
      return null;
    }

    try {
      console.log(
        "DailyMed SPL document:",
        setid
      );

      const response =
        await dailymed.get(
          `/spls/${encodeURIComponent(
            setid
          )}.xml`,
          {
            responseType: "text",
          }
        );

      return (
        response.data || null
      );
    } catch (error) {
      console.log(
        "DailyMed SPL document failed:",
        error.response?.status ||
          error.message
      );

      return null;
    }
  };

/*
==================================================
XML HELPERS
==================================================
*/

const decodeXmlText = (value = "") => {
  return String(value)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

const stripXml = (value = "") => {
  return decodeXmlText(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/*
==================================================
EXTRACT DAILYMED SECTION
==================================================
*/

const extractDailyMedSection = (
  xml,
  titlePatterns = []
) => {
  if (!xml) {
    return null;
  }

  for (
    const pattern of titlePatterns
  ) {
    const escaped =
      pattern.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const regex =
      new RegExp(
        `<title[^>]*>\\s*${escaped}[\\s\\S]*?<\\/title>([\\s\\S]*?)(?:<section|<\\/section>)`,
        "i"
      );

    const match =
      xml.match(regex);

    if (match?.[1]) {
      const text =
        stripXml(match[1]);

      if (text.length > 20) {
        return text;
      }
    }
  }

  for (
    const pattern of titlePatterns
  ) {
    const escaped =
      pattern.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const regex =
      new RegExp(
        `<title[^>]*>[^<]*${escaped}[^<]*<\\/title>([\\s\\S]{20,50000})`,
        "i"
      );

    const match =
      xml.match(regex);

    if (match?.[1]) {
      const text =
        stripXml(match[1]);

      if (text.length > 20) {
        return text.slice(
          0,
          12000
        );
      }
    }
  }

  return null;
};

/*
==================================================
PARSE DAILYMED LABEL
==================================================
*/

const parseDailyMedLabel = (
  xml,
  metadata
) => {
  if (!xml) {
    return null;
  }

  return {
    setid:
      metadata?.setid || null,

    title:
      metadata?.title || null,

    publishedDate:
      metadata?.published_date ||
      null,

    description:
      extractDailyMedSection(
        xml,
        ["DESCRIPTION"]
      ),

    purpose:
      extractDailyMedSection(
        xml,
        [
          "PURPOSE",
          "INDICATIONS AND USAGE",
        ]
      ),

    indications:
      extractDailyMedSection(
        xml,
        ["INDICATIONS AND USAGE"]
      ),

    dosage:
      extractDailyMedSection(
        xml,
        ["DOSAGE AND ADMINISTRATION"]
      ),

    warnings:
      extractDailyMedSection(
        xml,
        [
          "WARNINGS",
          "WARNINGS AND PRECAUTIONS",
        ]
      ),

    contraindications:
      extractDailyMedSection(
        xml,
        ["CONTRAINDICATIONS"]
      ),

    adverseReactions:
      extractDailyMedSection(
        xml,
        ["ADVERSE REACTIONS"]
      ),

    pregnancy:
      extractDailyMedSection(
        xml,
        [
          "PREGNANCY",
          "USE IN SPECIFIC POPULATIONS",
        ]
      ),

    breastfeeding:
      extractDailyMedSection(
        xml,
        [
          "LACTATION",
          "NURSING MOTHERS",
        ]
      ),

    storage:
      extractDailyMedSection(
        xml,
        [
          "STORAGE",
          "STORAGE AND HANDLING",
        ]
      ),
  };
};

/*
==================================================
GET DAILYMED LABEL
==================================================
*/

const getDailyMedLabel = async ({
  rxcui,
  rxnormName,
  brandName,
  genericName,
}) => {
  let metadata = null;

  /*
  1. RxCUI
  */
  if (rxcui) {
    metadata =
      await findDailyMedByRxCUI(
        rxcui
      );
  }

  /*
  2. RxNorm name
  */
  if (!metadata && rxnormName) {
    metadata =
      await findDailyMedByName(
        rxnormName
      );
  }

  /*
  3. Brand
  */
  if (!metadata && brandName) {
    metadata =
      await findDailyMedByName(
        brandName
      );
  }

  /*
  4. Generic
  */
  if (!metadata && genericName) {
    metadata =
      await findDailyMedByName(
        genericName
      );
  }

  if (!metadata) {
    console.log(
      "DailyMed: no label found"
    );

    return null;
  }

  console.log(
    "DailyMed label found:",
    metadata.title
  );

  const xml =
    await getDailyMedDocument(
      metadata.setid
    );

  if (!xml) {
    return {
      ...metadata,
      parsed: null,
    };
  }

  const parsed =
    parseDailyMedLabel(
      xml,
      metadata
    );

  return {
    ...metadata,
    parsed,
  };
};

/*
==================================================
FDA INGREDIENT EXTRACTION
==================================================
*/

const extractFDAIngredients = (
  label
) => {
  if (!label) {
    return [];
  }

  return safeArray(
    label.active_ingredient
  )
    .filter(
      (value) =>
        typeof value === "string"
    )
    .map((value) =>
      value.trim()
    )
    .filter(Boolean);
};

/*
==================================================
KNOWN BRAND SEARCH
==================================================

Used when a medicine is a real Indian brand but
DrugDB/RxNorm does not give a complete mapping.

For Becosules, we try to resolve its ingredients
through RxNorm and return the brand while keeping
the first valid ingredient RxCUI.

==================================================
*/

const searchKnownBrand = async (
  query
) => {
  const knownBrand =
    getKnownBrand(query);

  if (!knownBrand) {
    return null;
  }

  console.log(
    "Known brand fallback:",
    knownBrand.brand
  );

  const resolvedIngredients = [];

  for (
    const ingredientName of
    knownBrand.ingredientSearches
  ) {
    const resolved =
      await resolveIngredientToRxNorm(
        ingredientName
      );

    if (resolved) {
      resolvedIngredients.push(
        resolved
      );
    }
  }

  /*
  Remove duplicate RxCUIs.
  */
  const uniqueIngredients =
    resolvedIngredients.filter(
      (item, index, array) =>
        index ===
        array.findIndex(
          (other) =>
            other.rxcui ===
            item.rxcui
        )
    );

  /*
  If at least one ingredient was resolved,
  use its RxCUI as the detail anchor.
  */
  const primary =
    uniqueIngredients[0] || null;

  return {
    rxcui:
      primary?.rxcui || null,

    name:
      knownBrand.brand,

    type: "BRAND",

    ingredient:
      uniqueIngredients.length
        ? uniqueIngredients
            .map(
              (item) =>
                item.name
            )
            .join(", ")
        : knownBrand.genericName,

    genericName:
      knownBrand.genericName,

    brand:
      knownBrand.brand,

    manufacturer:
      knownBrand.manufacturer,

    ingredients:
      uniqueIngredients,

    source:
      "KNOWN_BRAND",
  };
};

/*
==================================================
SEARCH MEDICINES
==================================================

GET /api/medicines/search?name=dolo

FRONTEND CONTRACT:

[
  {
    rxcui,
    name,
    type,
    ingredient,
    genericName,
    brand,
    source
  }
]

==================================================
*/

router.get(
  "/search",
  async (req, res) => {
    const originalName =
      String(
        req.query.name || ""
      ).trim();

    console.log(
      "================================"
    );

    console.log(
      "MEDICINE SEARCH"
    );

    console.log(
      "Search:",
      originalName
    );

    console.log(
      "================================"
    );

    if (!originalName) {
      return res.status(400).json({
        message:
          "Medicine name is required",
      });
    }

    try {
      /*
      ================================================
      STEP 1
      DRUGDB
      ================================================
      */

      const drugResults =
        await searchDrugDB(
          originalName
        );

      const bestDrug =
        chooseBestDrugDBResult(
          drugResults,
          originalName
        );

      /*
      ================================================
      STEP 2
      DRUGDB → RXNORM
      ================================================
      */

      if (bestDrug) {
        console.log(
          "Best DrugDB result:",
          bestDrug
        );

        const genericSctid =
          bestDrug[
            "generic.sctid"
          ];

        const genericDetails =
          await getDrugDBGeneric(
            genericSctid
          );

        const rxnormIngredients =
          await resolveDrugDBToRxNorm(
            bestDrug,
            genericDetails
          );

        /*
        Normal DrugDB → RxNorm success.
        */
        if (
          rxnormIngredients.length >
          0
        ) {
          const primary =
            rxnormIngredients[0];

          const result = {
            rxcui:
              primary.rxcui,

            name:
              bestDrug.medicineName ||
              originalName,

            type: "BRAND",

            ingredient:
              rxnormIngredients
                .map(
                  (item) =>
                    item.name
                )
                .join(", "),

            genericName:
              bestDrug[
                "generic.genericName"
              ] ||
              rxnormIngredients
                .map(
                  (item) =>
                    item.name
                )
                .join(", "),

            brand:
              bestDrug[
                "brand.brandName"
              ] ||
              originalName,

            manufacturer:
              bestDrug[
                "manufacturer.manufacturerName"
              ] || null,

            drugdbMedicineSctid:
              bestDrug.medicineSctid,

            drugdbGenericSctid:
              genericSctid,

            source:
              "DRUGDB_RXNORM",
          };

          console.log(
            "Dynamic brand resolution successful:",
            result
          );

          return res.json([
            result,
          ]);
        }

        /*
        ============================================
        IMPORTANT NEW FALLBACK
        ============================================

        DrugDB found the brand, but RxNorm did not
        resolve its ingredients.

        Return the DrugDB brand instead of throwing
        the result away.

        This is especially useful for Indian brands.
        ============================================
        */

        const drugDBFallback = {
          rxcui: null,

          name:
            bestDrug.medicineName ||
            originalName,

          type: "BRAND",

          ingredient:
            genericDetails
              ? extractGenericNames(
                  bestDrug,
                  genericDetails
                ).join(", ")
              : bestDrug[
                  "generic.genericName"
                ] || null,

          genericName:
            bestDrug[
              "generic.genericName"
            ] || null,

          brand:
            bestDrug[
              "brand.brandName"
            ] ||
            originalName,

          manufacturer:
            bestDrug[
              "manufacturer.manufacturerName"
            ] || null,

          drugdbMedicineSctid:
            bestDrug.medicineSctid ||
            null,

          drugdbGenericSctid:
            genericSctid || null,

          source:
            "DRUGDB",
        };

        console.log(
          "DrugDB fallback result:",
          drugDBFallback
        );

        /*
        Only return the DrugDB fallback if it
        actually matches the user's query.
        */
        const normalizedQuery =
          normalizeText(
            originalName
          );

        const fallbackBrand =
          normalizeText(
            drugDBFallback.brand
          );

        const fallbackMedicine =
          normalizeText(
            drugDBFallback.name
          );

        if (
          fallbackBrand.includes(
            normalizedQuery
          ) ||
          fallbackMedicine.includes(
            normalizedQuery
          ) ||
          normalizedQuery.includes(
            fallbackBrand
          )
        ) {
          return res.json([
            drugDBFallback,
          ]);
        }
      }

      /*
      ================================================
      STEP 3
      KNOWN BRAND FALLBACK
      ================================================
      */

      const knownBrandResult =
        await searchKnownBrand(
          originalName
        );

      if (knownBrandResult) {
        console.log(
          "Known brand resolved:",
          knownBrandResult
        );

        return res.json([
          knownBrandResult,
        ]);
      }

      /*
      ================================================
      STEP 4
      RXNORM DIRECT SEARCH
      ================================================
      */

      console.log(
        "DrugDB could not resolve query."
      );

      console.log(
        "Trying RxNorm directly..."
      );

      const rxnormResults =
        await searchRxNorm(
          originalName
        );

      if (
        rxnormResults.length > 0
      ) {
        const preferred =
          rxnormResults.find(
            (item) =>
              item.tty === "IN" ||
              item.tty === "PIN"
          ) ||
          rxnormResults[0];

        return res.json([
          {
            rxcui:
              preferred.rxcui,

            name:
              preferred.name,

            type:
              preferred.tty,

            ingredient:
              preferred.name,

            genericName:
              preferred.name,

            brand: null,

            source:
              "RXNORM",
          },
        ]);
      }

      /*
      ================================================
      STEP 5
      RXNORM APPROXIMATE FALLBACK
      ================================================
      */

      const candidates =
        await approximateRxNorm(
          originalName
        );

      for (
        const candidate of candidates
      ) {
        if (!candidate.rxcui) {
          continue;
        }

        const properties =
          await getRxNormProperties(
            candidate.rxcui
          );

        if (!properties) {
          continue;
        }

        const query =
          normalizeText(
            originalName
          );

        const candidateName =
          normalizeText(
            properties.name
          );

        if (
          candidateName === query &&
          (
            properties.tty ===
              "IN" ||
            properties.tty ===
              "PIN"
          )
        ) {
          return res.json([
            {
              rxcui:
                properties.rxcui,

              name:
                properties.name,

              type:
                properties.tty,

              ingredient:
                properties.name,

              genericName:
                properties.name,

              brand: null,

              source:
                "RXNORM_APPROXIMATE",
            },
          ]);
        }
      }

      /*
      ================================================
      NOTHING FOUND
      ================================================
      */

      console.log(
        "No trustworthy medicine found."
      );

      return res.json([]);
    } catch (error) {
      console.error(
        "================================"
      );

      console.error(
        "MEDICINE SEARCH ERROR"
      );

      console.error(
        error.response?.data ||
          error.message
      );

      console.error(
        "================================"
      );

      return res.status(500).json({
        message:
          "Unable to search medicine database",

        error:
          error.message,
      });
    }
  }
);

/*
==================================================
MEDICINE DETAILS
==================================================

GET /api/medicines/:rxcui

Existing MedicineDetails.jsx remains compatible.

==================================================
*/

router.get(
  "/:rxcui",
  async (req, res) => {
    const { rxcui } =
      req.params;

    try {
      console.log(
        "================================"
      );

      console.log(
        "MEDICINE DETAILS"
      );

      console.log(
        "RxCUI:",
        rxcui
      );

      console.log(
        "================================"
      );

      /*
      ================================================
      1. RXNORM PROPERTIES
      ================================================
      */

      const properties =
        await getRxNormProperties(
          rxcui
        );

      /*
      ================================================
      IMPORTANT

      If search returned a DrugDB-only result
      with rxcui=null, the frontend should not call
      this endpoint.

      But if it does, handle it safely.
      ================================================
      */

      if (!properties) {
        return res.status(404).json({
          message:
            "Medicine not found in RxNorm",
        });
      }

      /*
      ================================================
      2. RXNORM INGREDIENTS
      ================================================
      */

      let ingredients =
        await getIngredients(
          rxcui
        );

      if (
        ingredients.length === 0 &&
        properties.name
      ) {
        ingredients = [
          {
            rxcui:
              properties.rxcui,

            name:
              properties.name,
          },
        ];
      }

      /*
      ================================================
      3. DRUGDB SEARCH
      ================================================
      */

      let drugDBResult =
        null;

      try {
        const drugResults =
          await searchDrugDB(
            properties.name
          );

        drugDBResult =
          chooseBestDrugDBResult(
            drugResults,
            properties.name
          );
      } catch (error) {
        console.log(
          "DrugDB detail lookup failed:",
          error.message
        );
      }

      /*
      ================================================
      4. DRUGDB GENERIC DETAILS
      ================================================
      */

      let genericDetails =
        null;

      if (drugDBResult) {
        genericDetails =
          await getDrugDBGeneric(
            drugDBResult[
              "generic.sctid"
            ]
          );
      }

      /*
      ================================================
      5. ADD DRUGDB INGREDIENT INFORMATION
      ================================================
      */

      if (drugDBResult) {
        const drugDBNames =
          extractGenericNames(
            drugDBResult,
            genericDetails
          );

        for (
          const genericName of
          drugDBNames
        ) {
          const normalized =
            normalizeIngredientName(
              genericName
            );

          const alreadyExists =
            ingredients.some(
              (item) =>
                normalizeIngredientName(
                  item.name
                ) === normalized
            );

          if (
            !alreadyExists &&
            genericName
          ) {
            ingredients.push({
              rxcui: null,
              name: genericName,
            });
          }
        }
      }

      /*
      ================================================
      6. FDA LABEL
      ================================================
      */

      let fdaLabel = null;

      /*
      First try actual ingredients.
      */

      if (
        ingredients.length > 0
      ) {
        for (
          const ingredient of
          ingredients
        ) {
          fdaLabel =
            await findFDALabelByIngredient(
              ingredient.name
            );

          if (fdaLabel) {
            break;
          }
        }
      }

      /*
      Try RxNorm name.
      */

      if (
        !fdaLabel &&
        properties.name
      ) {
        fdaLabel =
          await findFDALabelByIngredient(
            properties.name
          );
      }

      /*
      Try DrugDB brand.
      */

      if (
        !fdaLabel &&
        drugDBResult
      ) {
        fdaLabel =
          await findFDALabelByBrand(
            drugDBResult[
              "brand.brandName"
            ]
          );
      }

      /*
      ================================================
      7. DAILYMED FALLBACK
      ================================================
      */

      let dailyMedLabel =
        null;

      if (!fdaLabel) {
        console.log(
          "FDA label unavailable."
        );

        console.log(
          "Trying DailyMed fallback..."
        );

        dailyMedLabel =
          await getDailyMedLabel({
            rxcui:
              properties.rxcui,

            rxnormName:
              properties.name,

            brandName:
              drugDBResult?.[
                "brand.brandName"
              ],

            genericName:
              drugDBResult?.[
                "generic.genericName"
              ],
          });
      }

      /*
      ================================================
      8. FDA ACTIVE INGREDIENTS
      ================================================
      */

      const fdaActiveIngredients =
        extractFDAIngredients(
          fdaLabel
        );

      /*
      ================================================
      9. BUILD LABEL VALUES
      ================================================
      */

      const dailyMedParsed =
        dailyMedLabel?.parsed ||
        null;

      const description =
        fdaLabel?.description?.[0] ||
        dailyMedParsed?.description ||
        null;

      const purpose =
        fdaLabel?.purpose?.[0] ||
        dailyMedParsed?.purpose ||
        null;

      const indications =
        fdaLabel
          ?.indications_and_usage?.[0] ||
        dailyMedParsed?.indications ||
        null;

      const dosage =
        fdaLabel
          ?.dosage_and_administration?.[0] ||
        dailyMedParsed?.dosage ||
        null;

      const warnings =
        fdaLabel?.warnings?.[0] ||
        dailyMedParsed?.warnings ||
        null;

      const contraindications =
        fdaLabel
          ?.contraindications?.[0] ||
        dailyMedParsed?.contraindications ||
        null;

      const adverseReactions =
        fdaLabel
          ?.adverse_reactions?.[0] ||
        dailyMedParsed?.adverseReactions ||
        null;

      const pregnancy =
        fdaLabel?.pregnancy?.[0] ||
        dailyMedParsed?.pregnancy ||
        null;

      const breastfeeding =
        fdaLabel
          ?.nursing_mothers?.[0] ||
        dailyMedParsed?.breastfeeding ||
        null;

      const storage =
        fdaLabel
          ?.storage_and_handling?.[0] ||
        dailyMedParsed?.storage ||
        null;

      /*
      ================================================
      10. DETERMINE INFORMATION SOURCE
      ================================================
      */

      let labelSource = null;

      if (fdaLabel) {
        labelSource = "FDA";
      } else if (dailyMedLabel) {
        labelSource = "DAILYMED";
      }

      /*
      ================================================
      11. BUILD FINAL MEDICINE OBJECT
      ================================================
      */

      const medicine = {
        /*
        RxNorm
        */

        rxcui:
          properties.rxcui,

        name:
          drugDBResult?.medicineName ||
          properties.name,

        synonym:
          properties.synonym,

        tty:
          properties.tty,

        language:
          properties.language,

        /*
        RxNorm ingredients
        */

        ingredients,

        /*
        DrugDB
        */

        brand:
          drugDBResult?.[
            "brand.brandName"
          ] || null,

        manufacturer:
          drugDBResult?.[
            "manufacturer.manufacturerName"
          ] ||
          fdaLabel
            ?.openfda
            ?.manufacturer_name?.[0] ||
          fdaLabel?.manufacturer?.[0] ||
          null,

        drugdbMedicineSctid:
          drugDBResult?.medicineSctid ||
          null,

        drugdbGenericSctid:
          drugDBResult?.[
            "generic.sctid"
          ] || null,

        drugdbGenericName:
          drugDBResult?.[
            "generic.genericName"
          ] || null,

        /*
        Label information
        */

        description,
        purpose,
        indications,
        dosage,
        warnings,
        contraindications,
        adverseReactions,
        pregnancy,
        breastfeeding,
        storage,

        /*
        Ingredients
        */

        activeIngredient:
          fdaActiveIngredients.length
            ? fdaActiveIngredients
            : ingredients
                .map(
                  (item) =>
                    item.name
                )
                .filter(Boolean),

        inactiveIngredient:
          fdaLabel
            ?.inactive_ingredient ||
          null,

        /*
        Source information
        */

        labelSource,

        fdaLabelAvailable:
          Boolean(fdaLabel),

        dailyMedLabelAvailable:
          Boolean(dailyMedLabel),

        dailyMedSetId:
          dailyMedLabel?.setid ||
          null,

        dailyMedTitle:
          dailyMedLabel?.title ||
          null,

        dailyMedPublishedDate:
          dailyMedLabel
            ?.published_date ||
          null,

        additionalLabelInformation:
          Boolean(
            fdaLabel ||
            dailyMedLabel
          ),

        informationSources: [
          "RxNorm",

          ...(drugDBResult
            ? ["DrugDB"]
            : []),

          ...(fdaLabel
            ? ["FDA"]
            : []),

          ...(dailyMedLabel
            ? ["DailyMed"]
            : []),
        ],
      };

      /*
      ================================================
      12. FINAL FALLBACK
      ================================================
      */

      if (
        !medicine.name &&
        drugDBResult?.medicineName
      ) {
        medicine.name =
          drugDBResult.medicineName;
      }

      /*
      ================================================
      13. LOG
      ================================================
      */

      console.log(
        "Medicine details successfully prepared"
      );

      console.log(
        "Label source:",
        labelSource || "NONE"
      );

      console.log(
        "FDA available:",
        Boolean(fdaLabel)
      );

      console.log(
        "DailyMed available:",
        Boolean(
          dailyMedLabel
        )
      );

      console.log(
        "Information sources:",
        medicine.informationSources
      );

      return res.json(
        medicine
      );
    } catch (error) {
      console.error(
        "================================"
      );

      console.error(
        "MEDICINE DETAILS ERROR"
      );

      console.error(
        error.response?.data ||
          error.message
      );

      console.error(
        "================================"
      );

      return res.status(500).json({
        message:
          "Unable to fetch medicine details",

        error:
          error.message,
      });
    }
  }
);

export default router;

