
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

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
  }));
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

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

