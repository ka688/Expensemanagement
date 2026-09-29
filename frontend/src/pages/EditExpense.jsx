import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";

const categories = [
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

export default function EditExpense() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    type: "Expense",
    date: "",
    description: "",
  });

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    try {
      const response =
        await api.get(`/expenses/${id}`);

      const transaction = response.data;

      setForm({
        title: transaction.title || "",
        amount: transaction.amount || "",
        category: transaction.category || "Food",
        type: transaction.type || "Expense",
        date: transaction.date
          ? new Date(transaction.date)
              .toISOString()
              .split("T")[0]
          : "",
        description:
          transaction.description || "",
      });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to load transaction"
      );

      navigate("/expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (Number(form.amount) <= 0) {
      setError(
        "Amount must be greater than zero."
      );
      return;
    }

    setSaving(true);

    try {
      await api.put(`/expenses/${id}`, {
        ...form,
        amount: Number(form.amount),
      });

      navigate("/expenses");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to update transaction"
      );
    } finally {
      setSaving(false);
    }
  };

  const moneyPreview =
    Number(form.amount) > 0
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        }).format(Number(form.amount))
      : "₹0.00";

  if (loading) {
    return (
      <div className="edit-loading-screen">
        <div className="edit-loading-orb">
          ₹
        </div>

        <strong>
          Loading transaction
        </strong>

        <span>
          Preparing your transaction details...
        </span>
      </div>
    );
  }

  return (
    <div className="page edit-transaction-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="edit-transaction-hero">

        <div className="edit-transaction-hero-background">
          <span />
          <span />
          <span />
        </div>

        <div className="edit-transaction-hero-content">

          <div className="edit-transaction-kicker">
            <span />
            EDIT TRANSACTION
          </div>

          <h1>
            Refine the details.
            <span>Keep it accurate.</span>
          </h1>

          <p>
            Update this transaction and keep
            your financial records accurate.
          </p>

        </div>

        <div className="edit-transaction-hero-mark">
          <div>
            ✎
          </div>
        </div>

      </section>

      {/* =====================================================
          MAIN LAYOUT
      ===================================================== */}

      <div className="edit-transaction-layout">

        {/* ===================================================
            FORM
        =================================================== */}

        <section className="edit-transaction-form-card">

          <div className="edit-form-header">

            <div>
              <span>TRANSACTION DETAILS</span>

              <h2>
                Update your transaction
              </h2>

              <p>
                Make the changes you need,
                then save your updated record.
              </p>
            </div>

            <div className="edit-form-badge">
              <span>EDITING</span>
              <strong>01</strong>
            </div>

          </div>

          {error && (
            <div className="edit-transaction-error">

              <div className="edit-error-icon">
                !
              </div>

              <div>
                <strong>
                  Something needs attention
                </strong>

                <span>
                  {error}
                </span>
              </div>

            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* =================================================
                TYPE
            ================================================= */}

            <div className="edit-form-section">

              <div className="edit-section-title">

                <span>01</span>

                <div>
                  <strong>
                    Transaction type
                  </strong>

                  <small>
                    Choose whether money came in
                    or went out.
                  </small>
                </div>

              </div>

              <div className="edit-type-selector">

                <button
                  type="button"
                  className={`edit-type-option ${
                    form.type === "Expense"
                      ? "active edit-expense-option"
                      : ""
                  }`}
                  onClick={() =>
                    setForm({
                      ...form,
                      type: "Expense",
                    })
                  }
                >

                  <span className="edit-type-icon">
                    ↘
                  </span>

                  <span className="edit-type-copy">
                    <strong>
                      Expense
                    </strong>

                    <small>
                      Money spent
                    </small>
                  </span>

                  <span className="edit-type-check">
                    {form.type === "Expense"
                      ? "✓"
                      : ""}
                  </span>

                </button>

                <button
                  type="button"
                  className={`edit-type-option ${
                    form.type === "Income"
                      ? "active edit-income-option"
                      : ""
                  }`}
                  onClick={() =>
                    setForm({
                      ...form,
                      type: "Income",
                    })
                  }
                >

                  <span className="edit-type-icon">
                    ↗
                  </span>

                  <span className="edit-type-copy">
                    <strong>
                      Income
                    </strong>

                    <small>
                      Money received
                    </small>
                  </span>

                  <span className="edit-type-check">
                    {form.type === "Income"
                      ? "✓"
                      : ""}
                  </span>

                </button>

              </div>

            </div>

            {/* =================================================
                BASIC DETAILS
            ================================================= */}

            <div className="edit-form-section">

              <div className="edit-section-title">

                <span>02</span>

                <div>
                  <strong>
                    Basic details
                  </strong>

                  <small>
                    Update the name, amount and date.
                  </small>
                </div>

              </div>

              <div className="edit-form-grid">

                <div className="edit-form-group edit-full">

                  <label>
                    Transaction name
                  </label>

                  <div className="edit-input-wrap">

                    <span>
                      ✦
                    </span>

                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. Groceries..."
                      required
                    />

                  </div>

                </div>

                <div className="edit-form-group">

                  <label>
                    Amount
                  </label>

                  <div className="edit-input-wrap">

                    <span>
                      ₹
                    </span>

                    <input
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />

                  </div>

                </div>

                <div className="edit-form-group">

                  <label>
                    Date
                  </label>

                  <div className="edit-input-wrap">

                    <span>
                      📅
                    </span>

                    <input
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleChange}
                      required
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                CATEGORY
            ================================================= */}

            <div className="edit-form-section">

              <div className="edit-section-title">

                <span>03</span>

                <div>
                  <strong>
                    Category
                  </strong>

                  <small>
                    Move this transaction to another
                    category if needed.
                  </small>
                </div>

              </div>

              <div className="edit-category-picker">

                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={`edit-category-option ${
                      form.category === category
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setForm({
                        ...form,
                        category,
                      })
                    }
                  >

                    <span>
                      {categoryIcons[category]}
                    </span>

                    <strong>
                      {category}
                    </strong>

                  </button>
                ))}

              </div>

            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div className="edit-form-section">

              <div className="edit-section-title">

                <span>04</span>

                <div>
                  <strong>
                    Additional note
                  </strong>

                  <small>
                    Update the optional description.
                  </small>
                </div>

              </div>

              <div className="edit-textarea-wrap">

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Add a note about this transaction..."
                  rows="4"
                  maxLength="500"
                />

                <span>
                  {form.description.length}/500
                </span>

              </div>

            </div>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="edit-form-actions">

              <button
                type="button"
                className="edit-cancel-button"
                onClick={() =>
                  navigate("/expenses")
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={`edit-save-button ${
                  form.type === "Income"
                    ? "edit-save-income"
                    : ""
                }`}
                disabled={saving}
              >

                {saving ? (
                  <>
                    <span className="edit-spinner" />
                    Updating...
                  </>
                ) : (
                  <>
                    <span>
                      Update Transaction
                    </span>

                    <span>
                      →
                    </span>
                  </>
                )}

              </button>

            </div>

          </form>

        </section>

        {/* ===================================================
            PREVIEW
        =================================================== */}

        <aside className="edit-transaction-preview">

          <div className="edit-preview-card">

            <div className="edit-preview-top">

              <span>
                UPDATED PREVIEW
              </span>

              <div>
                <span />
                LIVE
              </div>

            </div>

            <div
              className={`edit-preview-amount ${
                form.type === "Income"
                  ? "edit-preview-income"
                  : "edit-preview-expense"
              }`}
            >
              {form.type === "Income"
                ? "+"
                : "-"}
              {moneyPreview}
            </div>

            <div className="edit-preview-type">
              {form.type === "Income"
                ? "Money received"
                : "Money spent"}
            </div>

            <div className="edit-preview-divider" />

            <div className="edit-preview-details">

              <div>
                <span>
                  NAME
                </span>

                <strong>
                  {form.title ||
                    "Your transaction"}
                </strong>
              </div>

              <div>
                <span>
                  CATEGORY
                </span>

                <strong>
                  <i>
                    {categoryIcons[
                      form.category
                    ]}
                  </i>

                  {form.category}
                </strong>
              </div>

              <div>
                <span>
                  TYPE
                </span>

                <strong>
                  {form.type}
                </strong>
              </div>

              <div>
                <span>
                  DATE
                </span>

                <strong>
                  {form.date
                    ? new Date(
                        `${form.date}T00:00:00`
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "Select date"}
                </strong>
              </div>

            </div>

          </div>

          <div className="edit-history-card">

            <div className="edit-history-icon">
              ↻
            </div>

            <div>
              <strong>
                Keep your records accurate.
              </strong>

              <p>
                Updating a transaction changes
                the information used throughout
                your dashboard and reports.
              </p>
            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}