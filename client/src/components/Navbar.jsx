import { Link, useLocation } from "react-router-dom";
import {
  Pill,
  Menu,
  X,
  Bot,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const { user, logout } = useAuth();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

  return (
    <nav className="absolute left-0 top-0 z-50 w-full border-b border-white/10 bg-black/10 backdrop-blur-md">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

        {/* =========================
            LOGO
        ========================== */}

        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <Pill size={20} className="text-white" />
          </div>

          <span className="text-xl font-bold tracking-wide text-white">
            MEDICOS
            <span className="text-blue-400"> AI</span>
          </span>
        </Link>


        {/* =========================
            DESKTOP NAVIGATION
        ========================== */}

        <div className="hidden items-center gap-8 md:flex">

          {/* HOME */}

          <Link
            to="/"
            className={`text-sm transition ${
              isActive("/")
                ? "text-white"
                : "text-gray-300 hover:text-blue-400"
            }`}
          >
            Home
          </Link>


          {/* SEARCH */}

          <Link
            to="/search"
            className={`text-sm transition ${
              isActive("/search")
                ? "text-blue-400"
                : "text-gray-300 hover:text-blue-400"
            }`}
          >
            Search
          </Link>


          {/* INTERACTIONS */}

          <Link
            to="/interactions"
            className={`text-sm transition ${
              isActive("/interactions")
                ? "text-blue-400"
                : "text-gray-300 hover:text-blue-400"
            }`}
          >
            Interactions
          </Link>


          {/* COMPARISON */}

          <Link
            to="/comparison"
            className={`text-sm transition ${
              isActive("/comparison")
                ? "text-blue-400"
                : "text-gray-300 hover:text-blue-400"
            }`}
          >
            Compare
          </Link>


          {/* HISTORY */}

          <Link
            to="/history"
            className={`text-sm transition ${
              isActive("/history")
                ? "text-blue-400"
                : "text-gray-300 hover:text-blue-400"
            }`}
          >
            History
          </Link>


          {/* AI ASSISTANT */}

          <Link
            to="/ai-assistant"
            className={`flex items-center gap-2 text-sm transition ${
              isActive("/ai-assistant")
                ? "text-blue-400"
                : "text-gray-300 hover:text-blue-400"
            }`}
          >
            <Bot size={17} />
            AI Assistant
          </Link>


          {/* =========================
              AUTHENTICATION
          ========================== */}

          {user ? (

            <div className="flex items-center gap-3">

              {/* USER NAME */}

              <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white">
                {user.name}
              </div>


              {/* LOGOUT */}

              <button
                onClick={handleLogout}
                className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-900 transition hover:bg-blue-100"
              >
                Logout
              </button>

            </div>

          ) : (

            <Link
              to="/login"
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-900 transition hover:bg-blue-100"
            >
              Login
            </Link>

          )}

        </div>


        {/* =========================
            MOBILE MENU BUTTON
        ========================== */}

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <X size={26} />
          ) : (
            <Menu size={26} />
          )}
        </button>

      </div>


      {/* =========================
          MOBILE NAVIGATION
      ========================== */}

      {menuOpen && (

        <div className="border-t border-white/10 bg-slate-950/95 px-6 py-6 md:hidden">

          <div className="flex flex-col gap-5">

            {/* HOME */}

            <Link
              to="/"
              onClick={closeMenu}
              className={`transition ${
                isActive("/")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-blue-400"
              }`}
            >
              Home
            </Link>


            {/* SEARCH */}

            <Link
              to="/search"
              onClick={closeMenu}
              className={`transition ${
                isActive("/search")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-blue-400"
              }`}
            >
              Search
            </Link>


            {/* INTERACTIONS */}

            <Link
              to="/interactions"
              onClick={closeMenu}
              className={`transition ${
                isActive("/interactions")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-blue-400"
              }`}
            >
              Interactions
            </Link>


            {/* COMPARISON */}

            <Link
              to="/comparison"
              onClick={closeMenu}
              className={`transition ${
                isActive("/comparison")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-blue-400"
              }`}
            >
              Compare
            </Link>


            {/* HISTORY */}

            <Link
              to="/history"
              onClick={closeMenu}
              className={`transition ${
                isActive("/history")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-blue-400"
              }`}
            >
              History
            </Link>


            {/* AI ASSISTANT */}

            <Link
              to="/ai-assistant"
              onClick={closeMenu}
              className={`flex items-center gap-2 transition ${
                isActive("/ai-assistant")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-blue-400"
              }`}
            >
              <Bot size={17} />
              AI Assistant
            </Link>


            {/* =========================
                MOBILE AUTHENTICATION
            ========================== */}

            {user ? (

              <div className="flex flex-col gap-3">

                {/* USER */}

                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white">
                  Logged in as{" "}
                  <span className="font-semibold text-blue-400">
                    {user.name}
                  </span>
                </div>


                {/* LOGOUT */}

                <button
                  onClick={handleLogout}
                  className="rounded-full bg-white px-5 py-2 text-center text-sm font-medium text-slate-900 transition hover:bg-blue-100"
                >
                  Logout
                </button>

              </div>

            ) : (

              <Link
                to="/login"
                onClick={closeMenu}
                className="rounded-full bg-white px-5 py-2 text-center text-sm font-medium text-slate-900 transition hover:bg-blue-100"
              >
                Login
              </Link>

            )}

          </div>

        </div>

      )}

    </nav>
  );
}