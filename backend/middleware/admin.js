const User = require("../models/User");

const admin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("role");

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify admin access"
    });
  }
};

module.exports = admin;