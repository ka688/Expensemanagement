import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import SummaryCard from "../components/SummaryCard";
import ExpenseChart from "../components/ExpenseChart";
import CategoryChart from "../components/CategoryChart";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const response = await api.get("/expenses/summary");
      setSummary(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const money = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const currentMonth = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, []);

  const balance = Number(summary?.balance) || 0;
  const income = Number(summary?.totalIncome) || 0;
  const expenses = Number(summary?.totalExpenses) || 0;

  const expensePercentage =
    income > 0
      ? Math.min(
          Math.round((expenses / income) * 100),
          100
        )
      : 0;

  const recentTransactions =
    summary?.recentTransactions || [];

  const transactionCount =
    summary?.transactionCount || 0;

  if (loading) {
    return (
      <div className="dashboard-loading-screen">
        <div className="dashboard-loading-orb">
          ₹
        </div>

        <div className="dashboard-loading-content">
          <strong>Preparing your dashboard</strong>
          <span>Loading your financial overview...</span>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="dashboard-error-screen">
        <div className="dashboard-error-icon">
          !
        </div>

        <h2>Unable to load dashboard</h2>

        <p>
          We couldn't retrieve your financial
          overview right now.
        </p>

        <button
          type="button"
          className="dashboard-retry-button"
          onClick={() => {
            setLoading(true);
            loadSummary();
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">

      {/* =================================================
          DASHBOARD HERO
      ================================================= */}

      <section className="dashboard-hero">

        <div className="dashboard-hero-background">
          <span />
          <span />
          <span />
        </div>

        <div className="dashboard-hero-content">

          <div className="dashboard-date">
            <span className="dashboard-live-dot" />
            {currentDate}
          </div>

          <h1>
            Your money,
            <span> your control.</span>
          </h1>

          <p>
            Here's your financial overview for{" "}
            <strong>{currentMonth}</strong>.
          </p>

          <div className="dashboard-hero-actions">

            <Link
              to="/add-expense"
              className="dashboard-primary-action"
            >
              <span className="action-plus">
                +
              </span>

              <span>
                Add Transaction
              </span>

              <span className="action-arrow">
                →
              </span>
            </Link>

            <Link
              to="/reports"
              className="dashboard-secondary-action"
            >
              View Reports
              <span>↗</span>
            </Link>

          </div>
        </div>

        <div className="dashboard-hero-balance">

          <div className="balance-label">
            <span>Available balance</span>
            <span className="balance-status">
              {balance >= 0
                ? "● Healthy"
                : "● Attention"}
            </span>
          </div>

          <div
            className={`hero-balance-value ${
              balance < 0
                ? "negative"
                : ""
            }`}
          >
            {money(balance)}
          </div>

          <div className="balance-mini-info">
            <div>
              <span>Income</span>
              <strong>
                {money(income)}
              </strong>
            </div>

            <div>
              <span>Expenses</span>
              <strong>
                {money(expenses)}
              </strong>
            </div>
          </div>

          <div className="balance-progress">

            <div className="balance-progress-label">
              <span>Money retained</span>
              <strong>
                {income > 0
                  ? Math.max(
                      Math.round(
                        ((income -
                          expenses) /
                          income) *
                          100
                      ),
                      0
                    )
                  : 0}
                %
              </strong>
            </div>

            <div className="balance-progress-track">
              <div
                style={{
                  width: `${
                    income > 0
                      ? Math.min(
                          Math.max(
                            ((income -
                              expenses) /
                              income) *
                              100,
                            0
                          ),
                          100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>

          </div>
        </div>

      </section>

      {/* =================================================
          STAT CARDS
      ================================================= */}

      <section className="dashboard-stats-section">

        <div className="dashboard-section-heading">
          <div>
            <span>AT A GLANCE</span>
            <h2>Financial snapshot</h2>
          </div>

          <div className="dashboard-period">
            This month
            <span>⌄</span>
          </div>
        </div>

        <div className="dashboard-stat-grid">

          <div className="dashboard-stat-card dashboard-stat-income">

            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon">
                ↗
              </div>

              <span className="dashboard-stat-badge">
                INCOME
              </span>
            </div>

            <div className="dashboard-stat-value">
              {money(income)}
            </div>

            <div className="dashboard-stat-description">
              Money received
            </div>

            <div className="dashboard-stat-decoration">
              ↗
            </div>

          </div>

          <div className="dashboard-stat-card dashboard-stat-expense">

            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon">
                ↘
              </div>

              <span className="dashboard-stat-badge">
                EXPENSES
              </span>
            </div>

            <div className="dashboard-stat-value">
              {money(expenses)}
            </div>

            <div className="dashboard-stat-description">
              Money spent
            </div>

            <div className="dashboard-stat-decoration">
              ↘
            </div>

          </div>

          <div className="dashboard-stat-card dashboard-stat-balance">

            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon">
                ₹
              </div>

              <span className="dashboard-stat-badge">
                BALANCE
              </span>
            </div>

            <div className="dashboard-stat-value">
              {money(balance)}
            </div>

            <div className="dashboard-stat-description">
              Current available balance
            </div>

            <div className="dashboard-stat-decoration">
              ₹
            </div>

          </div>

          <div className="dashboard-stat-card dashboard-stat-transactions">

            <div className="dashboard-stat-top">
              <div className="dashboard-stat-icon">
                #
              </div>

              <span className="dashboard-stat-badge">
                ACTIVITY
              </span>
            </div>

            <div className="dashboard-stat-value">
              {transactionCount}
            </div>

            <div className="dashboard-stat-description">
              Total transactions
            </div>

            <div className="dashboard-stat-decoration">
              #
            </div>

          </div>

        </div>
      </section>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <section className="dashboard-quick-actions">

        <Link
          to="/add-expense"
          className="quick-action-card quick-action-main"
        >
          <div className="quick-action-icon">
            +
          </div>

          <div>
            <strong>
              Add transaction
            </strong>

            <span>
              Record income or expense
            </span>
          </div>

          <span className="quick-action-arrow">
            →
          </span>
        </Link>

        <Link
          to="/budgets"
          className="quick-action-card"
        >
          <div className="quick-action-icon">
            🎯
          </div>

          <div>
            <strong>
              Manage budgets
            </strong>

            <span>
              Plan your monthly spending
            </span>
          </div>

          <span className="quick-action-arrow">
            →
          </span>
        </Link>

        <Link
          to="/reports"
          className="quick-action-card"
        >
          <div className="quick-action-icon">
            ◔
          </div>

          <div>
            <strong>
              Analyze spending
            </strong>

            <span>
              Explore your financial reports
            </span>
          </div>

          <span className="quick-action-arrow">
            →
          </span>
        </Link>

      </section>

      {/* =================================================
          ANALYTICS
      ================================================= */}

      <section className="dashboard-analytics">

        <div className="dashboard-section-heading analytics-heading">

          <div>
            <span>YOUR NUMBERS</span>
            <h2>Spending analytics</h2>
          </div>

          <div className="analytics-percentage">
            <strong>
              {expensePercentage}%
            </strong>

            <span>
              of income spent
            </span>
          </div>

        </div>

        <div className="dashboard-chart-grid">

          <div className="dashboard-chart-card dashboard-chart-main">

            <div className="dashboard-chart-header">
              <div>
                <span>MONTHLY ACTIVITY</span>
                <h3>
                  Income & expenses
                </h3>
              </div>

              <div className="chart-indicator">
                <span />
                Overview
              </div>
            </div>

            <div className="dashboard-chart-body">
              <ExpenseChart
                data={
                  summary.monthlyData || []
                }
              />
            </div>

          </div>

          <div className="dashboard-chart-card dashboard-chart-category">

            <div className="dashboard-chart-header">
              <div>
                <span>BREAKDOWN</span>
                <h3>
                  Spending by category
                </h3>
              </div>

              <Link to="/reports">
                Details →
              </Link>
            </div>

            <div className="dashboard-chart-body category-chart-body">
              <CategoryChart
                data={
                  summary.categoryTotals ||
                  {}
                }
              />
            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          RECENT TRANSACTIONS
      ================================================= */}

      <section className="dashboard-recent-section">

        <div className="dashboard-recent-card">

          <div className="recent-header dashboard-recent-header">

            <div>
              <span className="dashboard-heading-kicker">
                ACTIVITY
              </span>

              <h2>
                Recent transactions
              </h2>

              <p>
                Your latest financial activity
              </p>
            </div>

            <Link
              to="/expenses"
              className="dashboard-view-all"
            >
              View all
              <span>→</span>
            </Link>

          </div>

          {recentTransactions.length ===
          0 ? (
            <div className="dashboard-empty-state">

              <div className="dashboard-empty-icon">
                💳
              </div>

              <h3>
                No transactions yet
              </h3>

              <p>
                Add your first transaction
                to start tracking your
                finances.
              </p>

              <Link
                to="/add-expense"
                className="dashboard-empty-button"
              >
                Add your first transaction
                <span>→</span>
              </Link>

            </div>
          ) : (
            <div className="dashboard-transaction-list">

              {recentTransactions.map(
                (transaction) => {
                  const isIncome =
                    transaction.type ===
                    "Income";

                  return (
                    <div
                      className="dashboard-transaction"
                      key={transaction._id}
                    >

                      <div className="dashboard-transaction-left">

                        <div
                          className={`dashboard-transaction-icon ${
                            isIncome
                              ? "transaction-income"
                              : "transaction-expense"
                          }`}
                        >
                          {isIncome
                            ? "↗"
                            : "↘"}
                        </div>

                        <div className="dashboard-transaction-info">

                          <strong>
                            {
                              transaction.title
                            }
                          </strong>

                          <span>
                            {
                              transaction.category
                            }

                            <i>•</i>

                            {new Date(
                              transaction.date
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>

                        </div>

                      </div>

                      <div className="dashboard-transaction-right">

                        <strong
                          className={
                            isIncome
                              ? "income-text"
                              : "expense-text"
                          }
                        >
                          {isIncome
                            ? "+"
                            : "-"}
                          {money(
                            transaction.amount
                          )}
                        </strong>

                        <span>
                          {isIncome
                            ? "Income"
                            : "Expense"}
                        </span>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

      </section>

      {/* =================================================
          BOTTOM CTA
      ================================================= */}

      <section className="dashboard-bottom-cta">

        <div className="bottom-cta-content">

          <span className="bottom-cta-label">
            KEEP YOUR FINANCES MOVING
          </span>

          <h2>
            Small decisions.
            <span>
              Better money habits.
            </span>
          </h2>

          <p>
            Keep recording your transactions
            and use your reports to understand
            where your money goes.
          </p>

        </div>

        <Link
          to="/expenses"
          className="bottom-cta-button"
        >
          Explore transactions
          <span>→</span>
        </Link>

      </section>

    </div>
  );
}