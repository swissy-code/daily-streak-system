const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");

// GET WALLET BALANCE
router.get("/", auth, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({
      userId: req.userId
    });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.userId,
        balance: 0
      });
    }

    res.json({
      success: true,
      balance: wallet.balance
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to fetch wallet"
    });
  }
});

// GET WALLET TRANSACTIONS
router.get("/transactions", auth, async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({
      userId: req.userId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      totalTransactions: transactions.length,
      transactions
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to fetch transactions"
    });
  }
});

module.exports = router;