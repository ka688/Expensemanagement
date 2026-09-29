const mongoose = require("mongoose");

const budgetExpenseSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      budgetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Budget",
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      amount: {
        type: Number,
        required: true,
        min: 0.01,
      },

      category: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500,
      },

      date: {
        type: Date,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

budgetExpenseSchema.index({
  userId: 1,
  budgetId: 1,
  date: -1,
});

module.exports =
  mongoose.model(
    "BudgetExpense",
    budgetExpenseSchema
  );