import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing");

      return res.status(500).json({
        message: "Authentication configuration error",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("🔐 JWT decoded:", decoded);

    // Support both possible JWT formats
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      console.error("❌ No user ID found inside JWT");

      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    // Always keep the ID in req.user.id
    req.user = {
      ...decoded,
      id: userId,
    };

    console.log("✅ Authenticated user ID:", req.user.id);

    next();

  } catch (error) {
    console.error(
      "❌ Authentication error:",
      error.message
    );

    return res.status(401).json({
      message: "Invalid or expired authentication token",
    });
  }
};

export default authMiddleware;