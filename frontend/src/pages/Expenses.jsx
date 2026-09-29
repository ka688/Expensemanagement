import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const categories = [
  "All",
  "Food",
  "Shopping",
  "Transport",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Travel",
  "Salary",
  "Business",
  "Other",
];

const categoryIcons = {
  Food: "🍔",
  Shopping: "🛍️",
  Transport: "🚗",
  Bills: "📄",
  Entertainment: "🎬",
  Health: "❤️",
  Education: "🎓",
  Travel: "✈️",
  Salary: "💰",
  Business: "💼",
  Other: "✨",
};

export default function Expenses() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("newest");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadTransactions();
  }, [category, type, sort, startDate, endDate]);

  const loadTransactions = async () => {
    setLoading(true);

    try {
      const params = {
        category,
        type,
        sort,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const response = await api.get("/expenses", {
        params,
      });

      setTransactions(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadTransactions();
  };

  const deleteTransaction = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/expenses/${id}`);

      setTransactions((current) =>
        current.filter((item) => item._id !== id)
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Delete failed"
      );
    }
  };

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setType("All");
    setSort("newest");
    setStartDate("");
    setEndDate("");
  };

  const totalIncome = useMemo(() => {
    return transactions
      .filter((item) => item.type === "Income")
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((item) => item.type !== "Income")
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );
  }, [transactions]);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="page transactions-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="transactions-hero">

        <div className="transactions-hero-background">
          <span />
          <span />
          <span />
        </div>

        <div className="transactions-hero-content">

          <div className="transactions-kicker">
            <span />
            TRANSACTION CENTER
          </div>

          <h1>
            Every rupee,
            <span> accounted for.</span>
          </h1>

          <p>
            Search, filter and manage all your
            income and expenses from one place.
          </p>

        </div>

        <Link
          to="/add-expense"
          className="transactions-add-button"
        >
          <span className="transactions-add-icon">
            +
          </span>

          <span>
            Add Transaction
          </span>

          <span className="transactions-add-arrow">
            →
          </span>
        </Link>

      </section>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="transaction-summary-grid">

        <div className="transaction-summary-card summary-total">

          <div className="transaction-summary-icon">
            #
          </div>

          <div>
            <span>Total shown</span>

            <strong>
              {transactions.length}
            </strong>

            <small>
              transactions
            </small>
          </div>

        </div>

        <div className="transaction-summary-card summary-income">

          <div className="transaction-summary-icon">
            ↗
          </div>

          <div>
            <span>Income</span>

            <strong>
              {money(totalIncome)}
            </strong>

            <small>
              received
            </small>
          </div>

        </div>

        <div className="transaction-summary-card summary-expense">

          <div className="transaction-summary-icon">
            ↘
          </div>

          <div>
            <span>Expenses</span>

            <strong>
              {money(totalExpenses)}
            </strong>

            <small>
              spent
            </small>
          </div>

        </div>

        <div
          className={`transaction-summary-card ${
            balance >= 0
              ? "summary-balance"
              : "summary-negative"
          }`}
        >

          <div className="transaction-summary-icon">
            ₹
          </div>

          <div>
            <span>Difference</span>

            <strong>
              {money(balance)}
            </strong>

            <small>
              shown income minus expenses
            </small>
          </div>

        </div>

      </section>

      {/* =================================================
          FILTERS
      ================================================= */}

      <section className="transaction-filter-panel">

        <div className="transaction-filter-heading">

          <div>
            <span>FIND SOMETHING</span>

            <h2>
              Search & filters
            </h2>
          </div>

          <button
            type="button"
            className="transaction-clear-button"
            onClick={clearFilters}
          >
            Reset all
            <span>↻</span>
          </button>

        </div>

        <form
          className="transaction-search-box"
          onSubmit={handleSearch}
        >
          <span className="transaction-search-icon">
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search by transaction name..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <button type="submit">
            Search
            <span>→</span>
          </button>
        </form>

        <div className="transaction-filter-grid">

          <div className="transaction-filter-field">
            <label>Category</label>

            <div className="transaction-select-wrap">
              <span>
                {category === "All"
                  ? "◈"
                  : categoryIcons[category] ||
                    "✨"}
              </span>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
              >
                {categories.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="transaction-filter-field">
            <label>Transaction type</label>

            <div className="transaction-select-wrap">
              <span>
                {type === "Income"
                  ? "↗"
                  : type === "Expense"
                    ? "↘"
                    : "◉"}
              </span>

              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value)
                }
              >
                <option value="All">
                  All transactions
                </option>

                <option value="Income">
                  Income
                </option>

                <option value="Expense">
                  Expense
                </option>
              </select>
            </div>
          </div>

          <div className="transaction-filter-field">
            <label>Sort by</label>

            <div className="transaction-select-wrap">
              <span>↕</span>

              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value)
                }
              >
                <option value="newest">
                  Newest first
                </option>

                <option value="oldest">
                  Oldest first
                </option>

                <option value="highest">
                  Highest amount
                </option>

                <option value="lowest">
                  Lowest amount
                </option>
              </select>
            </div>
          </div>

          <div className="transaction-filter-field">
            <label>From date</label>

            <div className="transaction-date-wrap">
              <span>📅</span>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
              />
            </div>
          </div>

          <div className="transaction-filter-field">
            <label>To date</label>

            <div className="transaction-date-wrap">
              <span>📅</span>

              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
              />
            </div>
          </div>

        </div>

        <div className="active-filter-row">

          <span className="active-filter-label">
            Current view:
          </span>

          <span className="active-filter-pill">
            {category === "All"
              ? "All categories"
              : category}
          </span>

          <span className="active-filter-pill">
            {type === "All"
              ? "All types"
              : type}
          </span>

          {(startDate || endDate) && (
            <span className="active-filter-pill">
              📅 Date range
            </span>
          )}

          {search.trim() && (
            <span className="active-filter-pill">
              ⌕ "{search.trim()}"
            </span>
          )}

        </div>

      </section>

      {/* =================================================
          TRANSACTION LIST
      ================================================= */}

      <section className="transaction-list-panel">

        <div className="transaction-list-header">

          <div>
            <span>YOUR ACTIVITY</span>

            <h2>
              Transactions
            </h2>

            <p>
              {transactions.length === 0
                ? "No matching transactions"
                : `${transactions.length} transaction${
                    transactions.length === 1
                      ? ""
                      : "s"
                  } in this view`}
            </p>
          </div>

          <div className="transaction-list-header-right">
            <div className="transaction-status-dot" />
            Live data
          </div>

        </div>

        {loading ? (
          <div className="transaction-loading">

            {[1, 2, 3, 4].map((item) => (
              <div
                className="transaction-skeleton"
                key={item}
              >
                <div className="skeleton-transaction-icon" />

                <div className="skeleton-transaction-lines">
                  <span />
                  <span />
                </div>

                <div className="skeleton-transaction-amount" />
              </div>
            ))}

          </div>
        ) : transactions.length === 0 ? (
          <div className="transaction-empty">

            <div className="transaction-empty-icon">
              🔎
            </div>

            <h3>
              No transactions found
            </h3>

            <p>
              Try changing your search or
              filters, or add a new transaction.
            </p>

            <div className="transaction-empty-actions">

              <button
                type="button"
                onClick={clearFilters}
                className="transaction-empty-reset"
              >
                Clear filters
              </button>

              <Link
                to="/add-expense"
                className="transaction-empty-add"
              >
                Add transaction
                <span>→</span>
              </Link>

            </div>

          </div>
        ) : (
          <div className="premium-transaction-list">

            {transactions.map(
              (transaction) => {
                const isIncome =
                  transaction.type ===
                  "Income";

                const icon =
                  categoryIcons[
                    transaction.category
                  ] || "✨";

                return (
                  <article
                    className="premium-transaction-row"
                    key={transaction._id}
                  >

                    <div
                      className={`premium-transaction-category ${
                        isIncome
                          ? "transaction-category-income"
                          : "transaction-category-expense"
                      }`}
                    >
                      {icon}
                    </div>

                    <div className="premium-transaction-main">

                      <div className="premium-transaction-title">
                        <strong>
                          {transaction.title}
                        </strong>

                        {transaction.description && (
                          <span>
                            {transaction.description}
                          </span>
                        )}
                      </div>

                      <div className="premium-transaction-meta">

                        <span>
                          {transaction.category}
                        </span>

                        <i>•</i>

                        <span>
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

                        <span
                          className={`premium-type-badge ${
                            isIncome
                              ? "premium-type-income"
                              : "premium-type-expense"
                          }`}
                        >
                          {isIncome
                            ? "Income"
                            : "Expense"}
                        </span>

                      </div>

                    </div>

                    <div className="premium-transaction-amount">

                      <strong
                        className={
                          isIncome
                            ? "income-text"
                            : "expense-text"
                        }
                      >
                        {isIncome ? "+" : "-"}
                        {money(
                          transaction.amount
                        )}
                      </strong>

                      <span>
                        {isIncome
                          ? "Money received"
                          : "Money spent"}
                      </span>

                    </div>

                    <div className="premium-transaction-actions">

                      <Link
                        to={`/edit-expense/${transaction._id}`}
                        className="premium-transaction-edit"
                        title="Edit transaction"
                      >
                        ✎
                      </Link>

                      <button
                        type="button"
                        className="premium-transaction-delete"
                        onClick={() =>
                          deleteTransaction(
                            transaction._id
                          )
                        }
                        title="Delete transaction"
                      >
                        🗑
                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* =================================================
          FOOTER CTA
      ================================================= */}

      <section className="transactions-bottom-cta">

        <div>
          <span>
            KEEP TRACKING
          </span>

          <h2>
            Your financial story
            <strong>
              starts with every transaction.
            </strong>
          </h2>
        </div>

        <Link to="/add-expense">
          Add another transaction
          <span>+</span>
        </Link>

      </section>

    </div>
  );
}