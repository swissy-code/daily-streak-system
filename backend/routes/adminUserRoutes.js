const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const User = require("../models/User");
const Streak = require("../models/Streak");
const StreakClaim = require("../models/StreakClaim");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const GiftCardEntitlement = require("../models/GiftCardEntitlement");

const router = express.Router();

// Get all users
router.get("/", auth, admin, async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      totalUsers: users.length,
      users
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch users"
    });
  }
});
// Get all users with streak and wallet information
router.get("/streaks", auth, admin, async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role createdAt")
      .lean();

    const userStats = await Promise.all(
      users.map(async (user) => {
        const streak = await Streak.findOne({
          userId: user._id
        }).lean();

        const wallet = await Wallet.findOne({
          userId: user._id
        }).lean();

        const totalClaims = await StreakClaim.countDocuments({
          userId: user._id
        });

        return {
          ...user,
          currentDay: streak?.currentDay || 0,
          walletBalance: wallet?.balance || 0,
          totalClaims
        };
      })
    );

    res.json({
      success: true,
      totalUsers: userStats.length,
      users: userStats
    });
  } catch (error) {
    console.error("Admin streak monitoring error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch user streak statistics"
    });
  }
});
// Admin Analytics
router.get("/analytics", auth, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const activeStreakUsers = await Streak.countDocuments({
      currentDay: { $gt: 0 }
    });

    const creditResult = await WalletTransaction.aggregate([
      { $match: { type: "CREDIT" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    const debitResult = await WalletTransaction.aggregate([
      { $match: { type: "DEBIT" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    const pendingGiftCards =
      await GiftCardEntitlement.countDocuments({
        status: "PENDING"
      });

    const fulfilledGiftCards =
      await GiftCardEntitlement.countDocuments({
        status: "FULFILLED"
      });

    res.json({
      success: true,
      analytics: {
        totalUsers,
        activeStreakUsers,
        totalVERewarded: creditResult[0]?.total || 0,
        totalVEDebited: debitResult[0]?.total || 0,
        pendingGiftCards,
        fulfilledGiftCards
      }
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch analytics"
    });
  }
});
module.exports = router;