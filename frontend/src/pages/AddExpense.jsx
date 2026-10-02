import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { Script, TextRecognition, } from "@capacitor-mlkit/text-recognition";
import { Camera, CameraResultType, CameraSource, } from "@capacitor/camera";

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

  const handleReceiptScan = async () => {
    try {
      setError("");

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!photo.path) {
        setError("Could not capture the receipt image.");
        return;
      }

      console.log("Receipt image:", photo.path);

      console.log("OCR PATH:", photo.path);

      const result = await TextRecognition.processImage({
        path: photo.path,
        script: Script.Latin,
      });

      console.log("OCR RESULT:", result);
      const recognizedText = result.text || "";

      console.log("OCR RESULT:", recognizedText);

      if (!recognizedText.trim()) {
        setError(
          "No text was detected. Please take a clearer photo of the receipt."
        );
        return;
      }

      const parsed = parseReceiptText(recognizedText);

      console.log("PARSED RECEIPT:", parsed);

      setForm((prev) => ({
        ...prev,
        title: parsed.title || prev.title,
        amount: parsed.amount || prev.amount,
        category: parsed.category || prev.category,
        date: parsed.date || prev.date,
        type:
          prev.type === "Expense" || prev.type === "Income"
            ? "Expense"
            : "expense",
        description: parsed.description,
      }));
    } catch (error) {
      console.error("========== RECEIPT SCAN ERROR ==========");
      console.error("Error:", error);
      console.error("Message:", error?.message);
      console.error("Code:", error?.code);
      console.error("Stack:", error?.stack);
      console.error("========================================");

      setError(
        `Receipt scan failed: ${error?.message || "Unknown error"}`
      );
    }
  };

  const parseReceiptText = (text) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    // -----------------------------
    // AMOUNT
    // -----------------------------
    let amount = "";

    const cleanAmount = (value) => {
      if (!value) return "";

      return value
        .replace(/₹/g, "")
        .replace(/,/g, "")
        .replace(/\s/g, "")
        .trim();
    };

    // Convert OCR text into lines
    const receiptLines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    // -----------------------------------------
    // 1. Find FINAL TOTAL / GRAND TOTAL / NET
    // -----------------------------------------
    const finalTotalKeywords = [
      "grand total",
      "net amount",
      "amount payable",
      "total amount",
      "final total",
      "total",
    ];

    for (let i = receiptLines.length - 1; i >= 0; i--) {
      const line = receiptLines[i].toLowerCase();

      const isFinalTotalLine = finalTotalKeywords.some((keyword) =>
        line.includes(keyword)
      );

      if (!isFinalTotalLine) continue;

      // Amount on the same line
      const sameLineMatch = receiptLines[i].match(
        /₹?\s*([\d,]+(?:\.\d{1,2})?)/
      );

      if (sameLineMatch) {
        amount = cleanAmount(sameLineMatch[1]);
        break;
      }

      // Amount may be on the NEXT line
      if (receiptLines[i + 1]) {
        const nextLineMatch = receiptLines[i + 1].match(
          /^₹?\s*([\d,]+(?:\.\d{1,2})?)\s*$/
        );

        if (nextLineMatch) {
          amount = cleanAmount(nextLineMatch[1]);
          break;
        }
      }
    }

    // -----------------------------------------
    // 2. Look for "Total: ₹" followed by amount
    // -----------------------------------------
    if (!amount) {
      const totalMatch = text.match(
        /(?:total|grand\s*total|final\s*total)\s*[:\-]?\s*₹?\s*(?:\n|\r\n|\s)*([\d,]+(?:\.\d{1,2})?)/i
      );

      if (totalMatch) {
        amount = cleanAmount(totalMatch[1]);
      }
    }

    // -----------------------------------------
    // 3. Final fallback:
    //    use the LAST decimal number
    // -----------------------------------------
    if (!amount) {
      const decimalAmounts = text.match(
        /\b\d+\.\d{2}\b/g
      );

      if (decimalAmounts?.length) {
        amount = cleanAmount(
          decimalAmounts[decimalAmounts.length - 1]
        );
      }
    }

    // -----------------------------
    // DATE
    // -----------------------------
    let date = "";

    const dateMatch = text.match(
      /(?:date\s*[:\-]?\s*)?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i
    );

    if (dateMatch) {
      let [, day, month, year] = dateMatch;

      if (year.length === 2) {
        year = `20${year}`;
      }

      date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // -----------------------------
    // CATEGORY
    // -----------------------------
    let category = "Other";

    const foodKeywords = [
      "food",
      "restaurant",
      "dhaba",
      "hotel",
      "tandoori",
      "roti",
      "paneer",
      "rice",
      "dal",
      "chicken",
      "biryani",
      "snacks",
      "soft drinks",
      "soda",
      "mineral water",
    ];

    const transportKeywords = [
      "uber",
      "ola",
      "taxi",
      "cab",
      "fuel",
      "petrol",
      "diesel",
      "parking",
    ];

    const shoppingKeywords = [
      "shopping",
      "mart",
      "supermarket",
      "store",
      "clothing",
      "shirt",
      "shoes",
    ];

    const lowerText = text.toLowerCase();

    if (foodKeywords.some((keyword) => lowerText.includes(keyword))) {
      category = "Food";
    } else if (
      transportKeywords.some((keyword) => lowerText.includes(keyword))
    ) {
      category = "Transport";
    } else if (
      shoppingKeywords.some((keyword) => lowerText.includes(keyword))
    ) {
      category = "Shopping";
    }

    // -----------------------------
    // TRANSACTION NAME / MERCHANT
    // -----------------------------
    let title = "";

    const ignoredMerchantPatterns = [
      /tax\s*invoice/i,
      /invoice/i,
      /bill\s*(no|number)?/i,
      /receipt/i,
      /date/i,
      /time/i,
      /^ph[\s.:]/i,
      /^phone/i,
      /^mob/i,
      /^mobile/i,
      /^mcb/i,
      /gst/i,
      /gstin/i,
      /pan\s*no/i,
      /fssai/i,
      /address/i,
      /particulars/i,
      /description/i,
      /qty/i,
      /quantity/i,
      /rate/i,
      /amount/i,
      /subtotal/i,
      /sub\s*total/i,
      /food\s*total/i,
      /grand\s*total/i,
      /net\s*amount/i,
      /total/i,
      /cgst/i,
      /sgst/i,
      /discount/i,
      /cash/i,
      /change/i,
      /thank\s*you/i,
      /www\./i,
      /\.com/i,
      /\.in/i,
    ];

    const looksLikeAddress = (line) => {
      return (
        /\b\d{5,6}\b/.test(line) ||
        /\broad\b/i.test(line) ||
        /\blane\b/i.test(line) ||
        /\bstreet\b/i.test(line) ||
        /\bsector\b/i.test(line) ||
        /\bcolony\b/i.test(line) ||
        /\bmarket\b/i.test(line) ||
        /\bnear\b/i.test(line) ||
        /\bopp\b/i.test(line) ||
        /\bopposite\b/i.test(line) ||
        /\bplot\b/i.test(line) ||
        /\bshop\s*no/i.test(line) ||
        /\bpin\b/i.test(line)
      );
    };

    const looksLikePhone = (line) => {
      const digits = line.replace(/\D/g, "");
      return digits.length >= 10;
    };

    const looksLikeDate = (line) => {
      return /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(line);
    };

    const looksLikeMoney = (line) => {
      return (
        /₹\s*[\d,.]+/.test(line) ||
        /\b\d+(?:,\d{3})*(?:\.\d{2})\b/.test(line)
      );
    };

    // Score the first few receipt lines.
    // Merchant names usually appear before address/contact information.
    const merchantCandidates = lines
      .slice(0, 12)
      .map((line, index) => {
        let score = 100 - index * 5;

        if (line.length < 3) score -= 50;
        if (line.length > 45) score -= 25;

        if (ignoredMerchantPatterns.some((pattern) => pattern.test(line))) {
          score -= 100;
        }

        if (looksLikeAddress(line)) {
          score -= 60;
        }

        if (looksLikePhone(line)) {
          score -= 80;
        }

        if (looksLikeDate(line)) {
          score -= 80;
        }

        if (looksLikeMoney(line)) {
          score -= 80;
        }

        // Restaurant/business keywords make a line more likely to be the merchant.
        if (
          /\b(restaurant|hotel|dhaba|cafe|café|bakery|bistro|foods|food|dining|sweet|sweets|mart|store|shop|kitchen)\b/i.test(
            line
          )
        ) {
          score += 25;
        }

        return {
          line,
          score,
        };
      })
      .filter((candidate) => candidate.score > 20)
      .sort((a, b) => b.score - a.score);

    if (merchantCandidates.length > 0) {
      title = merchantCandidates[0].line;
    }
    return {
      title,
      amount,
      category,
      date,
      description: text,
      type: "expense",
    };
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

              {/* VOICE + RECEIPT */}
              <div className="voice-expense-box">

                {/* VOICE BUTTON */}
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

                {/* RECEIPT SCANNER */}
                <button
                  type="button"
                  className="receipt-scan-button"
                  onClick={handleReceiptScan}
                  disabled={saving}
                >
                  <span className="receipt-scan-icon">
                    📷
                  </span>

                  <span>
                    <strong>Scan Receipt</strong>

                    <small>
                      Take a photo and extract receipt details
                    </small>
                  </span>
                </button>

                {/* VOICE RESULT */}
                {voiceText && (
                  <div className="voice-expense-result">
                    <span>Heard:</span> {voiceText}
                  </div>
                )}

              </div>

              {/* INPUT FIELDS */}
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

    </div >
  );
}