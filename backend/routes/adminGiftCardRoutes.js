const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const GiftCardEntitlement = require("../models/GiftCardEntitlement");

const router = express.Router();

// View all gift card entitlements (admin only)
router.get("/", auth, admin, async (req, res) => {
  try {
    const entitlements = await GiftCardEntitlement.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    res.json({
      success: true,
      totalEntitlements: entitlements.length,
      entitlements
    });
  } catch (error) {
    console.error("Admin gift card fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch gift card entitlements"
    });
  }
});

// Mark a gift card entitlement as fulfilled (admin only)
router.patch("/:id/fulfill", auth, admin, async (req, res) => {
  try {
    const entitlement = await GiftCardEntitlement.findById(req.params.id);

    if (!entitlement) {
      return res.status(404).json({
        success: false,
        message: "Gift card entitlement not found"
      });
    }

    if (entitlement.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "Only pending gift cards can be fulfilled"
      });
    }

    entitlement.status = "FULFILLED";
    entitlement.fulfilledAt = new Date();

    await entitlement.save();

    res.json({
      success: true,
      message: "Gift card marked as fulfilled",
      entitlement
    });
  } catch (error) {
    console.error("Gift card fulfilment error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fulfil gift card"
    });
  }
});

module.exports = router;