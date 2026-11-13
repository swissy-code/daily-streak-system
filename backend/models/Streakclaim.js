const mongoose = require("mongoose");

const streakClaimSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  cycleId: {
    type: Number,
    required: true
  },
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  rewardType: {
    type: String,
    enum: ["VE", "GIFT_CARD"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  idempotencyKey: {
  type: String,
  required: true
},
  claimedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

streakClaimSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true }

);

module.exports = mongoose.model("StreakClaim", streakClaimSchema);