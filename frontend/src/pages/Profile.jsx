import { useState } from "react";
import api from "../services/api";

export default function Profile() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const [resetting, setResetting] = useState(false);

  const handleResetTransactions = async () => {
    const confirmed = window.confirm(
      "⚠️ Reset all transactions?\n\n" +
        "This will permanently delete:\n" +
        "• All main transactions\n" +
        "• All budget expenses\n\n" +
        "Your budgets and account will NOT be deleted.\n\n" +
        "This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setResetting(true);

      await api.delete("/expenses/reset-all");

      alert(
        "All transactions have been reset successfully."
      );

      window.location.reload();
    } catch (error) {
      console.error(
        "Reset transactions error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to reset transactions."
      );
    } finally {
      setResetting(false);
    }
  };

  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="profile-page">

      {/* HERO */}
      <section className="profile-hero">
        <div>
          <div className="profile-kicker">
            ACCOUNT
          </div>

          <h1>
            Your profile.
          </h1>

          <p>
            Manage your account information and
            control your transaction data.
          </p>
        </div>

        <div className="profile-status">
          <span className="profile-status-dot"></span>

          <div>
            <strong>Account active</strong>
            <small>Your account is ready to use</small>
          </div>
        </div>
      </section>

      {/* ACCOUNT CARD */}
      <section className="profile-account-card">

        <div className="profile-account-top">
          <div>
            <span className="profile-section-label">
              PERSONAL INFORMATION
            </span>

            <h2>Account details</h2>

            <p>
              Your basic account information is shown below.
            </p>
          </div>

          <div className="profile-account-number">
            <span>ACCOUNT</span>
            <strong>01</strong>
          </div>
        </div>

        <div className="profile-user-area">

          <div className="profile-large-avatar">
            {initial}
          </div>

          <div className="profile-user-details">

            <div className="profile-detail">
              <span>Name</span>
              <strong>{userName}</strong>
            </div>

            <div className="profile-detail">
              <span>Email address</span>
              <strong>{userEmail || "Not available"}</strong>
            </div>

          </div>

        </div>
      </section>

      {/* ACCOUNT OVERVIEW */}
      <section className="profile-overview-grid">

        <div className="profile-info-card">
          <div className="profile-info-icon">
            ✓
          </div>

          <div>
            <span>ACCOUNT STATUS</span>
            <strong>Active</strong>
            <p>
              Your account is currently active.
            </p>
          </div>
        </div>

        <div className="profile-info-card">
          <div className="profile-info-icon">
            ₹
          </div>

          <div>
            <span>FINANCIAL DATA</span>
            <strong>Protected</strong>
            <p>
              Your transaction data belongs to your account.
            </p>
          </div>
        </div>

        <div className="profile-info-card">
          <div className="profile-info-icon">
            ◆
          </div>

          <div>
            <span>BUDGETS</span>
            <strong>Preserved</strong>
            <p>
              Resetting transactions will not delete budgets.
            </p>
          </div>
        </div>

      </section>

      {/* DATA MANAGEMENT */}
      <section className="profile-data-card">

        <div className="profile-data-header">

          <div>
            <span className="profile-section-label">
              DATA MANAGEMENT
            </span>

            <h2>Manage your transaction data</h2>

            <p>
              Start fresh by clearing your transaction
              history while keeping your account and
              budgets intact.
            </p>
          </div>

          <div className="profile-warning-icon">
            !
          </div>

        </div>

        <div className="profile-danger-box">

          <div className="profile-danger-content">

            <div className="profile-danger-title">
              <span className="profile-danger-symbol">
                !
              </span>

              <div>
                <h3>Reset transactions</h3>

                <span>
                  Permanent data removal
                </span>
              </div>
            </div>

            <p>
              This permanently deletes all main
              transactions and all budget expenses.
              Your budgets, profile and account will
              remain available.
            </p>

            <div className="profile-danger-list">
              <span>
                <b>×</b> Main transactions will be deleted
              </span>

              <span>
                <b>×</b> Budget expenses will be deleted
              </span>

              <span>
                <b>✓</b> Your budgets will remain
              </span>

              <span>
                <b>✓</b> Your account will remain
              </span>
            </div>

          </div>

          <button
            type="button"
            className="profile-reset-button"
            onClick={handleResetTransactions}
            disabled={resetting}
          >
            <span>
              {resetting ? "..." : "↻"}
            </span>

            {resetting
              ? "Resetting..."
              : "Reset All Transactions"}
          </button>

        </div>

      </section>

      {/* FOOTER NOTE */}
      <section className="profile-footer-card">

        <div className="profile-footer-icon">
          ✦
        </div>

        <div>
          <strong>
            Keep your financial records organized.
          </strong>

          <p>
            Regularly reviewing your transactions can
            help keep your dashboard, budgets and reports
            accurate.
          </p>
        </div>

      </section>

    </div>
  );
}