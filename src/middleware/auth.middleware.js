import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (req, res, next) => {
  try {
    // 1. Get and validate authorization header
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    // 2. Extract and clean token
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find user (without password)
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    // Specific error handling
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        expiredAt: error.expiredAt,
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error: error.message,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export default protectRoute;
