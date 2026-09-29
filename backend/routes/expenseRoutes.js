const express = require("express");

const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getSummary,
  resetAllTransactions,
} = require("../controllers/expenseController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getExpenses);

router.get("/summary", getSummary);

/* =========================
   RESET ALL TRANSACTIONS
========================= */

router.delete(
  "/reset-all",
  resetAllTransactions
);

/* =========================
   SINGLE TRANSACTION
========================= */

router.get("/:id", getExpense);

router.post("/", createExpense);

router.put("/:id", updateExpense);

router.delete(
  "/:id",
  deleteExpense
);

module.exports = router;