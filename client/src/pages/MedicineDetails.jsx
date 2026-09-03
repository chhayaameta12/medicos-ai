import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Pill,
  AlertTriangle,
  ShieldCheck,
  Database,
} from "lucide-react";
import { API } from "../services/medicineApi";

function MedicineDetails() {
  const { rxcui } = useParams();

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ==================================================
     FETCH MEDICINE DETAILS
     ================================================== */

  useEffect(() => {
    const fetchMedicine = async () => {
      if (!rxcui) {
        setError("Medicine ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log("================================");
        console.log("MEDICINE DETAILS");
        console.log("RxCUI:", rxcui);
        console.log("================================");

        const response = await API.get(`/medicines/${rxcui}`);

        console.log("Medicine details:", response.data);

        setMedicine(response.data);
      } catch (err) {
        console.error("Medicine details error:", err);

        const message =
          err.response?.data?.message ||
          (err.request
            ? "Medicine server is unavailable. Start the backend and try again."
            : "Unable to load medicine information.");

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [rxcui]);

  /* ==================================================
     LOADING
     ================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />

          <p className="mt-4 text-slate-400">
            Loading medicine information...
          </p>
        </div>
      </div>
    );
  }

  /* ==================================================
     ERROR
     ================================================== */

  if (error || !medicine) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={22}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <h2 className="font-semibold text-red-300">
                  Unable to load medicine
                </h2>

                <p className="mt-2 text-sm text-red-300/70">
                  {error ||
                    "Medicine information could not be found."}
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/search"
            className="mt-6 inline-flex items-center gap-2 text-blue-400 transition hover:text-blue-300"
          >
            <ArrowLeft size={18} />
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  /* ==================================================
     HELPERS
     ================================================== */

  const hasValue = (value) => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === "string") {
      return value.trim() !== "";
    }

    if (Array.isArray(value)) {
      return value.some((item) => hasValue(item));
    }

    if (typeof value === "object") {
      if (hasValue(value.name)) return true;
      if (hasValue(value.ingredient)) return true;
      if (hasValue(value.label)) return true;
      return Object.values(value).some((item) => hasValue(item));
    }

    return String(value).trim() !== "";
  };

  /*
    Converts either:
      "acetaminophen"
    OR
      ["acetaminophen", "phenylephrine"]
    OR
      [{ name: "acetaminophen" }, { name: "phenylephrine" }]

    into a clean string array.
  */

  const normalizeArray = (value) => {
    if (Array.isArray(value)) {
      return value.flatMap((item) => {
        if (typeof item === "string") {
          return hasValue(item) ? [item.trim()] : [];
        }

        if (item && typeof item === "object") {
          if (hasValue(item.name)) return [item.name.trim()];
          if (hasValue(item.ingredient)) return [item.ingredient.trim()];
          if (hasValue(item.label)) return [item.label.trim()];
        }

        return [];
      });
    }

    if (typeof value === "string") {
      return hasValue(value) ? [value.trim()] : [];
    }

    if (value && typeof value === "object") {
      if (hasValue(value.name)) return [value.name.trim()];
      if (hasValue(value.ingredient)) return [value.ingredient.trim()];
      if (hasValue(value.label)) return [value.label.trim()];
    }

    return [];
  };

  const ingredients = normalizeArray(medicine.ingredients);
  const activeIngredients = normalizeArray(medicine.activeIngredient);
  const inactiveIngredients = normalizeArray(medicine.inactiveIngredient);

  /* ==================================================
     TEXT SECTION
     ================================================== */

  const TextSection = ({
    title,
    value,
    warning = false,
  }) => {
    if (!hasValue(value)) {
      return null;
    }

    return (
      <section
        className={
          warning
            ? "mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6"
            : "mt-6 rounded-2xl border border-white/10 bg-white/3 p-6"
        }
      >
        <h2
          className={
            warning
              ? "text-xl font-semibold text-yellow-300"
              : "text-xl font-semibold"
          }
        >
          {title}
        </h2>

        <p className="mt-3 whitespace-pre-line leading-7 text-slate-400">
          {value}
        </p>
      </section>
    );
  };

  /* ==================================================
     INGREDIENT SECTION
     ================================================== */

  const IngredientSection = ({
    title,
    values,
    muted = false,
  }) => {
    if (!values.length) {
      return null;
    }

    return (
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/3 p-6">
        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {values.map((ingredient, index) => (
            <span
              key={`${ingredient}-${index}`}
              className={
                muted
                  ? "rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-400"
                  : "rounded-lg bg-blue-500/10 px-3 py-2 text-sm text-blue-300"
              }
            >
              {ingredient}
            </span>
          ))}
        </div>
      </section>
    );
  };

  /* ==================================================
     RETURN
     ================================================== */

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <Link
            to="/search"
            className="flex w-fit items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to Search
          </Link>
        </div>
      </div>

      {/* ==================================================
          MAIN
          ================================================== */}

      <main className="mx-auto max-w-5xl px-6 py-12">

        {/* ==================================================
            MEDICINE HEADER
            ================================================== */}

        <div className="flex items-start gap-5">

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10">
            <Pill
              size={32}
              className="text-blue-400"
            />
          </div>

          <div className="min-w-0">

            <p className="text-sm uppercase tracking-[0.3em] text-blue-400">
              Medicine Details
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              {medicine.name}
            </h1>

            <div className="mt-3 flex flex-wrap gap-3">

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                RxCUI: {medicine.rxcui}
              </span>

              {medicine.tty && (
                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                  {medicine.tty}
                </span>
              )}

            </div>

          </div>
        </div>

        {/* ==================================================
            DISCLAIMER
            ================================================== */}

        <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">

          <div className="flex items-start gap-3">

            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-blue-400"
            />

            <div>

              <strong className="text-blue-300">
                Medical information
              </strong>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                This information is provided for educational
                purposes and should not replace advice from a
                qualified healthcare professional.
              </p>

            </div>

          </div>

        </div>

        {/* ==================================================
            RXNORM INGREDIENTS
            ================================================== */}

        <IngredientSection
          title="RxNorm Ingredients"
          values={ingredients}
        />

        {/* ==================================================
            FDA ACTIVE INGREDIENTS
            ================================================== */}
        <IngredientSection
          title="Active Ingredients"
          values={activeIngredients}
        />
        
        {/* ==================================================
            FDA INACTIVE INGREDIENTS
            ================================================== */}

        <IngredientSection
          title="Inactive Ingredients"
          values={inactiveIngredients}
          muted
        />

        {/* ==================================================
            DESCRIPTION
            ================================================== */}

        <TextSection
          title="Description"
          value={medicine.description}
        />

        {/* ==================================================
            PURPOSE
            ================================================== */}

        <TextSection
          title="Purpose"
          value={medicine.purpose}
        />

        {/* ==================================================
            USES
            ================================================== */}

        <TextSection
          title="Uses"
          value={medicine.indications}
        />

        {/* ==================================================
            DOSAGE
            ================================================== */}

        <TextSection
          title="Dosage & Administration"
          value={medicine.dosage}
        />

        {/* ==================================================
            SIDE EFFECTS
            ================================================== */}

        <TextSection
          title="Side Effects"
          value={medicine.adverseReactions}
        />

        {/* ==================================================
            WARNINGS
            ================================================== */}

        <TextSection
          title="⚠️ Warnings"
          value={medicine.warnings}
          warning
        />

        {/* ==================================================
            CONTRAINDICATIONS
            ================================================== */}

        <TextSection
          title="Contraindications"
          value={medicine.contraindications}
        />

        {/* ==================================================
            PREGNANCY
            ================================================== */}

        <TextSection
          title="Pregnancy Information"
          value={medicine.pregnancy}
        />

        {/* ==================================================
            BREASTFEEDING
            ================================================== */}

        <TextSection
          title="Breastfeeding"
          value={medicine.breastfeeding}
        />

        {/* ==================================================
            STORAGE
            ================================================== */}

        <TextSection
          title="Storage"
          value={medicine.storage}
        />

        {/* ==================================================
            MANUFACTURER
            ================================================== */}

        <TextSection
          title="Manufacturer"
          value={medicine.manufacturer}
        />

        {/* ==================================================
            NO FDA INFORMATION MESSAGE
            ================================================== */}

        {!hasValue(medicine.description) &&
          !hasValue(medicine.purpose) &&
          !hasValue(medicine.indications) &&
          !hasValue(medicine.dosage) &&
          !hasValue(medicine.warnings) &&
          !hasValue(medicine.adverseReactions) &&
          ingredients.length > 0 && (

            <div className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">

              <div className="flex items-start gap-3">

                <AlertTriangle
                  size={20}
                  className="mt-0.5 shrink-0 text-yellow-400"
                />

                <div>

                  <h2 className="font-semibold text-yellow-300">
                    Additional label information unavailable
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    RxNorm successfully identified this medicine,
                    but a corresponding FDA drug label was not
                    available for this entry.
                  </p>

                </div>

              </div>

            </div>
          )}

        {/* ==================================================
            SOURCE
            ================================================== */}

        <div className="mt-8 flex items-center gap-2 text-xs text-slate-600">

          <Database size={15} />

          Medicine identification: RxNorm

        </div>

      </main>

    </div>
  );
}

export default MedicineDetails;