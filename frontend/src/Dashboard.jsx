
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
      
      {/* PREMIUM DAILY STREAK */}
      <section className="streak-premium">

        <div className="streak-hero">
          <div className="streak-hero-content">
            <span className="streak-eyebrow">VELOOP REWARDS</span>
            <h2>Daily Streak</h2>
            <p>Keep showing up. Keep earning rewards.</p>

            <div className="streak-hero-number">
              <span className="streak-flame">🔥</span>
              <div>
                <strong>{streak.currentDay || 0}</strong>
                <span> DAYS COMPLETED</span>
              </div>
            </div>
          </div>

          <div className="streak-hero-side">
            <div className="streak-cycle-badge">
              <span>YOUR CURRENT CYCLE</span>
              <strong>#{streak.cycleId || 1}</strong>
            </div>

            <div className="streak-progress-info">
              <span>Weekly progress</span>
              <strong>
                {Math.min(
                  Number(streak.currentDay || 0),
                  7
                )} / 7
              </strong>
            </div>

            <div className="streak-progress-track">
              <div
                className="streak-progress-fill"
                style={{
                  width: `${Math.min(
                    (Number(streak.currentDay || 0) / 7) * 100,
                    100
                  )}%`
                }}
              />
            </div>

            <small>Complete all 7 days to finish your cycle</small>
          </div>
        </div>

        {/* STREAK STATISTICS */}
        <div className="streak-stats">

          <div className="streak-stat-card">
            <span className="streak-stat-icon">🔥</span>
            <div>
              <small>Current Streak</small>
              <strong>{streak.currentDay || 0} Days</strong>
            </div>
          </div>

          <div className="streak-stat-card">
            <span className="streak-stat-icon">🪙</span>
            <div>
              <small>Wallet Balance</small>
              <strong>{wallet.balance || 0} VEs</strong>
            </div>
          </div>

          <div className="streak-stat-card">
            <span className="streak-stat-icon">🏆</span>
            <div>
              <small>Longest Streak</small>
              <strong>Not tracked</strong>
            </div>
          </div>

        </div>

        {/* SEVEN DAY CALENDAR */}
        <div className="streak-panel">

          <div className="streak-section-heading">
            <div>
              <span className="streak-eyebrow">YOUR REWARD JOURNEY</span>
              <h3>7-Day Streak Calendar</h3>
              <p>Complete each day to unlock your rewards.</p>
            </div>

            <span className="streak-cycle-label">
              CYCLE {streak.cycleId || 1}
            </span>
          </div>

          <div className="streak-calendar">
            {rewards.map((reward) => {
              const completed =
                reward.day <= Number(streak.currentDay || 0);

              const isNext =
                reward.day === Number(streak.nextDay);

              const unavailable = reward.enabled === false;

              const dayStatus = unavailable
                ? "Unavailable"
                : completed
                ? "Completed"
                : isNext
                ? streak.canClaim
                  ? "Ready to claim"
                  : "Next reward"
                : "Locked";

              return (
                <div
                  className={`streak-day-card ${
                    completed
                      ? "day-completed"
                      : isNext
                      ? "day-current"
                      : "day-upcoming"
                  } ${unavailable ? "day-disabled" : ""}`}
                  key={reward.day}
                >
                  <span className="streak-day-label">
                    DAY {reward.day}
                  </span>

                  <div className="streak-day-icon">
                    {unavailable
                      ? "🔒"
                      : completed
                      ? "✓"
                      : reward.type === "VE"
                      ? "🪙"
                      : "🎁"}
                  </div>

                  <strong className="streak-day-reward">
                    {reward.type === "VE"
                      ? `${reward.amount} VEs`
                      : `₹${reward.amount}`}
                  </strong>

                  <span className="streak-day-status">
                    {dayStatus}
                  </span>
                </div>
              );
            })}
          </div>

          {/* MILESTONE HIGHLIGHT */}
          {rewards.find((reward) => reward.day === 7) && (
            <div className="streak-milestone">
              <span className="milestone-icon">🏆</span>

              <div>
                <strong>7-Day Milestone</strong>
                <p>
                  Complete your full streak cycle to unlock your
                  Day 7 reward:
                  {" "}
                  {rewards.find((reward) => reward.day === 7).type === "VE"
                    ? `${rewards.find((reward) => reward.day === 7).amount} VEs`
                    : `₹${rewards.find((reward) => reward.day === 7).amount} Gift Card`}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* NEXT REWARD */}
        <div className="streak-next-reward">

          <div className="next-reward-content">
            <span className="streak-eyebrow">YOUR NEXT UNLOCK</span>

            <h3>
              {streak.canClaim
                ? "Your reward is ready!"
                : `Day ${streak.nextDay || 1} is waiting`}
            </h3>

            <p>
              {streak.nextReward?.type === "VE"
                ? `${streak.nextReward.amount} VEs`
                : streak.nextReward
                ? `₹${streak.nextReward.amount} Gift Card`
                : "Your next reward"}
            </p>

            <span className="next-reward-description">
              {streak.canClaim
                ? "Claim your reward and continue your journey."
                : "Come back when your countdown is complete."}
            </span>
          </div>

          <div className="next-reward-action">

            {!streak.canClaim && (
              <>
                <span className="countdown-label">UNLOCKS IN</span>
                <h2 className="countdown-timer">
                  {remainingTime || "Calculating..."}
                </h2>
              </>
            )}

            <button
              className="claim-button premium-claim-button"
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
                ? "Claim Your Reward →"
                : "🔒 Reward Locked"}
            </button>

          </div>

          {claimMessage && (
            <p className="streak-claim-message">
              {claimMessage}
            </p>
          )}

        </div>

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
