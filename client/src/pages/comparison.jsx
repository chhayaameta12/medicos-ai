import { useState } from "react";
import {
  ArrowLeft,
  Search,
  GitCompare,
  Pill,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  searchMedicines,
  getMedicineDetails,
} from "../services/medicineApi";

function Comparison() {
  const [medicine1Query, setMedicine1Query] = useState("");
  const [medicine2Query, setMedicine2Query] = useState("");

  const [medicine1Results, setMedicine1Results] = useState([]);
  const [medicine2Results, setMedicine2Results] = useState([]);

  const [medicine1, setMedicine1] = useState(null);
  const [medicine2, setMedicine2] = useState(null);

  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [error, setError] = useState("");

  // Search first medicine
  const handleSearch1 = async () => {
    if (!medicine1Query.trim()) return;

    try {
      setLoading1(true);
      setError("");

      const data = await searchMedicines(medicine1Query);

      setMedicine1Results(data || []);
    } catch (error) {
      console.error("Medicine 1 search error:", error);
      setError("Unable to search first medicine.");
    } finally {
      setLoading1(false);
    }
  };

  // Search second medicine
  const handleSearch2 = async () => {
    if (!medicine2Query.trim()) return;

    try {
      setLoading2(true);
      setError("");

      const data = await searchMedicines(medicine2Query);

      setMedicine2Results(data || []);
    } catch (error) {
      console.error("Medicine 2 search error:", error);
      setError("Unable to search second medicine.");
    } finally {
      setLoading2(false);
    }
  };

  // Select first medicine
  const selectMedicine1 = async (medicine) => {
    try {
      setLoading1(true);
      setMedicine1Results([]);

      const details = await getMedicineDetails(medicine.rxcui);

      setMedicine1(details);
      setMedicine1Query(medicine.name);
    } catch (error) {
      console.error("Medicine 1 details error:", error);
      setError("Unable to load first medicine.");
    } finally {
      setLoading1(false);
    }
  };

  // Select second medicine
  const selectMedicine2 = async (medicine) => {
    try {
      setLoading2(true);
      setMedicine2Results([]);

      const details = await getMedicineDetails(medicine.rxcui);

      setMedicine2(details);
      setMedicine2Query(medicine.name);
    } catch (error) {
      console.error("Medicine 2 details error:", error);
      setError("Unable to load second medicine.");
    } finally {
      setLoading2(false);
    }
  };

  const getIngredientText = (medicine) => {
  if (!medicine) return "—";

  // RxNorm ingredients
  if (Array.isArray(medicine.ingredients)) {
    const names = medicine.ingredients
      .map((ingredient) => {
        if (typeof ingredient === "string") {
          return ingredient;
        }

        if (ingredient && typeof ingredient === "object") {
          return (
            ingredient.name ||
            ingredient.ingredient ||
            ingredient.label ||
            ""
          );
        }

        return "";
      })
      .filter(Boolean);

    if (names.length > 0) {
      return names.join(", ");
    }
  }

  // FDA active ingredient
  if (Array.isArray(medicine.activeIngredient)) {
    return medicine.activeIngredient.join(", ") || "—";
  }

  if (medicine.activeIngredient) {
    return medicine.activeIngredient;
  }

  return "—";
};

  const comparisonRows = [
    {
      label: "Medicine Type",
      value1: medicine1?.tty || "—",
      value2: medicine2?.tty || "—",
    },
    {
      label: "Active Ingredient",
      value1: getIngredientText(medicine1),
      value2: getIngredientText(medicine2),
    },
    {
      label: "Purpose",
      value1: medicine1?.purpose || "—",
      value2: medicine2?.purpose || "—",
    },
    {
      label: "Uses",
      value1: medicine1?.indications || "—",
      value2: medicine2?.indications || "—",
    },
    {
      label: "Dosage & Administration",
      value1: medicine1?.dosage || "—",
      value2: medicine2?.dosage || "—",
    },
    {
      label: "Side Effects",
      value1: medicine1?.adverseReactions || "—",
      value2: medicine2?.adverseReactions || "—",
    },
    {
      label: "Warnings",
      value1: medicine1?.warnings || "—",
      value2: medicine2?.warnings || "—",
    },
    {
      label: "Contraindications",
      value1: medicine1?.contraindications || "—",
      value2: medicine2?.contraindications || "—",
    },
    {
      label: "Pregnancy",
      value1: medicine1?.pregnancy || "—",
      value2: medicine2?.pregnancy || "—",
    },
    {
      label: "Breastfeeding",
      value1: medicine1?.breastfeeding || "—",
      value2: medicine2?.breastfeeding || "—",
    },
    {
      label: "Storage",
      value1: medicine1?.storage || "—",
      value2: medicine2?.storage || "—",
    },
    {
      label: "Manufacturer",
      value1: medicine1?.manufacturer || "—",
      value2: medicine2?.manufacturer || "—",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-5">

          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>

          <div className="mx-auto flex items-center gap-2">
            <GitCompare
              size={20}
              className="text-blue-400"
            />

            <h1 className="text-lg font-semibold">
              Medicine Comparison
            </h1>
          </div>

          <div className="w-24" />

        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-14">

        {/* Title */}
        <div className="text-center">

          <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-400">
            Medicos AI
          </p>

          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            Compare medicines
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Compare medicine information, ingredients, uses,
            dosage, warnings, and safety information side by side.
          </p>

        </div>

        {/* Search boxes */}
        <div className="mt-12 grid gap-8 md:grid-cols-2">

          {/* Medicine 1 */}
          <div className="relative">

            <label className="mb-3 block text-sm font-medium text-slate-300">
              First Medicine
            </label>

            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-2">

              <Search
                size={20}
                className="ml-3 text-slate-500"
              />

              <input
                value={medicine1Query}
                onChange={(e) => {
                  setMedicine1Query(e.target.value);
                  setMedicine1(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch1();
                  }
                }}
                placeholder="e.g. Ibuprofen"
                className="flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />

              <button
                onClick={handleSearch1}
                disabled={loading1}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:opacity-50"
              >
                {loading1 ? "..." : "Search"}
              </button>

            </div>

            {/* Results */}
            {medicine1Results.length > 0 && (
              <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">

                {medicine1Results.map((medicine) => (
                  <button
                    key={medicine.rxcui}
                    onClick={() => selectMedicine1(medicine)}
                    className="flex w-full items-start gap-3 border-b border-white/5 p-4 text-left transition last:border-0 hover:bg-blue-500/10"
                  >

                    <Pill
                      size={18}
                      className="mt-1 shrink-0 text-blue-400"
                    />

                    <div>
                      <p className="text-sm font-medium text-white">
                        {medicine.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        RxCUI: {medicine.rxcui}
                      </p>
                    </div>

                  </button>
                ))}

              </div>
            )}

          </div>


          {/* Medicine 2 */}
          <div className="relative">

            <label className="mb-3 block text-sm font-medium text-slate-300">
              Second Medicine
            </label>

            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-2">

              <Search
                size={20}
                className="ml-3 text-slate-500"
              />

              <input
                value={medicine2Query}
                onChange={(e) => {
                  setMedicine2Query(e.target.value);
                  setMedicine2(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch2();
                  }
                }}
                placeholder="e.g. Paracetamol"
                className="flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />

              <button
                onClick={handleSearch2}
                disabled={loading2}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:opacity-50"
              >
                {loading2 ? "..." : "Search"}
              </button>

            </div>

            {/* Results */}
            {medicine2Results.length > 0 && (
              <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">

                {medicine2Results.map((medicine) => (
                  <button
                    key={medicine.rxcui}
                    onClick={() => selectMedicine2(medicine)}
                    className="flex w-full items-start gap-3 border-b border-white/5 p-4 text-left transition last:border-0 hover:bg-blue-500/10"
                  >

                    <Pill
                      size={18}
                      className="mt-1 shrink-0 text-blue-400"
                    />

                    <div>
                      <p className="text-sm font-medium text-white">
                        {medicine.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        RxCUI: {medicine.rxcui}
                      </p>
                    </div>

                  </button>
                ))}

              </div>
            )}

          </div>

        </div>


        {/* Error */}
        {error && (
          <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}


        {/* Selected medicines */}
        {(medicine1 || medicine2) && (
          <div className="mt-10 grid gap-6 md:grid-cols-2">

            {medicine1 && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">

                <p className="text-xs uppercase tracking-wider text-blue-400">
                  Medicine 1
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  {medicine1.name}
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  RxCUI: {medicine1.rxcui}
                </p>

              </div>
            )}

            {medicine2 && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">

                <p className="text-xs uppercase tracking-wider text-blue-400">
                  Medicine 2
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  {medicine2.name}
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  RxCUI: {medicine2.rxcui}
                </p>

              </div>
            )}

          </div>
        )}


        {/* Comparison */}
        {medicine1 && medicine2 && (
          <section className="mt-14">

            <div className="mb-8 text-center">

              <h3 className="text-3xl font-bold">
                Comparison
              </h3>

              <p className="mt-2 text-slate-500">
                Side-by-side medicine information
              </p>

            </div>


            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">

              <div className="grid grid-cols-3 bg-white/[0.04]">

                <div className="p-5 text-sm font-semibold text-slate-400">
                  Information
                </div>

                <div className="border-l border-white/10 p-5">
                  <div className="flex items-center gap-3">

                    <Pill
                      size={20}
                      className="text-blue-400"
                    />

                    <span className="font-semibold">
                      {medicine1.name}
                    </span>

                  </div>
                </div>

                <div className="border-l border-white/10 p-5">
                  <div className="flex items-center gap-3">

                    <Pill
                      size={20}
                      className="text-blue-400"
                    />

                    <span className="font-semibold">
                      {medicine2.name}
                    </span>

                  </div>
                </div>

              </div>


              {comparisonRows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-3 border-t border-white/10"
                >

                  <div className="bg-white/[0.02] p-5 text-sm font-medium text-slate-400">
                    {row.label}
                  </div>

                  <div className="border-l border-white/10 p-5 text-sm leading-6 text-slate-300">
                    {row.value1}
                  </div>

                  <div className="border-l border-white/10 p-5 text-sm leading-6 text-slate-300">
                    {row.value2}
                  </div>

                </div>
              ))}

            </div>


            {/* Mobile */}
            <div className="space-y-5 md:hidden">

              {comparisonRows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >

                  <h4 className="font-semibold text-blue-400">
                    {row.label}
                  </h4>

                  <div className="mt-4">

                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {medicine1.name}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {row.value1}
                    </p>

                  </div>

                  <div className="mt-5 border-t border-white/10 pt-5">

                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {medicine2.name}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {row.value2}
                    </p>

                  </div>

                </div>
              ))}

            </div>

          </section>
        )}


        {/* Empty state */}
        {!medicine1 && !medicine2 && (
          <div className="mt-20 text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">

              <GitCompare
                size={34}
                className="text-blue-400"
              />

            </div>

            <h3 className="mt-6 text-xl font-semibold">
              Choose two medicines
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Search for two medicines above to compare
              their information side by side.
            </p>

          </div>
        )}

      </main>
    </div>
  );
}

export default Comparison;