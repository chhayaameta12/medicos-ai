import { useState, useEffect } from "react";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { searchMedicines } from "../services/medicineApi";
import { addSearchHistory } from "../services/historyService";

function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();

  // ============================================
  // SEARCH MEDICINE
  // ============================================
  const handleSearch = async (eOrSearchTerm = null) => {
    // If called from form submit
    if (eOrSearchTerm?.preventDefault) {
      eOrSearchTerm.preventDefault();
    }

    // If called with a string, use that string.
    // Otherwise use current query.
    const searchTerm =
      typeof eOrSearchTerm === "string"
        ? eOrSearchTerm
        : query;

    const term = searchTerm.trim();

    if (!term || loading) return;

    try {
      setLoading(true);
      setError("");
      setResults([]);

      console.log("================================");
      console.log("FRONTEND MEDICINE SEARCH");
      console.log("Searching for:", term);
      console.log("================================");

      const data = await searchMedicines(term);

      console.log("API Response:", data);
      console.log("Is array:", Array.isArray(data));
      console.log("Number of results:", data?.length);

      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid response from medicine API"
        );
      }

      setResults(data);

      if (data.length > 0) {
  const historyResult = await addSearchHistory(term);

  if (historyResult) {
    console.log("✅ Search added to user history");
  } else {
    console.log("⚠️ Search worked, but history was not saved");
  }
}else {
        setError(
          `No medicine found for "${term}".`
        );
      }
    } catch (err) {
      console.error("Search error:", err);
      console.error(
        "Server response:",
        err.response?.data
      );

      setError(
        err.response?.data?.message ||
          "Unable to search medicines."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SEARCH FROM URL
  // ============================================
  useEffect(() => {
    const medicineName = searchParams.get("name");

    if (medicineName) {
      setQuery(medicineName);
      handleSearch(medicineName);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ========================================
          HEADER
      ======================================== */}
      <div className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>

          <h1 className="text-lg font-semibold">
            Medicine Search
          </h1>

          <div className="w-24" />

        </div>
      </div>

      {/* ========================================
          MAIN
      ======================================== */}
      <main className="mx-auto max-w-5xl px-6 py-16">

        {/* ======================================
            TITLE
        ====================================== */}
        <div className="text-center">

          <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-400">
            Medicine Database
          </p>

          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            Search for a medicine
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Find medicine information, ingredients,
            strengths, uses, side effects, and safety
            information.
          </p>

        </div>

        {/* ======================================
            SEARCH FORM
            IMPORTANT FIX:
            Enter + Button both trigger onSubmit
        ====================================== */}
        <form
          onSubmit={handleSearch}
          className="mx-auto mt-10 flex max-w-3xl items-center rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-xl focus-within:border-blue-500/50"
        >

          <SearchIcon
            size={24}
            className="ml-4 shrink-0 text-slate-400"
          />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Paracetamol, Ibuprofen, Dolo 650..."
            className="flex-1 bg-transparent px-4 py-4 text-white outline-none placeholder:text-slate-500"
          />

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-xl bg-blue-600 px-7 py-3 font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>

        </form>

        {/* ======================================
            ERROR
        ====================================== */}
        {error && (
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ======================================
            POPULAR MEDICINES
        ====================================== */}
        {!results.length && !loading && !error && (
          <div className="mx-auto mt-6 max-w-3xl">

            <p className="mb-3 text-sm text-slate-500">
              Popular medicines
            </p>

            <div className="flex flex-wrap gap-2">

              {[
                "Paracetamol",
                "Ibuprofen",
                "Dolo 650",
                "Crocin",
                "Azithromycin",
              ].map((medicine) => (
                <button
                  key={medicine}
                  type="button"
                  onClick={() => {
                    setQuery(medicine);
                  }}
                  className="rounded-full border border-white/10 bg-white/3 px-4 py-2 text-sm text-slate-300 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300"
                >
                  {medicine}
                </button>
              ))}

            </div>

          </div>
        )}

        {/* ======================================
            LOADING
        ====================================== */}
        {loading && (
          <div className="mt-16 text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />

            <p className="mt-4 text-slate-400">
              Searching medicine database...
            </p>

          </div>
        )}

        {/* ======================================
            RESULTS
        ====================================== */}
        {!loading && results.length > 0 && (
          <div className="mt-12">

            {/* Results Header */}
            <div className="mb-6 flex items-end justify-between">

              <div>
                <h3 className="text-2xl font-semibold">
                  Search Results
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Medicines matching "{query}"
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                {results.length} results
              </span>

            </div>

            {/* Cards */}
            <div className="grid gap-5 sm:grid-cols-2">

              {results.map((medicine) => (

                <div
                  key={medicine.rxcui}
                  className="group rounded-2xl border border-white/10 bg-white/4 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-blue-500/4"
                >

                  {/* Icon + Type */}
                  <div className="flex items-start justify-between">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                      💊
                    </div>

                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                      {medicine.type === "IN"
                        ? "Generic"
                        : medicine.type === "SBD"
                        ? "Brand"
                        : medicine.type === "BRAND"
                        ? "Brand"
                        : "Clinical Drug"}
                    </span>

                  </div>

                  {/* Medicine Name */}
                  <h4 className="mt-5 text-lg font-semibold leading-snug text-white">
                    {medicine.name}
                  </h4>

                  {/* Generic Name */}
                  {medicine.genericName && (
                    <p className="mt-2 text-sm text-slate-400">
                      Generic: {medicine.genericName}
                    </p>
                  )}

                  {/* Brand */}
                  {medicine.brand && (
                    <p className="mt-1 text-sm text-slate-400">
                      Brand: {medicine.brand}
                    </p>
                  )}

                  {/* Manufacturer */}
                  {medicine.manufacturer && (
                    <p className="mt-1 text-sm text-slate-500">
                      Manufacturer: {medicine.manufacturer}
                    </p>
                  )}

                  {/* RxCUI */}
                  <p className="mt-2 text-xs text-slate-500">
                    RxCUI: {medicine.rxcui}
                  </p>

                  {/* Active Ingredients */}
                  {medicine.activeIngredient?.length > 0 && (
                    <div className="mt-4">

                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Active Ingredients
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">

                        {medicine.activeIngredient.map(
                          (ingredient, index) => (
                            <span
                              key={index}
                              className="rounded-lg bg-blue-500/10 px-3 py-1 text-xs text-blue-300"
                            >
                              {ingredient}
                            </span>
                          )
                        )}

                      </div>

                    </div>
                  )}

                  {/* Bottom */}
                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">

                    <span className="text-xs text-slate-500">
                      {medicine.source === "DRUGDB_RXNORM"
                        ? "DrugDB + RxNorm verified"
                        : "RxNorm verified"}
                    </span>

                    <Link
                      to={`/medicine/${medicine.rxcui}`}
                      className="text-sm font-medium text-blue-400 transition group-hover:text-blue-300"
                    >
                      View Details →
                    </Link>

                  </div>

                </div>

              ))}

            </div>

          </div>
        )}

        {/* ======================================
            EMPTY STATE
        ====================================== */}
        {!loading &&
          !results.length &&
          !error && (
            <div className="mt-20 text-center">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">

                <SearchIcon
                  size={32}
                  className="text-blue-400"
                />

              </div>

              <h3 className="mt-6 text-xl font-semibold">
                Search for a medicine
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Enter a medicine name above to view
                detailed information.
              </p>

            </div>
          )}

      </main>
    </div>
  );
}

export default Search;