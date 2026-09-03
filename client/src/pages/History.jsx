import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  Search,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  getHistory,
  deleteHistory,
  clearHistory,
} from "../services/historyService";
import { useAuth } from "../components/context/AuthContext";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getHistory();

        setHistory(data);
      } catch (err) {
        console.error("❌ Failed to load history:", err);

        if (err.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError("Unable to load your search history.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadHistory();
    } else {
      setLoading(false);
      navigate("/login");
    }
  }, [user, navigate]);

  const handleDelete = async (id) => {
    try {
      await deleteHistory(id);

      setHistory((prev) =>
        prev.filter((item) => item.id !== id)
      );
    } catch (error) {
      console.error("❌ Delete failed:", error);
      alert("Unable to delete this history item.");
    }
  };

  const handleClearHistory = async () => {
    if (history.length === 0) return;

    const confirmed = window.confirm(
      "Are you sure you want to clear all search history?"
    );

    if (!confirmed) return;

    try {
      await clearHistory();

      setHistory([]);
    } catch (error) {
      console.error("❌ Clear history failed:", error);
      alert("Unable to clear history.");
    }
  };

  const handleSearchAgain = (name) => {
    navigate(
      `/search?name=${encodeURIComponent(name)}`
    );
  };

  const formatDate = (date) => {
    if (!date) return "Recently searched";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>

          <div className="flex items-center gap-2">

            <Clock3
              size={20}
              className="text-blue-400"
            />

            <h1 className="text-lg font-semibold">
              Search History
            </h1>

          </div>

          <div className="w-24" />

        </div>

      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-4xl px-6 py-14">

        {/* TITLE */}
        <div className="text-center">

          <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-400">
            Medicos AI
          </p>

          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            Search History
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Quickly return to medicines you searched for recently.
          </p>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-20 text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />

            <p className="mt-5 text-slate-400">
              Loading your history...
            </p>

          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="mt-12 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">

            <p className="text-red-400">
              {error}
            </p>

          </div>
        )}

        {/* HISTORY */}
        {!loading && !error && history.length > 0 && (

          <div className="mt-12">

            {/* HISTORY HEADER */}
            <div className="mb-5 flex items-center justify-between">

              <div>

                <h3 className="text-xl font-semibold">
                  Recent Searches
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {history.length} saved search
                  {history.length !== 1 ? "es" : ""}
                </p>

              </div>

              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
              >
                <Trash2 size={16} />
                Clear History
              </button>

            </div>

            {/* HISTORY CARDS */}
            <div className="space-y-3">

              {history.map((item) => (

                <div
                  key={item.id}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/3 p-5 transition hover:border-blue-500/30 hover:bg-blue-500/5"
                >

                  {/* ICON */}
                  <button
                    onClick={() =>
                      handleSearchAgain(item.medicine_name)
                    }
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10"
                  >

                    <Search
                      size={20}
                      className="text-blue-400"
                    />

                  </button>

                  {/* DETAILS */}
                  <button
                    onClick={() =>
                      handleSearchAgain(item.medicine_name)
                    }
                    className="min-w-0 flex-1 text-left"
                  >

                    <p className="truncate text-base font-semibold text-white">
                      {item.medicine_name}
                    </p>

                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Clock3 size={12} />
                      {formatDate(item.created_at)}
                    </p>

                  </button>

                  {/* DELETE */}
                  <button
                    onClick={() =>
                      handleDelete(item.id)
                    }
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                    title="Delete"
                  >

                    <Trash2 size={17} />

                  </button>

                </div>

              ))}

            </div>

          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && history.length === 0 && (

          <div className="mt-20 text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">

              <Clock3
                size={34}
                className="text-blue-400"
              />

            </div>

            <h3 className="mt-6 text-xl font-semibold">
              No search history yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Search for a medicine and it will appear here automatically.
            </p>

            <Link
              to="/search"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium transition hover:bg-blue-500"
            >
              <Search size={17} />
              Search Medicines
            </Link>

          </div>

        )}

      </main>

    </div>
  );
}

export default History;
