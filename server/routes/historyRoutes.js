import express from "express";
import pool from "../config/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/*
==================================================
GET USER HISTORY
GET /api/history
==================================================
*/

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        type,
        medicine_name,
        medicine_name_2,
        created_at
      FROM history
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json({
      history: result.rows,
    });

  } catch (error) {
    console.error("❌ Get history error:", error);

    res.status(500).json({
      message: "Unable to load history",
    });
  }
});


/*
==================================================
ADD HISTORY
POST /api/history
==================================================
*/

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      type,
      medicine_name,
      medicine_name_2,
    } = req.body;

    const userId = req.user.id;

    if (!type || !medicine_name) {
      return res.status(400).json({
        message: "History information is incomplete",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO history
      (
        user_id,
        type,
        medicine_name,
        medicine_name_2
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        userId,
        type,
        medicine_name,
        medicine_name_2 || null,
      ]
    );

    res.status(201).json({
      message: "History saved successfully",
      history: result.rows[0],
    });

  } catch (error) {
    console.error("❌ Save history error:", error);

    res.status(500).json({
      message: "Unable to save history",
    });
  }
});


/*
==================================================
DELETE ONE HISTORY ITEM
DELETE /api/history/:id
==================================================
*/

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const historyId = req.params.id;

    const result = await pool.query(
      `
      DELETE FROM history
      WHERE id = $1
      AND user_id = $2
      RETURNING *
      `,
      [historyId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "History item not found",
      });
    }

    res.json({
      message: "History deleted successfully",
    });

  } catch (error) {
    console.error("❌ Delete history error:", error);

    res.status(500).json({
      message: "Unable to delete history",
    });
  }
});


/*
==================================================
DELETE ALL USER HISTORY
DELETE /api/history
==================================================
*/

router.delete("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `
      DELETE FROM history
      WHERE user_id = $1
      `,
      [userId]
    );

    res.json({
      message: "History cleared successfully",
    });

  } catch (error) {
    console.error("❌ Clear history error:", error);

    res.status(500).json({
      message: "Unable to clear history",
    });
  }
});


export default router;