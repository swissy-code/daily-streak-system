
import React, { useEffect, useState, useRef } from "react";
import API from "./api/api";
import "./Dashboard.css";

function Dashboard() {
  const [streak, setStreak] = useState(null);
  const claimKeyRef = useRef(null);
  const [wallet, setWallet] = useState(null);
  const [history, setHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [rewards, setRewards] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [remainingTime, setRemainingTime] = useState("");

  // FETCH DASHBOARD DATA
  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const [
        streakResponse,
        walletResponse,
        historyResponse,
        transactionResponse,
        giftCardResponse,
        rewardsResponse
      ] = await Promise.all([
        API.get("/streak/status", config),
        API.get("/wallet", config),
        API.get("/streak/history", config),
        API.get("/wallet/transactions", config),
        API.get("/streak/gift-cards", config),
        API.get("/streak/rewards", config)
      ]);

      setStreak(streakResponse.data);
      setWallet(walletResponse.data);
      setHistory(historyResponse.data.claims || []);
      setTransactions(
        transactionResponse.data.transactions || []
      );
      setGiftCards(
        giftCardResponse.data.entitlements || []
      );
      setRewards(
        rewardsResponse.data.rewards || []
      );

      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  // CLAIM REWARD
  
const handleClaim = async () => {
  try {
    setClaiming(true);
    setClaimMessage("");

    const token = localStorage.getItem("token");

    if (!claimKeyRef.current) {
      claimKeyRef.current = crypto.randomUUID();
    }

    const idempotencyKey = claimKeyRef.current;

    const response = await API.post(
      "/streak/claim",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": idempotencyKey
        }
      }
    );

    claimKeyRef.current = null;

    setClaimMessage(
      response.data.message ||
      "Reward claimed successfully!"
    );

    await fetchDashboard();

  } catch (err) {
    setClaimMessage(
      err.response?.data?.message ||
      "Unable to claim reward"
    );

  } finally {
    setClaiming(false);
  }
};

  // INITIAL DASHBOARD LOAD
  useEffect(() => {
    fetchDashboard();
  }, []);

  // LIVE COUNTDOWN
  useEffect(() => {
    if (!streak?.nextClaimAt || streak.canClaim) {
      setRemainingTime("");
      return;
    }

    let refreshed = false;

    const updateCountdown = () => {
      const difference =
        new Date(streak.nextClaimAt).getTime() -
        Date.now();

      if (difference <= 0) {
        setRemainingTime("00h : 00m : 00s");

        if (!refreshed) {
          refreshed = true;
          fetchDashboard();
        }

        return;
      }

      const hours = Math.floor(
        difference / 3600000
      );

      const minutes = Math.floor(
        (difference % 3600000) / 60000
      );

      const seconds = Math.floor(
        (difference % 60000) / 1000
      );

      setRemainingTime(
        `${String(hours).padStart(2, "0")}h : ` +
        `${String(minutes).padStart(2, "0")}m : ` +
        `${String(seconds).padStart(2, "0")}s`
      );
    };

    updateCountdown();

    const timer = setInterval(
      updateCountdown,
      1000
    );

    return () => clearInterval(timer);
  }, [streak?.nextClaimAt, streak?.canClaim]);

  // LOADING
  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading dashboard...
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="dashboard-error">
        {error}
      </div>
    );
  }

  if (!streak || !wallet) {
    return (
      <div className="dashboard-error">
        Dashboard data unavailable.
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <h2>Daily Streak</h2>
          <p>
            Keep your streak alive and earn rewards!
          </p>
        </div>

        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.reload();
          }}
        >
          Logout
        </button>
      </header>

      {/* WELCOME */}
      <section className="welcome-card">
        <h3>
          Welcome, {
            JSON.parse(
              localStorage.getItem("user") || "{}"
            )?.name
          }!
        </h3>

        <p>
          You're building a great daily habit.
        </p>
      </section>

      {/* STATISTICS */}
      <section className="stats-grid">

        <div className="stat-card">
          <p>Current Streak</p>
          <h2>{streak.currentDay} / 7 Days</h2>
        </div>

        <div className="stat-card">
          <p>Wallet Balance</p>
          <h2>{wallet.balance} VEs</h2>
        </div>

        <div className="stat-card">
          <p>Current Cycle</p>
          <h2>Cycle {streak.cycleId}</h2>
        </div>

      </section>

      {/* SEVEN DAY REWARDS */}
      <section className="rewards-section">
        <h3>Your 7-Day Rewards</h3>

        <div className="rewards-grid">
          {rewards.map((reward) => (
            <div
              className={`reward-card ${
  reward.enabled === false
    ? "disabled"
    : reward.day <= streak.currentDay
    ? "claimed"
    : ""
}`}
              key={reward.day}
            >
              <h4>Day {reward.day}</h4>

              <div className="reward-icon">
                {reward.type === "VE" ? "🪙" : "🎁"}
              </div>

              <p>
                {reward.type === "VE"
                  ? `${reward.amount} VEs`
                  : `₹${reward.amount} Gift Card`}
              </p>

              <small>
  {reward.enabled === false
    ? "Unavailable"
    : reward.day <= streak.currentDay
    ? "Claimed"
    : "Upcoming"}
</small>
            </div>
          ))}
        </div>
      </section>

      {/* NEXT REWARD */}
      <section className="claim-section">
        <h3>Next Reward</h3>

        <p>
          {streak.canClaim
            ? "Your next reward is ready!"
            : `Your next reward is Day ${streak.nextDay}`}
        </p>

        <p>
          {streak.nextReward?.type === "VE"
            ? `${streak.nextReward.amount} VEs`
            : `₹${streak.nextReward?.amount} Gift Card`}
        </p>

        <p>
          {streak.canClaim
            ? "You can claim now!"
            : "Your next reward unlocks in:"}
        </p>

        {!streak.canClaim && (
          <h2 className="countdown-timer">
            {remainingTime || "Calculating..."}
          </h2>
        )}

        <button
          className="claim-button"
          disabled={
  !streak.canClaim ||
  claiming ||
  streak.nextReward?.enabled === false
}
          onClick={handleClaim}
        >
          {claiming
  ? "Claiming..."
  : streak.nextReward?.enabled === false
  ? "Reward Unavailable"
  : streak.canClaim
  ? "Claim Reward"
  : "Reward Locked"}
        </button>

        {claimMessage && (
          <p className="mt-3">
            {claimMessage}
          </p>
        )}
      </section>

      {/* CLAIM HISTORY */}
      <section className="history-section">
        <h3>Claim History</h3>

        {history.length === 0 ? (
          <p>No rewards claimed yet.</p>
        ) : (
          history.map((item) => (
            <div
              className="history-item"
              key={item._id}
            >
              <span>Day {item.day}</span>

              <span>
                {item.rewardType === "VE"
                  ? `${item.amount} VEs`
                  : `₹${item.amount} Gift Card`}
              </span>

              <span>
                {new Date(
                  item.claimedAt
                ).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </section>

      {/* WALLET TRANSACTIONS */}
      <section className="history-section">
        <h3>Wallet Transactions</h3>

        {transactions.length === 0 ? (
          <p>No wallet transactions yet.</p>
        ) : (
          transactions.map((item) => (
            <div
              className="history-item"
              key={item._id}
            >
              <span
                className={`transaction-badge ${
                  item.type === "CREDIT"
                    ? "credit-badge"
                    : "debit-badge"
                }`}
              >
                {item.type === "CREDIT"
                  ? "Credit"
                  : "Debit"}
              </span>

              <span>
                {item.type === "CREDIT" ? "+" : "-"}
                {item.amount} VEs
              </span>

              <span>{item.description}</span>

              <span>
                {new Date(
                  item.createdAt
                ).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </section>

      {/* MY GIFT CARDS */}
      <section className="history-section">
        <h2>My Gift Cards</h2>

        {giftCards.length === 0 ? (
          <p>No gift cards earned yet.</p>
        ) : (
          giftCards.map((card) => (
            <div
              className="history-item"
              key={card._id}
            >
              <span>Day {card.day}</span>
              <span>₹{card.amount}</span>
              <span>{card.status}</span>
              <span>Cycle {card.cycleId}</span>
            </div>
          ))
        )}
      </section>

    </div>
  );
}

export default Dashboard;
