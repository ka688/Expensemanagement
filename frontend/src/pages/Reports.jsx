import { useEffect, useMemo, useState } from "react";

import api from "../services/api";
import ExpenseChart from "../components/ExpenseChart";
import CategoryChart from "../components/CategoryChart";

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get("/expenses/summary");
      setSummary(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const categoryEntries = Object.entries(
    summary?.categoryTotals || {}
  ).sort((a, b) => Number(b[1]) - Number(a[1]));

  const topCategory = categoryEntries[0];

  const savingsRate = useMemo(() => {
    if (!summary?.totalIncome) return 0;

    return Math.max(
      0,
      Math.min(
        100,
        ((summary.totalIncome - summary.totalExpenses) /
          summary.totalIncome) *
          100
      )
    );
  }, [summary]);

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="reports-loading-card">
          <div className="reports-loading-icon">₹</div>
          <h2>Preparing your reports</h2>
          <p>Crunching your financial activity...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="reports-loading">
        <div className="reports-loading-card">
          <div className="reports-loading-icon">!</div>
          <h2>Unable to load reports</h2>
          <p>Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      {/* HERO */}
      <section className="reports-hero">
        <div className="reports-hero-content">
          <div className="reports-kicker">
            FINANCIAL ANALYTICS
          </div>

          <h1>
            See where your
            <span> money goes.</span>
          </h1>

          <p>
            Turn your transaction history into a clearer picture
            of your financial habits, spending patterns and progress.
          </p>
        </div>

        <div className="reports-hero-badge">
          <span className="reports-live-dot"></span>
          <div>
            <strong>Live report</strong>
            <small>Based on your transactions</small>
          </div>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <section className="reports-summary-grid">
        <div className="reports-summary-card income">
          <div className="reports-card-top">
            <div className="reports-card-icon">↗</div>
            <span>INCOME</span>
          </div>

          <strong className="reports-main-number">
            {money(summary.totalIncome)}
          </strong>

          <p>Total money received</p>

          <div className="reports-card-line">
            <span>Overall income</span>
            <span>+</span>
          </div>
        </div>

        <div className="reports-summary-card expense">
          <div className="reports-card-top">
            <div className="reports-card-icon">↘</div>
            <span>EXPENSES</span>
          </div>

          <strong className="reports-main-number">
            {money(summary.totalExpenses)}
          </strong>

          <p>Total money spent</p>

          <div className="reports-card-line">
            <span>Overall spending</span>
            <span>−</span>
          </div>
        </div>

        <div className="reports-summary-card balance">
          <div className="reports-card-top">
            <div className="reports-card-icon">₹</div>
            <span>BALANCE</span>
          </div>

          <strong className="reports-main-number">
            {money(summary.balance)}
          </strong>

          <p>Income minus expenses</p>

          <div className="reports-card-line">
            <span>Current position</span>
            <span>{summary.balance >= 0 ? "↑" : "↓"}</span>
          </div>
        </div>

        <div className="reports-summary-card transactions">
          <div className="reports-card-top">
            <div className="reports-card-icon">#</div>
            <span>ACTIVITY</span>
          </div>

          <strong className="reports-main-number">
            {summary.transactionCount}
          </strong>

          <p>Total transactions</p>

          <div className="reports-card-line">
            <span>Recorded activity</span>
            <span>↗</span>
          </div>
        </div>
      </section>

      {/* INSIGHT STRIP */}
      <section className="reports-insight-strip">
        <div className="reports-insight-icon">✦</div>

        <div className="reports-insight-content">
          <span>QUICK INSIGHT</span>

          <strong>
            {topCategory
              ? `${topCategory[0]} is your largest expense category.`
              : "Start recording transactions to unlock spending insights."}
          </strong>

          <p>
            {topCategory
              ? `${money(topCategory[1])} has been recorded in this category so far.`
              : "Your reports will become more useful as you add transactions."}
          </p>
        </div>

        <div className="reports-savings">
          <span>RETAINED</span>
          <strong>{Math.round(savingsRate)}%</strong>
        </div>
      </section>

      {/* CHARTS */}
      <section className="reports-section-heading">
        <div>
          <span>VISUAL ANALYTICS</span>
          <h2>Your financial patterns</h2>
        </div>

        <p>
          Explore your spending over time and see which categories
          take the biggest share of your money.
        </p>
      </section>

      <section className="reports-charts-grid">
        <div className="reports-chart-card reports-chart-large">
          <div className="reports-chart-header">
            <div>
              <span>MONTHLY ACTIVITY</span>
              <h3>Income & expenses</h3>
            </div>

            <div className="reports-chart-mark">↗</div>
          </div>

          <div className="reports-chart-body">
            <ExpenseChart
              data={summary.monthlyData || []}
            />
          </div>
        </div>

        <div className="reports-chart-card">
          <div className="reports-chart-header">
            <div>
              <span>CATEGORY MIX</span>
              <h3>Where you spend</h3>
            </div>

            <div className="reports-chart-mark">◌</div>
          </div>

          <div className="reports-chart-body reports-category-chart">
            <CategoryChart
              data={summary.categoryTotals || {}}
            />
          </div>
        </div>
      </section>

      {/* CATEGORY BREAKDOWN */}
      <section className="reports-breakdown-card">
        <div className="reports-breakdown-header">
          <div>
            <span>CATEGORY BREAKDOWN</span>
            <h2>Spending by category</h2>
          </div>

          <div className="reports-breakdown-count">
            {categoryEntries.length} categories
          </div>
        </div>

        {categoryEntries.length === 0 ? (
          <div className="reports-empty">
            <div>◌</div>
            <h3>No expense data yet</h3>
            <p>
              Add some transactions and your category breakdown
              will appear here.
            </p>
          </div>
        ) : (
          <div className="reports-category-list">
            {categoryEntries.map(([category, amount], index) => {
              const percentage =
                summary.totalExpenses > 0
                  ? (Number(amount) / summary.totalExpenses) * 100
                  : 0;

              return (
                <div
                  className="reports-category-row"
                  key={category}
                >
                  <div className="reports-category-rank">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="reports-category-info">
                    <div className="reports-category-name">
                      <strong>{category}</strong>
                      <span>
                        {percentage.toFixed(1)}% of expenses
                      </span>
                    </div>

                    <div className="reports-progress-track">
                      <div
                        className="reports-progress-fill"
                        style={{
                          width: `${Math.min(
                            percentage,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <strong className="reports-category-amount">
                    {money(amount)}
                  </strong>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FOOTER CTA */}
      <section className="reports-footer-card">
        <div>
          <span>KEEP GOING</span>
          <h2>Small records create useful insights.</h2>
          <p>
            Keep your transactions up to date so your reports
            continue reflecting your real financial activity.
          </p>
        </div>

        <div className="reports-footer-stat">
          <span>TRANSACTIONS</span>
          <strong>{summary.transactionCount}</strong>
        </div>
      </section>
    </div>
  );
}