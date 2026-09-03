import { useState } from "react";
import {
  Search,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { useNavigate } from "react-router-dom";

function Home() {

  const [query, setQuery] = useState("");

  const navigate = useNavigate();


  /* =========================
     MEDICINE SEARCH
  ========================== */

  const handleSearch = () => {

    if (!query.trim()) return;

    navigate(
      `/search?name=${encodeURIComponent(
        query.trim()
      )}`
    );
  };


  const handleKeyDown = (e) => {

    if (e.key === "Enter") {
      handleSearch();
    }

  };


  return (

    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-white">


      {/* =========================
          MEDICAL AI BACKGROUND
      ========================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Large ambient glow */}

        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[100px]" />


        {/* Central AI Core */}

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

          {/* Outer rotating ring */}

          <div className="absolute -left-[180px] -top-[180px] h-[360px] w-[360px] rounded-full border border-blue-400/20 animate-[spin_25s_linear_infinite]">

            <span className="absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_15px_5px_rgba(59,130,246,0.8)]" />

          </div>


          {/* Second ring */}

          <div className="absolute -left-[260px] -top-[260px] h-[520px] w-[520px] rounded-full border border-cyan-400/10 animate-[spin_35s_linear_infinite_reverse]">

            <span className="absolute right-[20%] top-0 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_15px_5px_rgba(34,211,238,0.7)]" />

          </div>


          {/* AI core glow */}

          <div className="relative h-20 w-20 rounded-full bg-blue-500/20 blur-xl animate-pulse" />


          <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_35px_12px_rgba(59,130,246,0.7)]" />

        </div>


        {/* =========================
            NEURAL NETWORK
        ========================== */}

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1200 700"
          preserveAspectRatio="none"
        >

          {/* Main connections */}

          <g
            fill="none"
            stroke="rgba(96,165,250,0.28)"
            strokeWidth="1.5"
          >

            <line x1="100" y1="150" x2="300" y2="250" />
            <line x1="100" y1="550" x2="300" y2="430" />

            <line x1="300" y1="250" x2="600" y2="350" />
            <line x1="300" y1="430" x2="600" y2="350" />

            <line x1="600" y1="350" x2="900" y2="230" />
            <line x1="600" y1="350" x2="900" y2="470" />

            <line x1="900" y1="230" x2="1100" y2="150" />
            <line x1="900" y1="470" x2="1100" y2="550" />

            <line x1="300" y1="250" x2="450" y2="100" />
            <line x1="900" y1="230" x2="1050" y2="350" />

          </g>


          {/* Moving data */}

          <g
            fill="none"
            stroke="rgba(34,211,238,0.6)"
            strokeWidth="2"
            strokeDasharray="5 18"
            className="animate-[dashMove_8s_linear_infinite]"
          >

            <line x1="100" y1="150" x2="600" y2="350" />

            <line x1="300" y1="430" x2="900" y2="230" />

            <line x1="600" y1="350" x2="1100" y2="550" />

          </g>

        </svg>


        {/* =========================
            NETWORK NODES
        ========================== */}

        <div className="absolute left-[8%] top-[22%]">

          <div className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_20px_6px_rgba(59,130,246,0.6)] animate-pulse" />

        </div>


        <div className="absolute left-[25%] top-[36%]">

          <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_20px_5px_rgba(34,211,238,0.5)] animate-pulse" />

        </div>


        <div className="absolute left-[25%] top-[61%]">

          <div className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_20px_6px_rgba(59,130,246,0.6)] animate-pulse" />

        </div>


        <div className="absolute right-[25%] top-[33%]">

          <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_20px_6px_rgba(34,211,238,0.6)] animate-pulse" />

        </div>


        <div className="absolute right-[25%] top-[65%]">

          <div className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_20px_6px_rgba(59,130,246,0.6)] animate-pulse" />

        </div>


        <div className="absolute right-[8%] top-[22%]">

          <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_20px_6px_rgba(34,211,238,0.6)] animate-pulse" />

        </div>


        <div className="absolute right-[8%] bottom-[22%]">

          <div className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_20px_6px_rgba(59,130,246,0.6)] animate-pulse" />

        </div>


        {/* Medical symbols */}

        <div className="absolute left-[12%] top-[45%] text-4xl text-blue-400/20">
          +
        </div>


        <div className="absolute right-[12%] top-[45%] text-4xl text-cyan-400/20">
          +
        </div>


        {/* Subtle grid */}

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:60px_60px]" />

      </div>


      {/* =========================
          NAVBAR
      ========================== */}

      <div className="relative z-30">
        <Navbar />
      </div>


      {/* =========================
          HERO
      ========================== */}

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">

        <div className="w-full max-w-5xl text-center">


          <p className="mb-5 text-sm font-medium uppercase tracking-[0.4em] text-blue-300">
            AI-powered medical intelligence
          </p>


          <h1 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl">

            MEDICOS{" "}

            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              AI
            </span>

          </h1>


          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            Discover smarter medical information, understand medicines,
            and make better-informed decisions with AI.
          </p>


          {/* =========================
              SEARCH
          ========================== */}

          <div className="mx-auto mt-10 flex max-w-2xl items-center rounded-2xl border border-white/10 bg-white/[0.06] p-2 shadow-2xl backdrop-blur-xl transition-all duration-300 focus-within:border-blue-400/40 focus-within:bg-white/[0.08]">

            <Search
              size={22}
              className="ml-4 shrink-0 text-slate-400"
            />


            <input
              type="text"
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Search for a medicine..."
              className="flex-1 bg-transparent px-4 py-4 text-white outline-none placeholder:text-slate-500"
            />


            <button
              onClick={handleSearch}
              className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20"
            >
              Search
            </button>

          </div>


          {/* =========================
              POPULAR MEDICINES
          ========================== */}

          <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm text-slate-400">

            <span>
              Popular:
            </span>


            {[
              "Paracetamol",
              "Ibuprofen",
              "Dolo 650",
              "Crocin",
            ].map((medicine) => (

              <button
                key={medicine}
                onClick={() =>
                  navigate(
                    `/search?name=${encodeURIComponent(
                      medicine
                    )}`
                  )
                }
                className="rounded-full border border-white/10 px-3 py-1 transition hover:border-blue-400/30 hover:text-blue-300"
              >
                {medicine}
              </button>

            ))}

          </div>

        </div>

      </main>

    </div>
  );
}

export default Home;