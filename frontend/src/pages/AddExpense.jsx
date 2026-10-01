import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

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

export default function AddExpense() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    type: "Expense",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");

  const parseVoiceExpense = (text) => {
  const lowerText = text.toLowerCase().trim();

  // Find amount
  const amountMatch = lowerText.match(
    /(?:₹|rs\.?|rupees?|inr)?\s*(\d+(?:\.\d+)?)/
  );

  const amount = amountMatch
    ? Number(amountMatch[1])
    : "";

  // Detect income
  const isIncome =
    /\b(received|earned|got paid|salary|income|credited)\b/i.test(
      lowerText
    );

  // Detect category
  let category = "Other";

  if (
    /\b(food|groceries|grocery|restaurant|lunch|dinner|breakfast)\b/i.test(
      lowerText
    )
  ) {
    category = "Food";
  } else if (
    /\b(shopping|clothes|clothing|dress|amazon|flipkart)\b/i.test(
      lowerText
    )
  ) {
    category = "Shopping";
  } else if (
    /\b(uber|ola|taxi|cab|bus|train|metro|petrol|fuel|transport)\b/i.test(
      lowerText
    )
  ) {
    category = "Transport";
  } else if (
    /\b(bill|electricity|water|rent|recharge|internet|wifi)\b/i.test(
      lowerText
    )
  ) {
    category = "Bills";
  } else if (
    /\b(movie|movies|netflix|game|games|entertainment)\b/i.test(
      lowerText
    )
  ) {
    category = "Entertainment";
  } else if (
    /\b(hospital|doctor|medicine|medical|health)\b/i.test(
      lowerText
    )
  ) {
    category = "Health";
  } else if (
    /\b(course|courses|school|college|education|books)\b/i.test(
      lowerText
    )
  ) {
    category = "Education";
  } else if (
    /\b(travel|hotel|flight|trip|vacation)\b/i.test(
      lowerText
    )
  ) {
    category = "Travel";
  } else if (
    /\b(salary|income|paycheck|earned)\b/i.test(
      lowerText
    )
  ) {
    category = "Salary";
  } else if (
    /\b(business|client)\b/i.test(lowerText)
  ) {
    category = "Business";
  }

  // Extract transaction name
  let title = "";

  const nameMatch = lowerText.match(
    /\b(?:for|on|at)\s+(.+?)(?:\s+(?:today|yesterday|tomorrow))?$/i
  );

  if (nameMatch) {
    title = nameMatch[1].trim();
  }

  // If no "for/on/at" was found, try removing common voice words
  if (!title) {
    title = lowerText
      .replace(
        /(?:₹|rs\.?|rupees?|inr)?\s*\d+(?:\.\d+)?/gi,
        ""
      )
      .replace(
        /\b(spent|spend|paid|pay|bought|buy|received|earned|for|on|at)\b/gi,
        ""
      )
      .trim();
  }

  // Clean transaction name
  title = title
    .replace(/[.,!?]/g, "")
    .trim();

  // Capitalize first letter
  if (title) {
    title =
      title.charAt(0).toUpperCase() +
      title.slice(1);
  }

  return {
    amount,
    category,
    type: isIncome ? "Income" : "Expense",
    title: title || "Voice Transaction",
  };
};

  const handleVoiceInput = async () => {
    try {
      setError("");

      const permission =
        await SpeechRecognition.requestPermissions();

      if (permission.speechRecognition !== "granted") {
        setError(
          "Microphone permission is required for voice input."
        );
        return;
      }

      setIsListening(true);

      const result = await SpeechRecognition.start({
        language: "en-IN",
        maxResults: 1,
        prompt: "Say your expense, for example: spent 450 rupees on groceries",
        partialResults: false,
        popup: true,
      });

      const spokenText = result.matches?.[0] || "";

      setVoiceText(spokenText);

      if (spokenText) {
        const parsed = parseVoiceExpense(spokenText);

        setForm((prev) => ({
          ...prev,
          title: parsed.title,
          amount: parsed.amount,
          category: parsed.category,
          type: parsed.type,
          description: spokenText,
        }));
      }
    } catch (error) {
      console.error("Voice input error:", error);

      setError(
        "Could not understand your voice. Please try again."
      );
    } finally {
      setIsListening(false);
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
      setError("Amount must be greater than zero.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/expenses", {
        ...form,
        amount: Number(form.amount),
      });

      navigate("/expenses");
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Failed to create transaction"
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

  return (
    <div className="page add-transaction-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="add-transaction-hero">

        <div className="add-transaction-hero-glow">
          <span />
          <span />
          <span />
        </div>

        <div className="add-transaction-hero-content">

          <div className="add-transaction-kicker">
            <span />
            NEW TRANSACTION
          </div>

          <h1>
            Give every rupee
            <span>a purpose.</span>
          </h1>

          <p>
            Add an income or expense and keep
            your financial story up to date.
          </p>

        </div>

        <div className="add-transaction-hero-mark">
          <div className="hero-mark-ring">
            ₹
          </div>
        </div>

      </section>

      {/* =====================================================
          FORM LAYOUT
      ===================================================== */}

      <div className="add-transaction-layout">

        {/* ===================================================
            FORM
        =================================================== */}

        <section className="add-transaction-form-card">

          <div className="add-transaction-form-header">

            <div>
              <span>TRANSACTION DETAILS</span>
              <h2>What happened?</h2>
              <p>
                Enter the details below to record
                this transaction.
              </p>
            </div>

            <div className="add-form-step">
              <strong>01</strong>
              <span>/ 01</span>
            </div>

          </div>

          {error && (
            <div className="add-transaction-error">
              <div className="add-error-icon">
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

            {/* ===============================================
                TYPE
            =============================================== */}

            <div className="add-form-section">

              <div className="add-form-section-title">
                <span>01</span>
                <div>
                  <strong>Transaction type</strong>
                  <small>
                    Is money coming in or going out?
                  </small>
                </div>
              </div>

              <div className="transaction-type-selector">

                <button
                  type="button"
                  className={`transaction-type-option ${form.type === "Expense"
                    ? "active expense-option"
                    : ""
                    }`}
                  onClick={() =>
                    setForm({
                      ...form,
                      type: "Expense",
                    })
                  }
                >
                  <span className="type-option-icon">
                    ↘
                  </span>

                  <span className="type-option-copy">
                    <strong>Expense</strong>
                    <small>
                      Money spent
                    </small>
                  </span>

                  <span className="type-option-check">
                    {form.type === "Expense"
                      ? "✓"
                      : ""}
                  </span>
                </button>

                <button
                  type="button"
                  className={`transaction-type-option ${form.type === "Income"
                    ? "active income-option"
                    : ""
                    }`}
                  onClick={() =>
                    setForm({
                      ...form,
                      type: "Income",
                    })
                  }
                >
                  <span className="type-option-icon">
                    ↗
                  </span>

                  <span className="type-option-copy">
                    <strong>Income</strong>
                    <small>
                      Money received
                    </small>
                  </span>

                  <span className="type-option-check">
                    {form.type === "Income"
                      ? "✓"
                      : ""}
                  </span>
                </button>

              </div>

            </div>

            {/* ===============================================
                BASIC DETAILS
            =============================================== */}

            <div className="add-form-section">

              <div className="add-form-section-title">
                <span>02</span>

                <div>
                  <strong>Basic details</strong>
                  <small>
                    Give your transaction a name and value.
                  </small>
                </div>
              </div>
              <div className="voice-expense-box">
                <button
                  type="button"
                  className={`voice-expense-button ${isListening ? "listening" : ""
                    }`}
                  onClick={handleVoiceInput}
                  disabled={isListening || saving}
                >
                  <span className="voice-expense-icon">
                    {isListening ? "🔴" : "🎤"}
                  </span>

                  <span>
                    <strong>
                      {isListening
                        ? "Listening..."
                        : "Add with your voice"}
                    </strong>

                    <small>
                      {isListening
                        ? "Say what you spent"
                        : 'Try: "Spent ₹450 on groceries"'}
                    </small>
                  </span>
                </button>

                {voiceText && (
                  <div className="voice-expense-result">
                    <span>Heard:</span> {voiceText}
                  </div>
                )}
              </div>
              <div className="add-form-grid">

                <div className="add-form-group add-form-full">

                  <label htmlFor="title">
                    Transaction name
                  </label>

                  <div className="add-input-wrap">
                    <span>✦</span>

                    <input
                      id="title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. Groceries, Freelance payment..."
                      required
                    />
                  </div>

                </div>

                <div className="add-form-group">

                  <label htmlFor="amount">
                    Amount
                  </label>

                  <div className="add-input-wrap amount-input-wrap">
                    <span>₹</span>

                    <input
                      id="amount"
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

                <div className="add-form-group">

                  <label htmlFor="date">
                    Date
                  </label>

                  <div className="add-input-wrap">
                    <span>📅</span>

                    <input
                      id="date"
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

            {/* ===============================================
                CATEGORY
            =============================================== */}

            <div className="add-form-section">

              <div className="add-form-section-title">
                <span>03</span>

                <div>
                  <strong>Category</strong>
                  <small>
                    Where does this transaction belong?
                  </small>
                </div>
              </div>

              <div className="category-picker">

                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={`category-picker-option ${form.category === category
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
                    <span className="category-picker-icon">
                      {categoryIcons[category]}
                    </span>

                    <span>
                      {category}
                    </span>
                  </button>
                ))}

              </div>

            </div>

            {/* ===============================================
                DESCRIPTION
            =============================================== */}

            <div className="add-form-section">

              <div className="add-form-section-title">
                <span>04</span>

                <div>
                  <strong>Additional note</strong>
                  <small>
                    Optional — add some context.
                  </small>
                </div>
              </div>

              <div className="add-form-group">

                <div className="add-textarea-wrap">

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Add a note about this transaction..."
                    rows="4"
                  />

                  <span className="textarea-counter">
                    {form.description.length}/500
                  </span>

                </div>

              </div>

            </div>

            {/* ===============================================
                ACTIONS
            =============================================== */}

            <div className="add-form-actions">

              <button
                type="button"
                className="add-cancel-button"
                onClick={() =>
                  navigate("/expenses")
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={`add-save-button ${form.type === "Income"
                  ? "save-income"
                  : ""
                  }`}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="save-spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <span>
                      {form.type === "Income"
                        ? "Add Income"
                        : "Save Expense"}
                    </span>

                    <span className="save-arrow">
                      →
                    </span>
                  </>
                )}
              </button>

            </div>

          </form>

        </section>

        {/* ===================================================
            LIVE PREVIEW
        =================================================== */}

        <aside className="add-transaction-preview">

          <div className="preview-card">

            <div className="preview-card-top">
              <span>LIVE PREVIEW</span>

              <div className="preview-live">
                <span />
                LIVE
              </div>
            </div>

            <div
              className={`preview-amount ${form.type === "Income"
                ? "preview-income"
                : "preview-expense"
                }`}
            >
              {form.type === "Income"
                ? "+"
                : "-"}
              {moneyPreview}
            </div>

            <div className="preview-type">
              {form.type === "Income"
                ? "Money received"
                : "Money spent"}
            </div>

            <div className="preview-divider" />

            <div className="preview-details">

              <div className="preview-detail">
                <span>NAME</span>
                <strong>
                  {form.title ||
                    "Your transaction"}
                </strong>
              </div>

              <div className="preview-detail">
                <span>CATEGORY</span>

                <strong>
                  <i>
                    {categoryIcons[
                      form.category
                    ]}
                  </i>

                  {form.category}
                </strong>
              </div>

              <div className="preview-detail">
                <span>DATE</span>

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

          <div className="add-tip-card">

            <div className="tip-icon">
              ✦
            </div>

            <div>
              <strong>
                A small habit,
                <span> big difference.</span>
              </strong>

              <p>
                Recording transactions regularly
                makes your reports more useful
                and helps you understand your
                spending patterns.
              </p>
            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}