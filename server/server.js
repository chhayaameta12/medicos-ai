
import "dotenv/config";

import express from "express";
import cors from "cors";

import pool from "./config/db.js";

import medicineRoutes from "./routes/medicineRoutes.js";
import interactionRoutes from "./routes/interactionRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import historyRoutes from "./routes/historyRoutes.js";
const app = express();

/* ==================================================
   MIDDLEWARE
================================================== */

const allowedOrigins = [
  "https://medicos-ai-psi.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // and approved frontend origins.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview/deployment URLs
      if (
        /^https:\/\/medicos-ai-[a-z0-9-]+\.vercel\.app$/i.test(
          origin
        )
      ) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

/* ==================================================
   EXISTING API ROUTES
================================================== */

app.use("/api/medicines", medicineRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);
/* ==================================================
   HOME / SERVER TEST
================================================== */

app.get("/", (req, res) => {
  res.send("🚀 Medicos AI Backend is Running!");
});

/* ==================================================
   DATABASE TEST
================================================== */

pool
  .query("SELECT NOW()")
  .then(() => {
    console.log("✅ Database test successful");
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error.message);
  });

/* ==================================================
   CREATE USERS TABLE
================================================== */

pool
  .query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  .then(() => {
    console.log("✅ Users table ready");
  })
  .catch((error) => {
    console.error("❌ Users table creation failed:", error.message);
  });

/* ==================================================
   START SERVER
================================================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

