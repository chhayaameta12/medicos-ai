import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Pill, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../components/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password");
      return;
    }

    try {
      setLoading(true);

      // Login through AuthContext
      await login(
        formData.email,
        formData.password
      );

      console.log("✅ Login successful");

      /*
        If the user originally tried to open
        /history while logged out, send them
        back to /history after login.

        Otherwise go to Home.
      */
      const from = location.state?.from || "/";

      navigate(from, { replace: true });

    } catch (error) {
      console.error("❌ Login error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-12">

      <div className="w-full max-w-md">

        {/* LOGO */}

        <div className="flex justify-center mb-8">

          <Link
            to="/"
            className="flex items-center gap-2"
          >

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
              <Pill
                size={23}
                className="text-white"
              />
            </div>

            <span className="text-2xl font-bold">
              MEDICOS
              <span className="text-blue-400">
                {" "}AI
              </span>
            </span>

          </Link>

        </div>


        {/* LOGIN CARD */}

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">

          <div className="mb-8 text-center">

            <h1 className="text-3xl font-bold">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Login to your Medicos AI account
            </p>

          </div>


          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-sm text-gray-300">
                Email
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-white outline-none transition focus:border-blue-500"
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div>

              <label className="mb-2 block text-sm text-gray-300">
                Password
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-12 text-white outline-none transition focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >

                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>

              </div>

            </div>


            {/* ERROR */}

            {error && (

              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>

            )}


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading
                ? "Logging in..."
                : "Login"}

            </button>

          </form>


          {/* REGISTER */}

          <div className="mt-7 text-center text-sm text-gray-400">

            Don't have an account?{" "}

            <Link
              to="/register"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Create Account
            </Link>

          </div>

        </div>


        {/* BACK */}

        <div className="mt-6 text-center">

          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            ← Back to Medicos AI
          </Link>

        </div>

      </div>

    </div>
  );
}