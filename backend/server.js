
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const streakRoutes = require("./routes/streakRoutes");
const walletRoutes = require("./routes/walletRoutes");
const adminGiftCardRoutes = require("./routes/adminGiftCardRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminRewardRoutes = require("./routes/adminRewardRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/streak", streakRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin/gift-cards", adminGiftCardRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/rewards", adminRewardRoutes);

app.get("/", (req, res) => {
  res.send("Daily Streak Backend is Running!");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(
  "MongoDB Replica Set:",
  mongoose.connection.client.topology.description.type
);

    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

startServer();
