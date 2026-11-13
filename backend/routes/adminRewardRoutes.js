const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const RewardConfig = require("../models/RewardConfig");
const defaultRewards = require("../config/rewards");

// GET reward configuration
router.get("/", auth, admin, async (req, res) => {
  try {
    let rewards = await RewardConfig.find().sort({ day: 1 });

    // Insert default rewards if configuration is empty
    if (rewards.length === 0) {
      await RewardConfig.insertMany(
        defaultRewards.map((reward) => ({
          ...reward,
          enabled: true
        }))
      );

      rewards = await RewardConfig.find().sort({ day: 1 });
    }

    res.json({
      success: true,
      rewards
    });
  } catch (error) {
    console.error("Reward configuration error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch reward configuration"
    });
  }
});

// UPDATE reward configuration
router.put("/", auth, admin, async (req, res) => {
  try {
    const rewards = req.body?.rewards;
    if (
      !Array.isArray(rewards) ||
      rewards.length !== 7
    ) {
      return res.status(400).json({
        success: false,
        message: "Exactly 7 rewards are required"
      });
    }

    const days = rewards.map((reward) => reward.day);

    if (
      new Set(days).size !== 7 ||
      !days.every((day) => Number.isInteger(day) && day >= 1 && day <= 7)
    ) {
      return res.status(400).json({
        success: false,
        message: "Each day from 1 to 7 must appear exactly once"
      });
    }

    for (const reward of rewards) {
      if (
        !["VE", "GIFT_CARD"].includes(reward.type) ||
        !Number.isInteger(reward.amount) ||
reward.amount < 1 ||
        typeof reward.enabled !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid reward configuration"
        });
      }
    }

    const session = await mongoose.startSession();

let updatedRewards;

try {
  await session.withTransaction(async () => {
    for (const reward of rewards) {
      await RewardConfig.findOneAndUpdate(
        { day: reward.day },
        {
          type: reward.type,
          amount: reward.amount,
          enabled: reward.enabled
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          session
        }
      );
    }

    updatedRewards = await RewardConfig.find()
      .sort({ day: 1 })
      .session(session);
  });
} finally {
  await session.endSession();
}
    

    res.json({
      success: true,
      message: "Reward configuration updated successfully",
      rewards: updatedRewards
    });
  } catch (error) {
    console.error("Reward update error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update rewards"
    });
  }
});

module.exports = router;