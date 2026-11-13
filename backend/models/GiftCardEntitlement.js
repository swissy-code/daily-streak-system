const mongoose = require("mongoose");

const giftCardEntitlementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StreakClaim",
      required: true,
      unique: true
    },

    cycleId: {
      type: Number,
      required: true
    },

    day: {
      type: Number,
      required: true,
      enum: [4, 5, 7]
    },

    amount: {
      type: Number,
      required: true,
      min: 1
    },

    currency: {
      type: String,
      default: "INR"
    },

    status: {
      type: String,
      enum: ["PENDING", "FULFILLED", "CANCELLED"],
      default: "PENDING"
    },

    fulfilledAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "GiftCardEntitlement",
  giftCardEntitlementSchema
);