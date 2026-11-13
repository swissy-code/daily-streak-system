const mongoose = require("mongoose");

const streakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  cycleId: {
    type: Number,
    default: 1
  },

  currentDay: {
    type: Number,
    default: 0,
    min: 0,
    max: 7
  },

  lastClaimedAt: {
    type: Date,
    default: null
  },

  nextClaimAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("Streak", streakSchema);