import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  Business: "💼",
  Other: "✨",
};

const currentMonth = () =>
  new Date().toISOString().slice(0, 7);

const getDefaultExpenseDate = (selectedMonth) => {
  const now = new Date();

  const nowMonth = now
    .toISOString()
    .slice(0, 7);

  if (selectedMonth === nowMonth) {
    return now.toISOString().slice(0, 10);
  }

  return `${selectedMonth}-01`;
};

const emptyBudgetForm = {
  name: "",
  category: "Food",
  amount: "",
  month: currentMonth(),
};

const emptyExpenseForm = {
  title: "",
  amount: "",
  category: "Food",
  description: "",
  date: new Date()
    .toISOString()
    .slice(0, 10),
};

export default function Budgets() {
  const [month, setMonth] =
    useState(currentMonth());

  const [data, setData] = useState({
    budgets: [],
    totals: {},
  });

  const [form, setForm] =
    useState(emptyBudgetForm);

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [expenseModalOpen, setExpenseModalOpen] =
    useState(false);

  const [selectedBudget, setSelectedBudget] =
    useState(null);

  const [expenseForm, setExpenseForm] =
    useState(emptyExpenseForm);

  const [expenseSaving, setExpenseSaving] =
    useState(false);

  const [isListening, setIsListening] =
    useState(false);

  const [voiceText, setVoiceText] =
    useState("");

  const [budgetVoiceListening, setBudgetVoiceListening] =
    useState(false);

  const [budgetVoiceText, setBudgetVoiceText] =
    useState("");

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const monthLabel = useMemo(() => {
    const [
      year,
      monthNumber,
    ] = month.split("-");

    return new Date(
      Number(year),
      Number(monthNumber) - 1,
      1
    ).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  const totals =
    data.totals || {};

  const budgetCount =
    data.budgets?.length || 0;

  const totalBudget =
    Number(totals.totalBudget) || 0;

  const totalSpent =
    Number(totals.totalSpent) || 0;

  const remaining =
    Number(totals.remaining) || 0;

  const usedPercentage =
    Number(totals.percentage) || 0;

  const overallStatus =
    remaining < 0
      ? "danger"
      : usedPercentage >= 80
        ? "warning"
        : "healthy";

  // =========================
  // LOAD BUDGETS
  // =========================

  const loadBudgets = async () => {
    setLoading(true);

    try {
      const response =
        await api.get(
          `/budgets?month=${month}`
        );

      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load budgets"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [month]);

  // =========================
  // BUDGET FORM
  // =========================

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]:
        event.target.value,
    }));
  };
  const handleBudgetVoiceInput = async () => {
    try {
      setError("");
      setBudgetVoiceText("");

      const permission =
        await SpeechRecognition.requestPermissions();

      if (permission.speechRecognition !== "granted") {
        setError(
          "Microphone permission is required for voice input."
        );
        return;
      }

      setBudgetVoiceListening(true);

      const result = await SpeechRecognition.start({
        language: "en-IN",
        maxResults: 1,
        prompt:
          "Say your budget, for example: create a food budget of 5000 rupees for September 2026",
        partialResults: false,
        popup: true,
      });

      const spokenText = result.matches?.[0] || "";

      setBudgetVoiceText(spokenText);

      if (spokenText) {
        const parsed = parseBudgetVoice(spokenText);

        setForm((prev) => ({
          ...prev,
          name: parsed.name,
          category: parsed.category,
          amount: parsed.amount,
          month: parsed.month,
        }));
      }
    } catch (error) {
      console.error("Budget voice input error:", error);

      setError(
        "Could not understand your budget. Please try again."
      );
    } finally {
      setBudgetVoiceListening(false);
    }
  };

  const resetForm = () => {
    setForm({
      ...emptyBudgetForm,
      month,
    });

    setEditingId(null);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    if (
      !form.name.trim() ||
      Number(form.amount) <= 0
    ) {
      setError(
        "Enter a budget name and an amount greater than zero."
      );

      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      if (editingId) {
        await api.put(
          `/budgets/${editingId}`,
          payload
        );
      } else {
        await api.post(
          "/budgets",
          payload
        );
      }

      resetForm();

      await loadBudgets();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to save budget"
      );
    } finally {
      setSaving(false);
    }
  };

  const editBudget = (budget) => {
    setEditingId(budget._id);

    setForm({
      name: budget.name,
      category: budget.category,
      amount: budget.amount,
      month: budget.month,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteBudget = async (id) => {
    if (
      !window.confirm(
        "Delete this budget?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/budgets/${id}`
      );

      await loadBudgets();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to delete budget"
      );
    }
  };

  // =========================
  // QUICK ADD EXPENSE
  // =========================

  const openExpenseModal = (
    budget
  ) => {
    setSelectedBudget(budget);

    setExpenseForm({
      title: `${budget.category} Expense`,
      amount: "",
      category: budget.category,
      description: "",
      date: getDefaultExpenseDate(
        budget.month
      ),
    });

    setError("");

    setExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    if (expenseSaving) {
      return;
    }

    setExpenseModalOpen(false);
    setSelectedBudget(null);

    setExpenseForm(
      emptyExpenseForm
    );
  };

  const handleExpenseChange = (
    event
  ) => {
    setExpenseForm((current) => ({
      ...current,
      [event.target.name]:
        event.target.value,
    }));
  };
  const parseBudgetVoiceExpense = (text) => {
    const lowerText = text.toLowerCase().trim();

    // Find amount
    const amountMatch = lowerText.match(
      /(?:₹|rs\.?|rupees?|inr)?\s*(\d+(?:\.\d+)?)/
    );

    const amount = amountMatch
      ? Number(amountMatch[1])
      : "";

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

    // Fallback if "for", "on", or "at" wasn't found
    if (!title) {
      title = lowerText
        .replace(
          /(?:₹|rs\.?|rupees?|inr)?\s*\d+(?:\.\d+)?/gi,
          ""
        )
        .replace(
          /\b(spent|spend|paid|pay|bought|buy|for|on|at)\b/gi,
          ""
        )
        .trim();
    }

    // Clean title
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
      title: title || "Budget Expense",
      amount,
      category,
    };
  };


  const parseBudgetVoice = (text) => {
    const lowerText = text.toLowerCase().trim();

    // Extract amount
    const amountMatch = lowerText.match(
      /(?:₹|rs\.?|rupees?|inr)?\s*(\d+(?:\.\d+)?)/
    );

    const amount = amountMatch
      ? Number(amountMatch[1])
      : "";

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
      /\b(business|client)\b/i.test(lowerText)
    ) {
      category = "Business";
    }

    // Detect month
    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];

    let month = form.month;

    const monthMatch = lowerText.match(
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/i
    );

    if (monthMatch) {
      const monthIndex =
        monthNames.indexOf(monthMatch[1].toLowerCase()) + 1;

      month = `${monthMatch[2]}-${String(monthIndex).padStart(2, "0")}`;
    }

    // Detect budget name
    let name = "";

    const nameMatch = lowerText.match(
      /\b(?:create|make|set)\s+(?:a\s+)?(.+?)\s+budget\b/i
    );

    if (nameMatch) {
      name = nameMatch[1]
        .replace(/\b(food|shopping|transport|bills|entertainment|health|education|travel|business)\b/gi, "")
        .trim();
    }

    if (!name) {
      name = `${category} Budget`;
    } else {
      name =
        name.charAt(0).toUpperCase() +
        name.slice(1) +
        " Budget";
    }

    return {
      name,
      category,
      amount,
      month,
    };
  };


  const handleCreateBudgetVoiceInput = async () => {
    try {
      setError("");

      const permission =
        await SpeechRecognition.requestPermissions();

      if (
        permission.speechRecognition !==
        "granted"
      ) {
        setError(
          "Microphone permission is required for voice input."
        );
        return;
      }

      setIsListening(true);

      const result =
        await SpeechRecognition.start({
          language: "en-IN",
          maxResults: 1,
          prompt:
            "Say your budget expense, for example: Paid 120 rupees for Uber",
          partialResults: false,
          popup: true,
        });

      const spokenText =
        result.matches?.[0] || "";

      setVoiceText(spokenText);

      if (spokenText) {
        const parsed =
          parseBudgetVoiceExpense(
            spokenText
          );

        setExpenseForm((current) => ({
          ...current,
          title: parsed.title,
          amount: parsed.amount,
          category: parsed.category,
          description: spokenText,
        }));
      }
    } catch (error) {
      console.error(
        "Budget voice input error:",
        error
      );

      setError(
        "Could not understand your voice. Please try again."
      );
    } finally {
      setIsListening(false);
    }
  };

  const submitQuickExpense = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedBudget) {
      return;
    }

    const amount =
      Number(expenseForm.amount);

    if (!expenseForm.title.trim()) {
      setError(
        "Please enter an expense title."
      );

      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Expense amount must be greater than zero."
      );

      return;
    }

    if (!expenseForm.date) {
      setError(
        "Please select an expense date."
      );

      return;
    }

    setExpenseSaving(true);
    setError("");

    try {
      await api.post(
        `/budget-expenses/${selectedBudget._id}`,
        {
          title:
            expenseForm.title.trim(),

          amount,

          description:
            expenseForm.description.trim(),

          date: expenseForm.date,
        }
      );

      closeExpenseModal();

      await loadBudgets();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to add expense"
      );
    } finally {
      setExpenseSaving(false);
    }
  };

  return (
    <div className="page budgets-page">

      {/* =========================
          PREMIUM HEADER
      ========================= */}

      <section className="budget-hero">
        <div className="budget-hero-content">
          <div className="budget-eyebrow">
            <span className="budget-eyebrow-dot" />
            Financial Planning
          </div>

          <h1>
            Your budgets,
            <span> under control.</span>
          </h1>

          <p>
            Plan your spending, track every
            category and stay ahead of your
            monthly limits.
          </p>

          <div className="budget-hero-meta">
            <div className="budget-month-pill">
              <span>◷</span>
              {monthLabel}
            </div>

            <div className="budget-count-pill">
              {budgetCount}{" "}
              {budgetCount === 1
                ? "budget"
                : "budgets"}
            </div>
          </div>
        </div>

        <div className="budget-hero-control">
          <label>
            Viewing month
          </label>

          <div className="month-picker-wrap">
            <span>📅</span>

            <input
              className="month-picker"
              type="month"
              value={month}
              onChange={(event) =>
                setMonth(
                  event.target.value
                )
              }
            />
          </div>
        </div>
      </section>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="error budget-error">
          <span>⚠️</span>
          <div>
            {error}
          </div>
        </div>
      )}

      {/* =========================
          FINANCIAL OVERVIEW
      ========================= */}

      <section className="budget-overview">

        <div className="budget-overview-card budget-card-blue">
          <div className="budget-overview-top">
            <div className="budget-overview-icon">
              ₹
            </div>

            <span className="budget-card-label">
              Total Budget
            </span>
          </div>

          <strong>
            {money(totalBudget)}
          </strong>

          <div className="budget-overview-footer">
            <span>
              Planned spending limit
            </span>
          </div>
        </div>

        <div className="budget-overview-card budget-card-purple">
          <div className="budget-overview-top">
            <div className="budget-overview-icon">
              ↗
            </div>

            <span className="budget-card-label">
              Total Spent
            </span>
          </div>

          <strong>
            {money(totalSpent)}
          </strong>

          <div className="budget-overview-footer">
            <span>
              Across {budgetCount} categories
            </span>
          </div>
        </div>

        <div
          className={`budget-overview-card ${remaining < 0
            ? "budget-card-red"
            : "budget-card-green"
            }`}
        >
          <div className="budget-overview-top">
            <div className="budget-overview-icon">
              {remaining < 0 ? "!" : "✓"}
            </div>

            <span className="budget-card-label">
              Remaining
            </span>
          </div>

          <strong>
            {money(remaining)}
          </strong>

          <div className="budget-overview-footer">
            <span>
              {remaining < 0
                ? "Over your total limit"
                : "Available to spend"}
            </span>
          </div>
        </div>

        <div className="budget-overview-card budget-card-orange">
          <div className="budget-overview-top">
            <div className="budget-overview-icon">
              %
            </div>

            <span className="budget-card-label">
              Budget Used
            </span>
          </div>

          <strong>
            {usedPercentage}%
          </strong>

          <div className="mini-progress">
            <span
              style={{
                width: `${Math.min(
                  usedPercentage,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* =========================
          STATUS STRIP
      ========================= */}

      <section
        className={`budget-status-strip ${overallStatus}`}
      >
        <div className="budget-status-icon">
          {overallStatus === "danger"
            ? "!"
            : overallStatus === "warning"
              ? "!"
              : "✓"}
        </div>

        <div className="budget-status-copy">
          <strong>
            {overallStatus === "danger"
              ? "You've exceeded your overall budget"
              : overallStatus === "warning"
                ? "You're getting close to your spending limit"
                : "You're on track this month"}
          </strong>

          <span>
            {overallStatus === "danger"
              ? "Review your categories and reduce spending where possible."
              : overallStatus === "warning"
                ? "Keep an eye on your remaining budget for the rest of the month."
                : "Your spending is currently within the planned limits."}
          </span>
        </div>

        <div className="budget-status-percentage">
          {usedPercentage}%
        </div>
      </section>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div className="budget-workspace">

        {/* =========================
            CREATE / EDIT
        ========================= */}

        <div
          className={`budget-builder ${editingId
            ? "budget-builder-editing"
            : ""
            }`}
        >
          <div className="budget-builder-glow" />

          <div className="budget-builder-header">
            <div>
              <span className="builder-kicker">
                {editingId
                  ? "UPDATE PLAN"
                  : "NEW PLAN"}
              </span>

              <h2>
                {editingId
                  ? "Edit your budget"
                  : "Create a budget"}
              </h2>

              <p>
                Set a spending limit and
                give your money a clear
                direction.
              </p>
            </div>

            <div className="builder-icon">
              {editingId ? "✎" : "+"}
            </div>
          </div>

          <form onSubmit={submit}>
            <div className="budget-create-voice-box">
              <button
                type="button"
                className={`budget-create-voice-button ${budgetVoiceListening ? "listening" : ""
                  }`}
                onClick={handleBudgetVoiceInput}
                disabled={budgetVoiceListening || saving}
              >
                <span className="budget-create-voice-icon">
                  {budgetVoiceListening ? "🔴" : "🎤"}
                </span>

                <span>
                  <strong>
                    {budgetVoiceListening
                      ? "Listening..."
                      : "Create budget with your voice"}
                  </strong>

                  <small>
                    {budgetVoiceListening
                      ? "Say your budget details"
                      : 'Try: "Create a food budget of 5000 rupees for September 2026"'}
                  </small>
                </span>
              </button>

              {budgetVoiceText && (
                <div className="budget-create-voice-result">
                  <span>Heard:</span> {budgetVoiceText}
                </div>
              )}
            </div>
            
            <div className="premium-form-grid">

              <div className="premium-field premium-field-wide">
                <label>
                  Budget name
                </label>

                <div className="premium-input-wrap">
                  <span>✦</span>

                  <input
                    name="name"
                    value={form.name}
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Monthly Food Budget"
                    maxLength="80"
                    required
                  />
                </div>
              </div>

              <div className="premium-field">
                <label>
                  Spending limit
                </label>

                <div className="premium-input-wrap amount-input">
                  <span>₹</span>

                  <input
                    name="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.amount}
                    onChange={
                      handleChange
                    }
                    placeholder="10,000"
                    required
                  />
                </div>
              </div>

              <div className="premium-field">
                <label>
                  Category
                </label>

                <div className="premium-input-wrap select-wrap">
                  <span>
                    {categoryIcons[
                      form.category
                    ] || "✨"}
                  </span>

                  <select
                    name="category"
                    value={
                      form.category
                    }
                    onChange={
                      handleChange
                    }
                  >
                    {categories.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="premium-field">
                <label>
                  Budget month
                </label>

                <div className="premium-input-wrap">
                  <span>📅</span>

                  <input
                    name="month"
                    type="month"
                    value={form.month}
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="budget-builder-actions">
              {editingId && (
                <button
                  type="button"
                  className="budget-secondary-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="budget-primary-btn"
                disabled={saving}
              >
                <span>
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Budget"
                      : "Create Budget"}
                </span>

                {!saving && (
                  <span className="button-arrow">
                    →
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* =========================
            BUDGET LIST
        ========================= */}

        <div className="budget-list-panel">

          <div className="budget-list-heading">
            <div>
              <span className="builder-kicker">
                YOUR PLAN
              </span>

              <h2>
                {monthLabel} budgets
              </h2>
            </div>

            <div className="budget-list-count">
              {budgetCount}
            </div>
          </div>

          {loading ? (
            <div className="budget-loading-grid">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    className="budget-skeleton"
                    key={item}
                  >
                    <div className="skeleton-circle" />
                    <div className="skeleton-lines">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : data.budgets
            .length === 0 ? (
            <div className="premium-empty-state">
              <div className="empty-orbit">
                <div>
                  🎯
                </div>
              </div>

              <h3>
                Nothing planned yet
              </h3>

              <p>
                Create your first budget
                and start giving every
                rupee a purpose.
              </p>

              <button
                type="button"
                className="budget-empty-cta"
                onClick={() =>
                  document
                    .querySelector(
                      ".budget-builder"
                    )
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    })
                }
              >
                Create your first budget
                <span>→</span>
              </button>
            </div>
          ) : (
            <div className="premium-budget-list">
              {data.budgets.map(
                (budget) => {
                  const percentage =
                    Number(
                      budget.percentage
                    ) || 0;

                  const safePercentage =
                    Math.min(
                      Math.max(
                        percentage,
                        0
                      ),
                      100
                    );

                  const isExceeded =
                    Number(
                      budget.remaining
                    ) < 0;

                  const icon =
                    categoryIcons[
                    budget.category
                    ] || "✨";

                  return (
                    <article
                      className={`premium-budget-card ${budget.status || ""
                        } ${isExceeded
                          ? "budget-over-limit"
                          : ""
                        }`}
                      key={budget._id}
                    >

                      <div className="premium-budget-top">

                        <div className="premium-budget-identity">
                          <div className="premium-category-icon">
                            {icon}
                          </div>

                          <div>
                            <span>
                              {
                                budget.category
                              }
                            </span>

                            <h3>
                              {
                                budget.name
                              }
                            </h3>
                          </div>
                        </div>

                        <div className="premium-budget-amount">
                          <strong>
                            {money(
                              budget.spent
                            )}
                          </strong>

                          <span>
                            of{" "}
                            {money(
                              budget.amount
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="premium-progress-area">
                        <div className="premium-progress-labels">
                          <span>
                            {percentage}% used
                          </span>

                          <span
                            className={
                              isExceeded
                                ? "expense-text"
                                : ""
                            }
                          >
                            {isExceeded
                              ? `${money(
                                Math.abs(
                                  budget.remaining
                                )
                              )} over`
                              : `${money(
                                budget.remaining
                              )} left`}
                          </span>
                        </div>

                        <div className="premium-progress-track">
                          <div
                            className={`premium-progress-fill budget-${budget.status}`}
                            style={{
                              width: `${safePercentage}%`,
                            }}
                          >
                            <span />
                          </div>
                        </div>
                      </div>

                      <div className="premium-budget-bottom">

                        <div className="budget-status-badge">
                          <span
                            className={
                              isExceeded
                                ? "status-dot danger"
                                : percentage >= 80
                                  ? "status-dot warning"
                                  : "status-dot healthy"
                            }
                          />

                          {isExceeded
                            ? "Over budget"
                            : percentage >=
                              80
                              ? "Near limit"
                              : "On track"}
                        </div>

                        <div className="premium-budget-actions">

                          <button
                            className="premium-add-expense"
                            onClick={() =>
                              openExpenseModal(
                                budget
                              )
                            }
                          >
                            <span>+</span>
                            Add expense
                          </button>

                          <button
                            className="premium-icon-btn"
                            onClick={() =>
                              editBudget(
                                budget
                              )
                            }
                            title="Edit budget"
                          >
                            ✎
                          </button>

                          <button
                            className="premium-icon-btn danger"
                            onClick={() =>
                              deleteBudget(
                                budget._id
                              )
                            }
                            title="Delete budget"
                          >
                            🗑
                          </button>

                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================
          QUICK EXPENSE MODAL
      ========================= */}

      {expenseModalOpen &&
        selectedBudget && (
          <div
            className="premium-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeExpenseModal();
              }
            }}
          >
            <div className="premium-expense-modal">

              <div className="modal-top-glow" />

              <div className="premium-modal-header">
                <div className="modal-budget-icon">
                  {
                    categoryIcons[
                    selectedBudget.category
                    ] || "✨"
                  }
                </div>

                <button
                  type="button"
                  className="premium-modal-close"
                  onClick={
                    closeExpenseModal
                  }
                  disabled={
                    expenseSaving
                  }
                >
                  ×
                </button>
              </div>

              <div className="premium-modal-title">
                <span>
                  {
                    selectedBudget.category
                  }{" "}
                  budget
                </span>

                <h2>
                  Add an expense
                </h2>

                <p>
                  Record spending against
                  this budget without
                  changing your main
                  transaction history.
                </p>
              </div>

              <div className="modal-budget-preview">
                <div>
                  <span>
                    Budget
                  </span>

                  <strong>
                    {
                      selectedBudget.name
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Remaining
                  </span>

                  <strong
                    className={
                      selectedBudget.remaining <
                        0
                        ? "expense-text"
                        : ""
                    }
                  >
                    {money(
                      selectedBudget.remaining
                    )}
                  </strong>
                </div>
              </div>

              <form
                onSubmit={
                  submitQuickExpense
                }
              >
                <div className="premium-modal-fields">

                  <div className="premium-field">
                    <label>
                      Expense title
                    </label>

                    <div className="premium-input-wrap">
                      <span>✦</span>

                      <input
                        name="title"
                        value={
                          expenseForm.title
                        }
                        onChange={
                          handleExpenseChange
                        }
                        placeholder="e.g. Lunch"
                        required
                      />
                    </div>
                  </div>
                  <div className="budget-voice-expense-box">
                    <button
                      type="button"
                      className={`budget-voice-expense-button ${isListening ? "listening" : ""
                        }`}
                      onClick={handleCreateBudgetVoiceInput}
                      disabled={isListening || expenseSaving}
                    >
                      <span className="budget-voice-icon">
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
                            ? "Say your budget expense"
                            : 'Try: "Paid ₹120 for Uber"'}
                        </small>
                      </span>
                    </button>

                    {voiceText && (
                      <div className="budget-voice-result">
                        <span>Heard:</span> {voiceText}
                      </div>
                    )}
                  </div>

                  <div className="premium-field">
                    <label>
                      Amount
                    </label>

                    <div className="premium-input-wrap amount-input">
                      <span>₹</span>

                      <input
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={
                          expenseForm.amount
                        }
                        onChange={
                          handleExpenseChange
                        }
                        placeholder="500"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <div className="premium-field">
                    <label>
                      Date
                    </label>

                    <div className="premium-input-wrap">
                      <span>📅</span>

                      <input
                        name="date"
                        type="date"
                        value={
                          expenseForm.date
                        }
                        onChange={
                          handleExpenseChange
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="premium-field">
                    <label>
                      Description
                    </label>

                    <div className="premium-textarea-wrap">
                      <textarea
                        name="description"
                        value={
                          expenseForm.description
                        }
                        onChange={
                          handleExpenseChange
                        }
                        placeholder="Add an optional note..."
                        rows="3"
                      />
                    </div>
                  </div>

                </div>

                <div className="premium-modal-actions">

                  <button
                    type="button"
                    className="budget-secondary-btn"
                    onClick={
                      closeExpenseModal
                    }
                    disabled={
                      expenseSaving
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="budget-primary-btn"
                    disabled={
                      expenseSaving
                    }
                  >
                    <span>
                      {expenseSaving
                        ? "Adding..."
                        : "Add Expense"}
                    </span>

                    {!expenseSaving && (
                      <span className="button-arrow">
                        →
                      </span>
                    )}
                  </button>

                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}