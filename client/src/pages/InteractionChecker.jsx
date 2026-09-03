import { useState } from "react";
import {
  ArrowLeft,
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  Plus,
  X,
  Loader2,
  Database,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  resolveMedicine,
  checkInteraction,
} from "../services/medicineApi";

function InteractionChecker() {
  const [medicine1, setMedicine1] = useState("");
  const [medicine2, setMedicine2] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleCheck = async () => {
    if (!medicine1.trim() || !medicine2.trim()) {
      setError("Please enter both medicines.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      console.log("================================");
      console.log("FRONTEND INTERACTION CHECK");
      console.log("Medicine 1:", medicine1);
      console.log("Medicine 2:", medicine2);
      console.log("================================");

      /*
      --------------------------------
      1. Resolve both medicines
      --------------------------------
      */

      const [resolved1, resolved2] = await Promise.all([
        resolveMedicine(medicine1),
        resolveMedicine(medicine2),
      ]);

      console.log("Resolved medicine 1:", resolved1);
      console.log("Resolved medicine 2:", resolved2);

      /*
      --------------------------------
      2. Check interaction
      --------------------------------

      IMPORTANT:
      Your backend expects medicine NAMES.

      We therefore send:

      medicine1 = paracetamol
      medicine2 = ibuprofen

      NOT:

      rxcui1 = 161
      rxcui2 = 5640
      */

      const interactionResult = await checkInteraction(
        medicine1,
        medicine2
      );

      console.log(
        "Interaction result:",
        interactionResult
      );

      setResult({
        ...interactionResult,

        resolvedMedicine1: resolved1,
        resolvedMedicine2: resolved2,
      });

    } catch (err) {
      console.error(
        "Interaction checker error:",
        err
      );

      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to check medicine interaction.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /*
  --------------------------------
  Clear everything
  --------------------------------
  */

  const handleClear = () => {
    setMedicine1("");
    setMedicine2("");
    setResult(null);
    setError("");
  };

  /*
  --------------------------------
  Enter key
  --------------------------------
  */

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCheck();
    }
  };

  /*
  --------------------------------
  Determine result status
  --------------------------------
  */

  const interactionFound =
    result?.interaction?.status ===
    "interaction_found";

  const databaseRecordNotFound =
    result?.interaction?.status ===
    "not_found_in_database";

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ================================
          HEADER
      ================================= */}

      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>

          <h1 className="text-lg font-semibold">
            Interaction Checker
          </h1>

          <div className="w-24" />

        </div>

      </header>


      {/* ================================
          MAIN
      ================================= */}

      <main className="mx-auto max-w-5xl px-6 py-16">

        {/* ================================
            HERO
        ================================= */}

        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">

            <ShieldCheck
              size={32}
              className="text-blue-400"
            />

          </div>

          <p className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-blue-400">
            Medicine Safety
          </p>

          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            Check Drug Interactions
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Enter two medicines to check whether an interaction
            is recorded between them in the connected database.
          </p>

        </div>


        {/* ================================
            MEDICINE INPUTS
        ================================= */}

        <div className="mx-auto mt-12 max-w-3xl">

          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">


            {/* ================================
                MEDICINE 1
            ================================= */}

            <div>

              <label className="mb-2 block text-sm text-slate-400">
                First Medicine
              </label>

              <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 transition focus-within:border-blue-500/50">

                <Search
                  size={20}
                  className="shrink-0 text-slate-500"
                />

                <input
                  type="text"
                  value={medicine1}
                  onChange={(e) => {
                    setMedicine1(e.target.value);
                    setResult(null);
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Paracetamol"
                  disabled={loading}
                  className="w-full bg-transparent px-3 py-3 text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                />

                {medicine1 && !loading && (
                  <button
                    type="button"
                    onClick={() => {
                      setMedicine1("");
                      setResult(null);
                      setError("");
                    }}
                    className="text-slate-500 transition hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}

              </div>

            </div>


            {/* ================================
                PLUS
            ================================= */}

            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400">

              <Plus size={20} />

            </div>


            {/* ================================
                MEDICINE 2
            ================================= */}

            <div>

              <label className="mb-2 block text-sm text-slate-400">
                Second Medicine
              </label>

              <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 transition focus-within:border-blue-500/50">

                <Search
                  size={20}
                  className="shrink-0 text-slate-500"
                />

                <input
                  type="text"
                  value={medicine2}
                  onChange={(e) => {
                    setMedicine2(e.target.value);
                    setResult(null);
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Ibuprofen"
                  disabled={loading}
                  className="w-full bg-transparent px-3 py-3 text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                />

                {medicine2 && !loading && (
                  <button
                    type="button"
                    onClick={() => {
                      setMedicine2("");
                      setResult(null);
                      setError("");
                    }}
                    className="text-slate-500 transition hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}

              </div>

            </div>

          </div>


          {/* ================================
              BUTTONS
          ================================= */}

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">

            <button
              type="button"
              onClick={handleCheck}
              disabled={
                loading ||
                !medicine1.trim() ||
                !medicine2.trim()
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >

              {loading ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />

                  Checking...
                </>
              ) : (
                <>
                  <ShieldCheck size={20} />

                  Check Interaction
                </>
              )}

            </button>


            {(medicine1 || medicine2 || result || error) && (
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="w-full rounded-xl border border-white/10 px-8 py-4 text-sm text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-40 sm:w-auto"
              >
                Clear
              </button>
            )}

          </div>


          {/* ================================
              ERROR
          ================================= */}

          {error && (

            <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">

              <div className="flex items-start gap-3">

                <AlertTriangle
                  size={22}
                  className="mt-0.5 shrink-0 text-red-400"
                />

                <div>

                  <h3 className="font-semibold text-red-300">
                    Unable to check interaction
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-red-300/70">
                    {error}
                  </p>

                </div>

              </div>

            </div>

          )}


          {/* ================================
              LOADING
          ================================= */}

          {loading && (

            <div className="mt-10 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 text-center">

              <Loader2
                size={30}
                className="mx-auto animate-spin text-blue-400"
              />

              <p className="mt-4 font-medium text-blue-300">
                Checking medicine interaction...
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Resolving medicines and searching the interaction database.
              </p>

            </div>

          )}


          {/* ================================
              RESULT
          ================================= */}

          {result && !loading && (

            <div className="mt-10">

              {/* Resolution fallback warning */}
              {(result.medicine1?.resolutionFallback || result.medicine2?.resolutionFallback) && (
                <div className="mb-4 rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-3 text-sm text-yellow-200">
                  Some medicines could not be resolved via RxNorm. The check used the entered names as a fallback.
                </div>
              )}

              {/* =================================
                  INTERACTION FOUND
              ================================= */}

              {interactionFound && (

                <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">

                  <div className="flex items-start gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10">

                      <AlertTriangle
                        size={25}
                        className="text-red-400"
                      />

                    </div>

                    <div className="min-w-0">

                      <h3 className="text-lg font-semibold text-red-300">
                        Interaction Found
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        An interaction is recorded for these medicines.
                      </p>

                    </div>

                  </div>


                  {/* Medicine pair */}

                  <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:items-center">

                    <div className="rounded-xl bg-black/20 p-4">

                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Medicine 1
                      </p>

                      <p className="mt-2 font-medium text-white">
                        {result.medicine1?.name ||
                          medicine1}
                      </p>

                      {result.medicine1?.rxcui && (
                        <p className="mt-1 text-xs text-slate-600">
                          RxCUI: {result.medicine1.rxcui}
                        </p>
                      )}

                    </div>


                    <div className="text-center text-slate-600">
                      +
                    </div>


                    <div className="rounded-xl bg-black/20 p-4">

                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Medicine 2
                      </p>

                      <p className="mt-2 font-medium text-white">
                        {result.medicine2?.name ||
                          medicine2}
                      </p>

                      {result.medicine2?.rxcui && (
                        <p className="mt-1 text-xs text-slate-600">
                          RxCUI: {result.medicine2.rxcui}
                        </p>
                      )}

                    </div>

                  </div>


                  {/* Severity */}

                  <div className="mt-6 rounded-2xl bg-black/20 p-5">

                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Severity
                    </p>

                    {(() => {
                      const sev = result.interaction?.severity || "Unknown";
                      const text = (result.interaction?.interactionText || result.interaction?.message || "").trim();

                      const sevMap = {
  Major: {
    color: "text-red-300",
    icon: (
      <AlertOctagon
        size={20}
        className="text-red-400"
      />
    ),
    label: "Major",
  },

  Moderate: {
    color: "text-yellow-300",
    icon: (
      <AlertTriangle
        size={20}
        className="text-yellow-400"
      />
    ),
    label: "Moderate",
  },

  Minor: {
    color: "text-green-300",
    icon: (
      <CheckCircle
        size={20}
        className="text-green-400"
      />
    ),
    label: "Minor",
  },

  Unknown: {
    color: "text-slate-300",
    icon: (
      <ShieldCheck
        size={20}
        className="text-blue-400"
      />
    ),
    label: "Unknown",
  },
};

                      const meta = sevMap[sev] || sevMap.Unknown;

                      const safety = (() => {
  if (sev === "Major") {
    return "This interaction is classified as major in DDInter. Avoid or carefully evaluate the combination with a qualified healthcare professional.";
  }

  if (sev === "Moderate") {
    return "This interaction is classified as moderate in DDInter. Use caution and discuss the combination with a qualified healthcare professional.";
  }

  if (sev === "Minor") {
    return "This interaction is classified as minor in DDInter. Monitoring may be appropriate, but consult a healthcare professional if concerned.";
  }

  return "No specific guidance is available from the dataset. Consult a healthcare professional if unsure.";
})();

                      return (
                        <>
                          <div className="mt-2 flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-black/30 ${meta.color}`}>
                              {meta.icon}
                            </div>

                            <div>
                              <p className={`text-xl font-semibold ${meta.color}`}>{meta.label}</p>
                              <p className="mt-1 text-sm text-slate-400">{result.interaction?.message}</p>
                            </div>
                          </div>

                          {text && (
                            <div className="mt-4 rounded-md bg-white/2 p-4 text-sm text-slate-300">
                              <p className="font-semibold text-sm text-slate-200">What the database says</p>
                              <p className="mt-2 text-sm leading-6">{text}</p>
                            </div>
                          )}

                          <div className="mt-4 rounded-md bg-white/2 p-4 text-sm">
                            <p className="font-semibold">What this means</p>
                            <p className="mt-2 text-sm text-slate-400">{safety}</p>
                          </div>
                        </>
                      );
                    })()}

                  </div>


                  {/* Source */}

                  <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">

                    <Database size={15} />

                    Source:{" "}
                    {result.source || "Interaction database"}

                  </div>

                </div>

              )}


              {/* =================================
                  NO RECORD FOUND
              ================================= */}

              {databaseRecordNotFound && (

                <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">

                  <div className="flex items-start gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10">

                      <AlertTriangle
                        size={25}
                        className="text-yellow-400"
                      />

                    </div>

                    <div>

                      <h3 className="text-lg font-semibold text-yellow-300">
                        No Matching Record Found
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        The connected database did not return a
                        matching interaction record for these medicines.
                      </p>

                    </div>

                  </div>


                  {/* Medicine names */}

                  <div className="mt-6 rounded-2xl bg-black/20 p-5">

                    <p className="text-sm text-slate-400">
                      Checked combination
                    </p>

                    <p className="mt-2 font-medium text-white">
                      {result.medicine1?.name ||
                        medicine1}
                      {" "}
                      <span className="text-slate-600">
                        +
                      </span>
                      {" "}
                      {result.medicine2?.name ||
                        medicine2}
                    </p>

                  </div>


                  {/* Important */}

                  <div className="mt-5 rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-4">

                    <p className="text-xs leading-5 text-yellow-300/70">
                      This does <strong>not</strong> prove that the
                      medicines have no interaction. It only means
                      that no matching record was found in the
                      current database.
                    </p>

                  </div>


                  <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">

                    <Database size={15} />

                    Source:{" "}
                    {result.source || "Interaction database"}

                  </div>

                </div>

              )}


              {/* =================================
                  UNKNOWN STATUS
              ================================= */}

              {!interactionFound &&
                !databaseRecordNotFound && (

                <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">

                  <div className="flex items-start gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">

                      <ShieldCheck
                        size={25}
                        className="text-blue-400"
                      />

                    </div>

                    <div>

                      <h3 className="text-lg font-semibold text-blue-300">
                        Interaction Check Complete
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {result.interaction?.message ||
                          "The interaction check has completed."}
                      </p>

                    </div>

                  </div>


                  <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">

                    <Database size={15} />

                    Source:{" "}
                    {result.source || "Interaction database"}

                  </div>

                </div>

              )}

            </div>

          )}

        </div>


        {/* ================================
            DISCLAIMER
        ================================= */}

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center text-xs leading-5 text-slate-600">

          <strong className="text-slate-500">
            Medical information:
          </strong>{" "}
          Medicos AI provides educational information only.
          Interaction results should not replace advice from a
          qualified healthcare professional.

        </div>

      </main>

    </div>
  );
}

export default InteractionChecker;