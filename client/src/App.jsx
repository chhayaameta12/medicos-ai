import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/home";
import Search from "./pages/Search";
import InteractionChecker from "./pages/InteractionChecker";
import MedicineDetails from "./pages/MedicineDetails";
import Comparison from "./pages/comparison";
import History from "./pages/History";
import AIAssistant from "./components/AIAssistant";
import AIAssistantPage from "./pages/AIAssistantPage";
import Login from "./pages/Login";
import Register from "./pages/register";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./components/context/AuthContext";

function App() {
  console.log("🔥 APP.JSX IS LOADED");

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Medicine Search */}
          <Route path="/search" element={<Search />} />

          {/* Drug Interaction Checker */}
          <Route path="/interactions" element={<InteractionChecker />} />

          {/* Medicine Details */}
          <Route path="/medicine/:rxcui" element={<MedicineDetails />} />

          {/* Medicine Comparison */}
          <Route path="/comparison" element={<Comparison />} />
          <Route
  path="/history"
  element={
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  }
/>

          {/* Search History */}
          <Route path="/history" element={<History />} />

          {/* Full AI Assistant Page */}
          <Route path="/ai-assistant" element={<AIAssistantPage />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>

        {/*
          Floating AI Assistant.

          This appears globally on every page.
          It is hidden on the dedicated AI Assistant page.
        */}
        <AIAssistant />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;