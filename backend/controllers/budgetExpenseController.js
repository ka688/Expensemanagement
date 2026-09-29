const Budget = require("../models/Budget");
const BudgetExpense = require("../models/BudgetExpense");

function getMonthRange(month) {
  const [year, monthNumber] =
    month.split("-").map(Number);

  return {
    start: new Date(
      year,
      monthNumber - 1,
      1
    ),

    end: new Date(
      year,
      monthNumber,
      1
    ),
  };
};

// ===============================
// GET BUDGET EXPENSES
// ===============================

exports.getBudgetExpenses = async (
  req,
  res
) => {
  try {
    const budget =
      await Budget.findOne({
        _id: req.params.budgetId,
        userId: req.userId,
      });

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    const expenses =
      await BudgetExpense.find({
        userId: req.userId,
        budgetId: budget._id,
      }).sort({
        date: -1,
        createdAt: -1,
      });

    const totalSpent =
      expenses.reduce(
        (total, expense) =>
          total + Number(expense.amount),
        0
      );

    res.json({
      budget: {
        id: budget._id,
        name: budget.name,
        category: budget.category,
        amount: budget.amount,
        month: budget.month,
      },

      totalSpent,

      remaining:
        Number(budget.amount) -
        totalSpent,

      percentage: budget.amount
        ? Math.min(
            100,
            Math.round(
              (totalSpent /
                budget.amount) *
                100
            )
          )
        : 0,

      expenses,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Failed to fetch budget expenses",
    });
  }
};

// ===============================
// ADD BUDGET EXPENSE
// ===============================

exports.createBudgetExpense =
  async (req, res) => {
    try {
      const budget =
        await Budget.findOne({
          _id: req.params.budgetId,
          userId: req.userId,
        });

      if (!budget) {
        return res.status(404).json({
          message: "Budget not found",
        });
      }

      const {
        title,
        amount,
        description,
        date,
      } = req.body;

      if (
        !title ||
        amount === undefined ||
        !date
      ) {
        return res.status(400).json({
          message:
            "Title, amount and date are required",
        });
      }

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "Amount must be greater than zero",
        });
      }

      const expense =
        await BudgetExpense.create({
          userId: req.userId,

          budgetId: budget._id,

          title: title.trim(),

          amount: numericAmount,

          category:
            budget.category,

          description:
            description?.trim() || "",

          date,
        });

      res.status(201).json({
        message:
          "Budget expense added successfully",

        data: expense,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to add budget expense",
      });
    }
  };

// ===============================
// UPDATE BUDGET EXPENSE
// ===============================

exports.updateBudgetExpense =
  async (req, res) => {
    try {
      const expense =
        await BudgetExpense.findOne({
          _id: req.params.id,
          userId: req.userId,
          budgetId:
            req.params.budgetId,
        });

      if (!expense) {
        return res.status(404).json({
          message:
            "Budget expense not found",
        });
      }

      const {
        title,
        amount,
        description,
        date,
      } = req.body;

      if (
        !title ||
        amount === undefined ||
        !date
      ) {
        return res.status(400).json({
          message:
            "Title, amount and date are required",
        });
      }

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "Amount must be greater than zero",
        });
      }

      expense.title =
        title.trim();

      expense.amount =
        numericAmount;

      expense.description =
        description?.trim() || "";

      expense.date = date;

      await expense.save();

      res.json({
        message:
          "Budget expense updated successfully",

        data: expense,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to update budget expense",
      });
    }
  };

// ===============================
// DELETE BUDGET EXPENSE
// ===============================

exports.deleteBudgetExpense =
  async (req, res) => {
    try {
      const expense =
        await BudgetExpense.findOneAndDelete(
          {
            _id: req.params.id,

            userId:
              req.userId,

            budgetId:
              req.params.budgetId,
          }
        );

      if (!expense) {
        return res.status(404).json({
          message:
            "Budget expense not found",
        });
      }

      res.json({
        message:
          "Budget expense deleted successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to delete budget expense",
      });
    }
  };

// ===============================
// BUDGET DASHBOARD
// ===============================

exports.getBudgetDashboard =
  async (req, res) => {
    try {
      const month =
        req.query.month;

      if (
        !month ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(
          month
        )
      ) {
        return res.status(400).json({
          message:
            "Valid month is required",
        });
      }

      const {
        start,
        end,
      } = getMonthRange(month);

      const budgets =
        await Budget.find({
          userId: req.userId,
          month,
        }).sort({
          category: 1,
        });

      const expenses =
        await BudgetExpense.find({
          userId: req.userId,

          date: {
            $gte: start,
            $lt: end,
          },
        }).sort({
          date: -1,
        });

      const totalBudget =
        budgets.reduce(
          (sum, budget) =>
            sum +
            Number(budget.amount),
          0
        );

      const totalSpent =
        expenses.reduce(
          (sum, expense) =>
            sum +
            Number(expense.amount),
          0
        );

      const categorySpent = {};

      expenses.forEach(
        (expense) => {
          categorySpent[
            expense.category
          ] =
            (categorySpent[
              expense.category
            ] || 0) +
            Number(
              expense.amount
            );
        }
      );

      const budgetCards =
        budgets.map(
          (budget) => {
            const spent =
              categorySpent[
                budget.category
              ] || 0;

            const percentage =
              budget.amount
                ? Math.round(
                    (spent /
                      budget.amount) *
                      100
                  )
                : 0;

            return {
              ...budget.toObject(),

              spent,

              remaining:
                Number(
                  budget.amount
                ) - spent,

              percentage:
                Math.min(
                  percentage,
                  100
                ),
            };
          }
        );

      const recentExpenses =
        expenses.slice(0, 8);

      res.json({
        month,

        totals: {
          totalBudget,

          totalSpent,

          remaining:
            totalBudget -
            totalSpent,

          percentage:
            totalBudget
              ? Math.round(
                  (totalSpent /
                    totalBudget) *
                    100
                )
              : 0,
        },

        budgets:
          budgetCards,

        recentExpenses,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to load budget dashboard",
      });
    }
  };