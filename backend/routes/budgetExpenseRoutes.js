const express = require("express");

const protect = require(
  "../middleware/authMiddleware"
);

const budgetExpenseController =
  require(
    "../controllers/budgetExpenseController"
  );

const router =
  express.Router();

router.use(protect);

// IMPORTANT:
// dashboard must come BEFORE /:budgetId
router.get(
  "/dashboard",
  budgetExpenseController.getBudgetDashboard
);

router.get(
  "/:budgetId",
  budgetExpenseController.getBudgetExpenses
);

router.post(
  "/:budgetId",
  budgetExpenseController.createBudgetExpense
);

router.put(
  "/:budgetId/:id",
  budgetExpenseController.updateBudgetExpense
);

router.delete(
  "/:budgetId/:id",
  budgetExpenseController.deleteBudgetExpense
);

module.exports = router;