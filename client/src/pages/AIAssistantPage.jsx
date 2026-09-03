import AIAssistant from "../components/AIAssistant";

function AIAssistantPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="mx-auto max-w-5xl px-6 pt-32">

        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-400">
            Medicos AI
          </p>

          <h1 className="mt-4 text-4xl font-bold">
            AI Medicine Assistant
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Ask questions about medicines, side effects,
            interactions, uses, and precautions.
          </p>
        </div>

        <AIAssistant pageMode={true} />

      </div>

    </div>
  );
}

export default AIAssistantPage;