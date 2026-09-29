const Budget = require("../models/Budget");
const BudgetExpense = require("../models/BudgetExpense");

const validMonth =
  /^(\d{4})-(0[1-9]|1[0-2])$/;

/* =========================
   GET BUDGETS
========================= */

exports.getBudgets = async (req, res) => {
  try {
    const month =
      validMonth.test(req.query.month || "")
        ? req.query.month
        : new Date()
            .toISOString()
            .slice(0, 7);

    const budgets = await Budget.find({
      userId: req.userId,
      month,
    }).sort({
      category: 1,
    });

    const budgetIds = budgets.map(
      (budget) => budget._id
    );

    /*
      IMPORTANT:
      Only BudgetExpense is used here.

      Main Expense collection is NOT touched.
    */
    const expenses =
      budgetIds.length > 0
        ? await BudgetExpense.find({
            userId: req.userId,
            budgetId: {
              $in: budgetIds,
            },
          }).sort({
            date: -1,
            createdAt: -1,
          })
        : [];

    const spentMap = {};

    expenses.forEach((expense) => {
      const budgetId =
        expense.budgetId.toString();

      spentMap[budgetId] =
        (spentMap[budgetId] || 0) +
        Number(expense.amount);
    });

    const budgetData = budgets.map(
      (budget) => {
        const spent =
          spentMap[
            budget._id.toString()
          ] || 0;

        const budgetAmount =
          Number(budget.amount);

        const remaining =
          budgetAmount - spent;

        const percentage =
          budgetAmount > 0
            ? Math.round(
                (spent / budgetAmount) *
                  100
              )
            : 0;

        let status = "safe";

        if (spent >= budgetAmount) {
          status = "exceeded";
        } else if (percentage >= 90) {
          status = "danger";
        } else if (percentage >= 75) {
          status = "warning";
        }

        return {
          ...budget.toObject(),

          spent,

          remaining,

          percentage,

          status,
        };
      }
    );

    const totalBudget =
      budgetData.reduce(
        (sum, budget) =>
          sum + Number(budget.amount),
        0
      );

    const totalSpent =
      budgetData.reduce(
        (sum, budget) =>
          sum + Number(budget.spent),
        0
      );

    const remaining =
      totalBudget - totalSpent;

    const percentage =
      totalBudget > 0
        ? Math.round(
            (totalSpent /
              totalBudget) *
              100
          )
        : 0;

    res.json({
      month,

      budgets: budgetData,

      totals: {
        totalBudget,

        totalSpent,

        remaining,

        percentage,
      },
    });
  } catch (error) {
    console.error(
      "Get budgets error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch budgets",
    });
  }
};

/* =========================
   CREATE BUDGET
========================= */

exports.createBudget = async (
  req,
  res
) => {
  try {
    const {
      name,
      category,
      amount,
      month,
    } = req.body;

    const numericAmount =
      Number(amount);

    if (
      !name ||
      !category ||
      !month ||
      !validMonth.test(month)
    ) {
      return res.status(400).json({
        message:
          "Valid budget fields are required",
      });
    }

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "Budget amount must be greater than zero",
      });
    }

    const budget =
      await Budget.create({
        userId: req.userId,

        name: name.trim(),

        category: category.trim(),

        amount: numericAmount,

        month,
      });

    res.status(201).json({
      message:
        "Budget created successfully",

      data: budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "A budget for this category already exists for this month",
      });
    }

    console.error(
      "Create budget error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create budget",
    });
  }
};

/* =========================
   UPDATE BUDGET
========================= */

exports.updateBudget = async (
  req,
  res
) => {
  try {
    const {
      name,
      category,
      amount,
      month,
    } = req.body;

    const numericAmount =
      Number(amount);

    if (
      !name ||
      !category ||
      !month ||
      !validMonth.test(month)
    ) {
      return res.status(400).json({
        message:
          "Valid budget fields are required",
      });
    }

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "Budget amount must be greater than zero",
      });
    }

    const budget =
      await Budget.findOne({
        _id: req.params.id,

        userId: req.userId,
      });

    if (!budget) {
      return res.status(404).json({
        message:
          "Budget not found",
      });
    }

    budget.name =
      name.trim();

    budget.category =
      category.trim();

    budget.amount =
      numericAmount;

    budget.month =
      month;

    await budget.save();

    res.json({
      message:
        "Budget updated successfully",

      data: budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "A budget for this category already exists for this month",
      });
    }

    console.error(
      "Update budget error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update budget",
    });
  }
};

/* =========================
   DELETE BUDGET
========================= */

exports.deleteBudget = async (
  req,
  res
) => {
  try {
    const budget =
      await Budget.findOneAndDelete({
        _id: req.params.id,

        userId: req.userId,
      });

    if (!budget) {
      return res.status(404).json({
        message:
          "Budget not found",
      });
    }

    /*
      Delete only budget expenses
      belonging to this budget.

      Main Expense collection
      remains untouched.
    */
    await BudgetExpense.deleteMany({
      budgetId: budget._id,
      userId: req.userId,
    });

    res.json({
      message:
        "Budget deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete budget error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete budget",
    });
  }
};