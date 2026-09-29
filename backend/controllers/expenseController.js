const Expense = require("../models/Expense");

exports.getExpenses = async (req, res) => {
  try {
    const {
      search,
      category,
      type,
      startDate,
      endDate,
      sort = "newest",
    } = req.query;

    const query = {
      userId: req.userId,
    };

    // Search
    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          category: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Category
    if (category && category !== "All") {
      query.category = category;
    }

    // Type
    if (type && type !== "All") {
      query.type = type;
    }

    // Date filtering
    if (startDate || endDate) {
      query.date = {};

      if (startDate) {
        query.date.$gte = new Date(
          `${startDate}T00:00:00`
        );
      }

      if (endDate) {
        query.date.$lte = new Date(
          `${endDate}T23:59:59`
        );
      }
    }

    let sortOption = {
      date: -1,
    };

    if (sort === "oldest") {
      sortOption = {
        date: 1,
      };
    }

    if (sort === "highest") {
      sortOption = {
        amount: -1,
      };
    }

    if (sort === "lowest") {
      sortOption = {
        amount: 1,
      };
    }

    const expenses = await Expense.find(query).sort(
      sortOption
    );

    res.json(expenses);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
};

exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!expense) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transaction",
    });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      type,
      description,
      date,
    } = req.body;

    if (
      !title ||
      amount === undefined ||
      !category ||
      !type ||
      !date
    ) {
      return res.status(400).json({
        message: "Required fields are missing",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero",
      });
    }

    const expense = await Expense.create({
      userId: req.userId,
      title,
      amount: Number(amount),
      category,
      type,
      description,
      date,
    });

    res.status(201).json({
      message: "Transaction created successfully",
      data: expense,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create transaction",
    });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!expense) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    const {
      title,
      amount,
      category,
      type,
      description,
      date,
    } = req.body;

    if (!title || amount === undefined || !category || !type || !date) {
      return res.status(400).json({
        message: "Required fields are missing",
      });
    }

    expense.title = title;
    expense.amount = Number(amount);
    expense.category = category;
    expense.type = type;
    expense.description = description || "";
    expense.date = date;

    await expense.save();

    res.json({
      message: "Transaction updated successfully",
      data: expense,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update transaction",
    });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense =
      await Expense.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });

    if (!expense) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete transaction",
    });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const transactions = await Expense.find({
      userId: req.userId,
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    const categoryTotals = {};

    const monthlyTotals = {};

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount);

      const month = new Date(
        transaction.date
      ).toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyTotals[month]) {
        monthlyTotals[month] = {
          income: 0,
          expense: 0,
        };
      }

      if (transaction.type === "Income") {
        totalIncome += amount;
        monthlyTotals[month].income += amount;
      }

      if (transaction.type === "Expense") {
        totalExpenses += amount;

        monthlyTotals[month].expense += amount;

        categoryTotals[transaction.category] =
          (categoryTotals[transaction.category] || 0) +
          amount;
      }
    });

    const recentTransactions = [...transactions]
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      )
      .slice(0, 5);

    const monthlyData = Object.entries(
      monthlyTotals
    ).map(([month, values]) => ({
      month,
      income: values.income,
      expense: values.expense,
    }));

    res.json({
      totalIncome,
      totalExpenses,
      balance:
        totalIncome - totalExpenses,
      transactionCount:
        transactions.length,
      categoryTotals,
      monthlyData,
      recentTransactions,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to generate summary",
    });
  }
};

/* =========================
   RESET ALL TRANSACTIONS
========================= */

exports.resetAllTransactions = async (
  req,
  res
) => {
  try {
    const Expense = require("../models/Expense");
    const BudgetExpense = require("../models/BudgetExpense");

    const mainResult =
      await Expense.deleteMany({
        userId: req.userId,
      });

    const budgetResult =
      await BudgetExpense.deleteMany({
        userId: req.userId,
      });

    res.json({
      message:
        "All transactions have been reset successfully",

      deleted: {
        mainTransactions:
          mainResult.deletedCount,

        budgetTransactions:
          budgetResult.deletedCount,
      },
    });
  } catch (error) {
    console.error(
      "Reset transactions error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to reset transactions",
    });
  }
};