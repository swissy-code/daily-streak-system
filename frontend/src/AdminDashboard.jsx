import React, { useEffect, useState } from "react";
import API from "./api/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [giftCards, setGiftCards] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [users, setUsers] = useState([]);
  const [streakUsers, setStreakUsers] = useState([]);

  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [streakLoading, setStreakLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingRewards, setSavingRewards] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // FETCH GIFT CARDS
  const fetchGiftCards = async () => {
    try {
      setLoading(true);
      const response = await API.get("/admin/gift-cards");
      setGiftCards(response.data.entitlements || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to fetch gift cards"
      );
    } finally {
      setLoading(false);
    }
  };

  // FETCH USERS
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

  // FETCH STREAK USERS
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

  // FETCH ANALYTICS
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

  // FETCH REWARDS
  const fetchRewards = async () => {
    try {
      setRewardsLoading(true);
      const response = await API.get("/admin/rewards");
      setRewards(response.data.rewards || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to fetch rewards"
      );
    } finally {
      setRewardsLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftCards();
    fetchUsers();
    fetchStreakUsers();
    fetchAnalytics();
    fetchRewards();
  }, []);

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  // FULFIL GIFT CARD
  const handleFulfill = async (id) => {
    if (!window.confirm("Mark this gift card as fulfilled?")) {
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
        err.response?.data?.message || "Unable to update gift card"
      );
    }
  };

  // UPDATE REWARD FIELD
  const handleRewardChange = (day, field, value) => {
    setRewards((previous) =>
      previous.map((reward) =>
        reward.day === day
          ? { ...reward, [field]: value }
          : reward
      )
    );
  };

  // SAVE REWARDS
  const handleSaveRewards = async () => {
    try {
      setSavingRewards(true);
      setMessage("");
      setError("");

      const response = await API.put("/admin/rewards", {
        rewards
      });

      setRewards(response.data.rewards || []);
      setMessage("Reward configuration saved successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save rewards"
      );
    } finally {
      setSavingRewards(false);
    }
  };

  // FILTER USERS
  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase();

    return (
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
  });

  const statCards = [
    {
      title: "Total Users",
      value: analytics?.totalUsers ?? 0,
      icon: "👥",
      color: "purple"
    },
    {
      title: "Active Streak Users",
      value: analytics?.activeStreakUsers ?? 0,
      icon: "🔥",
      color: "orange"
    },
    {
      title: "Total VE Rewarded",
      value: `${analytics?.totalVERewarded ?? 0} VEs`,
      icon: "🪙",
      color: "green"
    },
    {
      title: "Total VE Debited",
      value: `${analytics?.totalVEDebited ?? 0} VEs`,
      icon: "📊",
      color: "blue"
    },
    {
      title: "Pending Gift Cards",
      value: analytics?.pendingGiftCards ?? 0,
      icon: "🎁",
      color: "pink"
    },
    {
      title: "Fulfilled Gift Cards",
      value: analytics?.fulfilledGiftCards ?? 0,
      icon: "🏆",
      color: "gold"
    }
  ];

  return (
    <div className="admin-page">

      {/* TOP NAVIGATION */}
      <header className="admin-header">
        <div className="admin-brand">
          <div className="admin-brand-icon">V</div>
          <div>
            <h2>VELOOP <span>REWARDS</span></h2>
            <p>ADMIN CONTROL CENTER</p>
          </div>
        </div>

        <div className="admin-header-actions">
          <span className="admin-status">
            <span className="status-dot"></span>
            Administrator
          </span>

          <button
            className="admin-logout"
            onClick={handleLogout}
          >
            Logout ↗
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="admin-container">

        {/* HERO */}
        <section className="admin-hero">
          <div>
            <span className="admin-eyebrow">
              VELOOP MANAGEMENT SYSTEM
            </span>

            <h1>Control Center<span>.</span></h1>

            <p>
              Manage your platform, monitor streaks and control rewards.
            </p>
          </div>

          <div className="admin-hero-icon">⚡</div>
        </section>

        {/* ALERTS */}
        {error && (
          <div className="admin-alert admin-alert-error">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {message && (
          <div className="admin-alert admin-alert-success">
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {/* ANALYTICS */}
        <section className="admin-section" id="analytics">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">PLATFORM OVERVIEW</span>
              <h2>Platform Analytics</h2>
              <p>Your platform performance at a glance.</p>
            </div>
            <span className="admin-section-icon">📈</span>
          </div>

          {analyticsLoading ? (
            <p className="admin-loading">Loading analytics...</p>
          ) : (
            <div className="admin-stats-grid">
              {statCards.map((stat) => (
                <div
                  className={`admin-stat-card ${stat.color}`}
                  key={stat.title}
                >
                  <div className="admin-stat-top">
                    <span>{stat.title}</span>
                    <div className="admin-stat-icon">
                      {stat.icon}
                    </div>
                  </div>

                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* USER MANAGEMENT */}
        <section className="admin-section" id="users">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">ACCOUNT MANAGEMENT</span>
              <h2>User Management</h2>
              <p>View registered members and account details.</p>
            </div>
            <span className="admin-section-icon">👥</span>
          </div>

          <input
            className="admin-search"
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {usersLoading ? (
            <p className="admin-loading">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-empty">No matching users found.</div>
          ) : (
            <div className="admin-user-grid">
              {filteredUsers.map((user) => (
                <div className="admin-user-card" key={user._id}>
                  <div className="admin-user-top">
                    <div className="admin-avatar">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <span
                      className={
                        user.role === "ADMIN"
                          ? "admin-role admin-role-admin"
                          : "admin-role"
                      }
                    >
                      {user.role || "USER"}
                    </span>
                  </div>

                  <h3>{user.name}</h3>
                  <p className="admin-user-email">{user.email}</p>

                  <div className="admin-user-meta">
                    <span>Joined</span>
                    <strong>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* STREAK MONITORING */}
        <section className="admin-section" id="streaks">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">MEMBER ACTIVITY</span>
              <h2>Streak Monitoring</h2>
              <p>Monitor user streak progress and wallet balances.</p>
            </div>
            <span className="admin-section-icon">🔥</span>
          </div>

          {streakLoading ? (
            <p className="admin-loading">Loading streak statistics...</p>
          ) : streakUsers.length === 0 ? (
            <div className="admin-empty">
              No streak statistics available.
            </div>
          ) : (
            <div className="admin-streak-grid">
              {streakUsers.map((user) => (
                <div className="admin-streak-card" key={user._id}>
                  <div className="admin-streak-user">
                    <div className="admin-avatar">🔥</div>
                    <div>
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                    </div>
                  </div>

                  <div className="admin-streak-metrics">
                    <div>
                      <span>Current Cycle</span>
                      <strong>{user.currentDay} / 7</strong>
                    </div>

                    <div>
                      <span>Wallet Balance</span>
                      <strong>{user.walletBalance} VEs</strong>
                    </div>

                    <div>
                      <span>Total Claims</span>
                      <strong>{user.totalClaims}</strong>
                    </div>
                  </div>

                  <div className="admin-progress-track">
                    <div
                      className="admin-progress-fill"
                      style={{
                        width: `${Math.min(
                          (Number(user.currentDay || 0) / 7) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* REWARD CONFIGURATION */}
        <section className="admin-section" id="rewards">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">REWARD MANAGEMENT</span>
              <h2>Seven-Day Reward Cycle</h2>
              <p>Configure the rewards available to your members.</p>
            </div>
            <span className="admin-section-icon">🎁</span>
          </div>

          {rewardsLoading ? (
            <p className="admin-loading">Loading reward settings...</p>
          ) : rewards.length === 0 ? (
            <div className="admin-empty">
              No reward configuration found. Check your administrator
              permissions and refresh the page.
            </div>
          ) : (
            <>
              <div className="admin-reward-calendar">
                {rewards.map((reward) => (
                  <div
                    className={`admin-reward-card ${
                      reward.enabled ? "reward-active" : "reward-disabled"
                    }`}
                    key={reward.day}
                  >
                    <div className="admin-reward-top">
                      <span>DAY {reward.day}</span>
                      <span className="admin-reward-status">
                        {reward.enabled ? "ACTIVE" : "DISABLED"}
                      </span>
                    </div>

                    <div className="admin-reward-icon">
                      {reward.enabled
                        ? reward.type === "VE" ? "🪙" : "🎁"
                        : "🔒"}
                    </div>

                    <strong className="admin-reward-value">
                      {reward.type === "VE"
                        ? `${reward.amount} VEs`
                        : `₹${reward.amount}`}
                    </strong>

                    <span className="admin-reward-caption">
                      {reward.type === "VE" ? "VE Reward" : "Gift Card"}
                    </span>

                    <div className="admin-reward-fields">
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
                        step="1"
                        value={reward.amount}
                        onChange={(e) =>
                          handleRewardChange(
                            reward.day,
                            "amount",
                            Number(e.target.value)
                          )
                        }
                      />

                      <label className="admin-toggle">
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
                        Enable reward
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-reward-footer">
                <p>Changes apply after saving your configuration.</p>

                <button
                  className="admin-save-button"
                  onClick={handleSaveRewards}
                  disabled={savingRewards}
                >
                  {savingRewards ? "Saving..." : "Save Reward Configuration →"}
                </button>
              </div>
            </>
          )}
        </section>

        {/* GIFT CARD MANAGEMENT */}
        <section className="admin-section" id="giftcards">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">REDEMPTION MANAGEMENT</span>
              <h2>Gift Card Management</h2>
              <p>Track and fulfil member gift card entitlements.</p>
            </div>
            <span className="admin-section-icon">🎫</span>
          </div>

          {loading ? (
            <p className="admin-loading">Loading gift cards...</p>
          ) : giftCards.length === 0 ? (
            <div className="admin-empty">
              No gift card entitlements available yet.
            </div>
          ) : (
            <div className="admin-gift-grid">
              {giftCards.map((card) => (
                <div className="admin-gift-card" key={card._id}>
                  <div className="admin-gift-icon">🎁</div>

                  <div className="admin-gift-amount">
                    ₹{card.amount}
                  </div>

                  <span
                    className={
                      card.status === "FULFILLED"
                        ? "gift-status gift-fulfilled"
                        : "gift-status gift-pending"
                    }
                  >
                    {card.status}
                  </span>

                  <div className="admin-gift-details">
                    <p>
                      <span>Member</span>
                      <strong>{card.userId?.name || "Unknown"}</strong>
                    </p>

                    <p>
                      <span>Email</span>
                      <strong>{card.userId?.email || "Unknown"}</strong>
                    </p>

                    <p>
                      <span>Reward Day</span>
                      <strong>Day {card.day}</strong>
                    </p>
                  </div>

                  {card.status === "PENDING" && (
                    <button
                      className="admin-fulfill-button"
                      onClick={() => handleFulfill(card._id)}
                    >
                      Mark as Fulfilled ✓
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="admin-footer">
          <strong>VELOOP REWARDS</strong>
          <span>ADMIN CONTROL CENTER</span>
        </footer>

      </main>
    </div>
  );
}

export default AdminDashboard;
