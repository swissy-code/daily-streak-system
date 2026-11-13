
import React, { useEffect, useState } from "react";
import API from "./api/api";

function AdminDashboard() {
  const [giftCards, setGiftCards] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [rewards, setRewards] = useState([]);
const [rewardsLoading, setRewardsLoading] = useState(true);
const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [streakUsers, setStreakUsers] = useState([]);
const [streakLoading, setStreakLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch gift cards
  const fetchGiftCards = async () => {
    try {
      setLoading(true);

      const response = await API.get("/admin/gift-cards");

      setGiftCards(response.data.entitlements || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to fetch gift cards"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);

      const response = await API.get("/admin/users");

      setUsers(response.data.users || []);
    } catch (err) {
      console.error("Unable to fetch users:", err);
    } finally {
      setUsersLoading(false);
    }
  };
  const fetchStreakUsers = async () => {
  try {
    setStreakLoading(true);

    const response = await API.get("/admin/users/streaks");

    setStreakUsers(response.data.users || []);
  } catch (err) {
    console.error("Unable to fetch streak statistics:", err);
  } finally {
    setStreakLoading(false);
  }
};
const fetchAnalytics = async () => {
  try {
    setAnalyticsLoading(true);

    const response = await API.get("/admin/users/analytics");

    setAnalytics(response.data.analytics);
  } catch (err) {
    console.error("Unable to fetch analytics:", err);
  } finally {
    setAnalyticsLoading(false);
  }
};
const fetchRewards = async () => {
  try {
    setRewardsLoading(true);

    const response = await API.get("/admin/rewards");

    setRewards(response.data.rewards || []);
  } catch (err) {
    console.error("Unable to fetch rewards:", err);
  } finally {
    setRewardsLoading(false);
  }
};

  // Load dashboard data
 useEffect(() => {
  fetchGiftCards();
  fetchUsers();
  fetchStreakUsers();
  fetchAnalytics();
  fetchRewards();
}, []);
  // Fulfil gift card
  
const handleFulfill = async (id) => {
  const confirmed = window.confirm(
    "Are you sure you want to mark this gift card as fulfilled?"
  );

  if (!confirmed) {
    return;
  }

  try {
    setMessage("");
    setError("");

    const response = await API.patch(
      `/admin/gift-cards/${id}/fulfill`
    );

    setMessage(response.data.message);
    await fetchGiftCards();
  } catch (err) {
    setError(
      err.response?.data?.message ||
      "Unable to update gift card"
    );
  }
};

  const handleRewardChange = (day, field, value) => {
  setRewards((previousRewards) =>
    previousRewards.map((reward) =>
      reward.day === day
        ? { ...reward, [field]: value }
        : reward
    )
  );
};

const handleSaveRewards = async () => {
  try {
    setMessage("");
    setError("");
console.log("Rewards being saved:", rewards);
    const response = await API.put("/admin/rewards", {
      rewards
    });

    setRewards(response.data.rewards || []);
    setMessage("Reward configuration saved successfully!");
  } catch (err) {
    setError(
      err.response?.data?.message ||
      "Unable to save reward configuration"
    );
  }
};

  return (
    <div className="dashboard-page">
      <h1>Admin Dashboard</h1>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.reload();
        }}
      >
        Logout
      </button>

      {/* User Management */}
      <h2>Platform Analytics</h2>

{analyticsLoading && <p>Loading analytics...</p>}

{analytics && (
  <section className="stats-grid">
    <div className="stat-card">
      <p>Total Users</p>
      <h2>{analytics.totalUsers}</h2>
    </div>

    <div className="stat-card">
      <p>Active Streak Users</p>
      <h2>{analytics.activeStreakUsers}</h2>
    </div>

    <div className="stat-card">
      <p>Total VE Rewarded</p>
      <h2>{analytics.totalVERewarded} VEs</h2>
    </div>

    <div className="stat-card">
      <p>Total VE Debited</p>
      <h2>{analytics.totalVEDebited} VEs</h2>
    </div>

    <div className="stat-card">
      <p>Pending Gift Cards</p>
      <h2>{analytics.pendingGiftCards}</h2>
    </div>

    <div className="stat-card">
      <p>Fulfilled Gift Cards</p>
      <h2>{analytics.fulfilledGiftCards}</h2>
    </div>
  </section>
)}
      <h2>User Management</h2>

      {usersLoading && <p>Loading users...</p>}

      {!usersLoading && users.length === 0 && (
        <p>No registered users found.</p>
      )}

      {users.map((user) => (
        <div className="history-item" key={user._id}>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p>
            <strong>Joined:</strong>{" "}
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}

      {/* Gift Card Management */}
      <h2>User Streak Monitoring</h2>

{streakLoading && <p>Loading streak statistics...</p>}

{!streakLoading && streakUsers.length === 0 && (
  <p>No user statistics available.</p>
)}

{streakUsers.map((user) => (
  <div className="history-item" key={user._id}>
    <h3>{user.name}</h3>

    <p>
      <strong>Email:</strong> {user.email}
    </p>

    <p>
      <strong>Current Streak:</strong> {user.currentDay} / 7 Days
    </p>

    <p>
      <strong>Wallet Balance:</strong> {user.walletBalance} VEs
    </p>

    <p>
      <strong>Total Claims:</strong> {user.totalClaims}
    </p>
  </div>
))}
<h2>Reward Configuration</h2>

{rewardsLoading && <p>Loading reward settings...</p>}

{!rewardsLoading && rewards.map((reward) => (
  <div className="history-item" key={reward.day}>
    <h3>Day {reward.day}</h3>
    <p
  style={{
    fontWeight: "bold",
    color: reward.enabled ? "green" : "red"
  }}
>
  {reward.enabled ? "ACTIVE" : "DISABLED"}
</p>

    <label>Reward Type</label>
    <select
      value={reward.type}
      onChange={(e) =>
        handleRewardChange(
          reward.day,
          "type",
          e.target.value
        )
      }
    >
      <option value="VE">VE</option>
      <option value="GIFT_CARD">Gift Card</option>
    </select>

    <label>Reward Amount</label>
    <input
      type="number"
      min="1"
      value={reward.amount}
      onChange={(e) =>
        handleRewardChange(
          reward.day,
          "amount",
          Number(e.target.value)
        )
      }
    />

    <label>
      <input
        type="checkbox"
        checked={reward.enabled}
        onChange={(e) =>
          handleRewardChange(
            reward.day,
            "enabled",
            e.target.checked
          )
        }
      />
      Enable this reward
    </label>
  </div>
))}

{!rewardsLoading && rewards.length > 0 && (
  <button
    className="btn btn-success"
    onClick={handleSaveRewards}
  >
    Save Reward Configuration
  </button>
)}
      <h2>Gift Card Management</h2>

      {loading && <p>Loading gift cards...</p>}

      {error && (
        <p className="alert alert-danger">{error}</p>
      )}

      {message && (
        <p className="alert alert-success">{message}</p>
      )}

      {!loading && giftCards.length === 0 && (
        <p>No gift card entitlements available yet.</p>
      )}

      {giftCards.map((card) => (
        <div className="history-item" key={card._id}>
          <p>User: {card.userId?.name || "Unknown"}</p>
          <p>Email: {card.userId?.email || "Unknown"}</p>
          <p>Day: {card.day}</p>
          <p>Amount: ₹{card.amount}</p>
          <p>Status: {card.status}</p>

          {card.status === "PENDING" && (
            <button
              className="btn btn-success"
              onClick={() => handleFulfill(card._id)}
            >
              Mark Fulfilled
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
