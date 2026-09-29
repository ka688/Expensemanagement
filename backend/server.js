require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const budgetExpenseRoutes = require("./routes/budgetExpenseRoutes");

const app = express();

connectDB();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Expense Management API is running",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/expenses", expenseRoutes);

app.use("/api/budgets", budgetRoutes);

app.use("/api/budget-expenses", budgetExpenseRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});