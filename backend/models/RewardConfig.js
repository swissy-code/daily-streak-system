const mongoose = require("mongoose");

const rewardConfigSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 7
  },

  type: {
    type: String,
    enum: ["VE", "GIFT_CARD"],
    required: true
  },

  amount: {
  type: Number,
  required: true,
  min: 1,
  validate: {
    validator: Number.isInteger,
    message: "Reward amount must be a whole number"
  }
},

  enabled: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model(
  "RewardConfig",
  rewardConfigSchema
);