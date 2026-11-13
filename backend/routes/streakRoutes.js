const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const auth = require("../middleware/auth");

const Streak = require("../models/Streak");
const StreakClaim = require("../models/StreakClaim");
const Wallet = require("../models/Wallet");
const RewardConfig = require("../models/RewardConfig");
const WalletTransaction = require("../models/WalletTransaction");
const GiftCardEntitlement = require("../models/GiftCardEntitlement");

const rewards = require("../config/rewards");

// GET STREAK STATUS
router.get("/status", auth, async (req, res) => {
  try {
    let streak = await Streak.findOne({
      userId: req.userId
    });

    if (!streak) {
      streak = await Streak.create({
        userId: req.userId,
        cycleId: 1,
        currentDay: 0
      });
    }

    const now = new Date();
    const canClaim =
      !streak.nextClaimAt || now >= streak.nextClaimAt;

    const nextDay =
      streak.currentDay < 7 ? streak.currentDay + 1 : null;

    const nextReward = nextDay
  ? await RewardConfig.findOne({
      day: nextDay
    }).select("day type amount enabled")
  : null;

    const remainingMilliseconds = streak.nextClaimAt
      ? Math.max(0, streak.nextClaimAt - now)
      : 0;

    res.json({
      success: true,
      currentDay: streak.currentDay,
      nextDay,
      nextReward,
      canClaim,
      nextClaimAt: streak.nextClaimAt,
      remainingMilliseconds
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch status" });
  }
});


// CLAIM DAILY REWARD

router.post("/claim", auth, async (req, res) => {
  const rawIdempotencyKey = req.headers["idempotency-key"];

if (
  typeof rawIdempotencyKey !== "string" ||
  !rawIdempotencyKey.trim() ||
  rawIdempotencyKey.length > 128
) {
  return res.status(400).json({
    success: false,
    message: "Invalid or missing idempotency key"
  });
}

const idempotencyKey = rawIdempotencyKey.trim();

  let session;

try {
  session = await mongoose.startSession();

  let claimResult;

    await session.withTransaction(async () => {
      // Check if this request was already processed
      const existingClaim = await StreakClaim.findOne({
        userId: req.userId,
        idempotencyKey
      }).session(session);

      if (existingClaim) {
        claimResult = {
          day: existingClaim.day,
          rewardType: existingClaim.rewardType,
          amount: existingClaim.amount,
          claimedAt: existingClaim.claimedAt,
          alreadyProcessed: true
        };
        return;
      }

      let streak = await Streak.findOne({
        userId: req.userId
      }).session(session);

      if (!streak) {
        streak = new Streak({
          userId: req.userId,
          cycleId: 1,
          currentDay: 0
        });
      }

      const now = new Date();

      if (streak.nextClaimAt && now < streak.nextClaimAt) {
        const error = new Error(
          "Reward already claimed. Please wait."
        );
        error.status = 429;
        throw error;
      }

      const nextDay = streak.currentDay + 1;

      if (nextDay > 7) {
        const error = new Error("Reward cycle completed.");
        error.status = 400;
        throw error;
      }

      const reward = await RewardConfig.findOne({
  day: nextDay,
  enabled: true
}).session(session);

if (!reward) {
  const error = new Error(
    "Today's reward is disabled or not configured."
  );
  error.status = 400;
  throw error;
}

      const [claim] = await StreakClaim.create([{
        userId: req.userId,
        cycleId: streak.cycleId,
        day: nextDay,
        rewardType: reward.type,
        amount: reward.amount,
        claimedAt: now,
        idempotencyKey
      }], { session });

      // Credit VE rewards
      // Create gift card entitlement for gift-card rewards
if (reward.type === "GIFT_CARD") {
  await GiftCardEntitlement.create(
    [
      {
        userId: req.userId,
        claimId: claim._id,
        cycleId: claim.cycleId,
        day: nextDay,
        amount: reward.amount,
        currency: "INR",
        status: "PENDING"
      }
    ],
    { session }
  );
}
      if (reward.type === "VE") {
        let wallet = await Wallet.findOne({
          userId: req.userId
        }).session(session);

        if (!wallet) {
          [wallet] = await Wallet.create([{
            userId: req.userId,
            balance: 0
          }], { session });
        }

        wallet.balance += reward.amount;
        await wallet.save({ session });

        await WalletTransaction.create([{
          userId: req.userId,
          type: "CREDIT",
          amount: reward.amount,
          description: `Day ${nextDay} streak reward`,
          referenceId: claim._id
        }], { session });
      }

      // Update streak and cycle
streak.lastClaimedAt = now;

if (nextDay === 7) {
  // Day 7 completed: immediately start a new cycle
  streak.cycleId += 1;
  streak.currentDay = 0;
  streak.nextClaimAt = null;
} else {
  // Normal daily claim: wait 24 hours
  streak.currentDay = nextDay;
  streak.nextClaimAt = new Date(
    now.getTime() + 24 * 60 * 60 * 1000
  );
}

await streak.save({ session });

claimResult = {
  day: nextDay,
  rewardType: reward.type,
  amount: reward.amount,
  claimedAt: now,
  cycleId: claim.cycleId,
  nextCycleId: streak.cycleId,
  nextClaimAt: streak.nextClaimAt,
  alreadyProcessed: false
};

      
    });

    res.status(200).json({
      success: true,
      message: claimResult.alreadyProcessed
        ? "Request already processed"
        : "Reward claimed successfully",
      claim: claimResult
    });

  }   catch (error) {
    console.error("Claim error:", error);

    // If a duplicate-key error occurs, check whether
    // this exact request was already successfully processed.
    if (error.code === 11000) {
      try {
        const existingClaim = await StreakClaim.findOne({
          userId: req.userId,
          idempotencyKey
        });

        if (existingClaim) {
          return res.status(200).json({
            success: true,
            message: "Request already processed",
            claim: {
              day: existingClaim.day,
              rewardType: existingClaim.rewardType,
              amount: existingClaim.amount,
              claimedAt: existingClaim.claimedAt,
              alreadyProcessed: true
            }
          });
        }
      } catch (lookupError) {
        console.error("Duplicate lookup error:", lookupError);
      }

      return res.status(409).json({
        success: false,
        message: "Duplicate claim request detected"
      });
    }

    return res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Unable to claim reward"
    });

  } finally {
  if (session) {
    await session.endSession();
  }
}
});
// GET PUBLIC REWARD CONFIGURATION FOR LOGGED-IN USERS
router.get("/rewards", auth, async (req, res) => {
  try {
    const rewards = await RewardConfig.find()
      .sort({ day: 1 })
      .select("day type amount enabled");

    res.json({
      success: true,
      rewards
    });

  } catch (error) {
    console.error("Rewards fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch rewards"
    });
  }
});
// GET STREAK CLAIM HISTORY
router.get("/history", auth, async (req, res) => {
  try {
    const claims = await StreakClaim.find({
      userId: req.userId
    }).sort({ claimedAt: -1 });

    res.json({
      success: true,
      totalClaims: claims.length,
      claims
    });

  } catch (error) {
    console.error("History Error:", error);

    res.status(500).json({
      message: "Unable to fetch claim history"
    });
  }
});
// Get user's gift card entitlements
router.get("/gift-cards", auth, async (req, res) => {
  try {
    const entitlements = await GiftCardEntitlement.find({
      userId: req.userId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      totalEntitlements: entitlements.length,
      entitlements
    });

  } catch (error) {
    console.error("Gift card fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch gift cards"
    });
  }
});
module.exports = router;