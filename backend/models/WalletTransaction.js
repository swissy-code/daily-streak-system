const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["CREDIT", "DEBIT"],
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: 1
  },

  description: {
    type: String,
    required: true
  },

  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StreakClaim",
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);