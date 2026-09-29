import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

export default function BudgetDashboard({
  month,
}) {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const money = (value) =>
    new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(value || 0);

  const loadDashboard =
    async () => {
      try {
        setLoading(true);

        const response =
          await api.get(
            `/budget-expenses/dashboard?month=${month}`
          );

        setData(
          response.data
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadDashboard();
  }, [month]);

  if (loading) {
    return (
      <div className="budget-dashboard-loading">
        Loading budget dashboard...
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="budget-dashboard">
      <div className="budget-dashboard-title">
        <h2>
          Budget Overview
        </h2>

        <span>
          This section is separate
          from your main
          transactions.
        </span>
      </div>

      <div className="simple-budget-stats">
        <div>
          <span>
            Budget
          </span>

          <strong>
            {money(
              data.totals.totalBudget
            )}
          </strong>
        </div>

        <div>
          <span>
            Used
          </span>

          <strong>
            {money(
              data.totals.totalSpent
            )}
          </strong>
        </div>

        <div>
          <span>
            Remaining
          </span>

          <strong>
            {money(
              data.totals.remaining
            )}
          </strong>
        </div>
      </div>

      <div className="budget-dashboard-grid">
        {data.budgets.map(
          (budget) => (
            <div
              className="simple-budget-card"
              key={
                budget._id
              }
            >
              <div className="simple-budget-card-top">
                <div>
                  <span>
                    {
                      budget.category
                    }
                  </span>

                  <h3>
                    {budget.name}
                  </h3>
                </div>

                <strong>
                  {money(
                    budget.spent
                  )}{" "}
                  /{" "}
                  {money(
                    budget.amount
                  )}
                </strong>
              </div>

              <div className="simple-budget-track">
                <div
                  style={{
                    width: `${Math.min(
                      budget.percentage,
                      100
                    )}%`,
                  }}
                />
              </div>

              <div className="simple-budget-bottom">
                <span>
                  {
                    budget.percentage
                  }
                  % used
                </span>

                <span>
                  {money(
                    budget.remaining
                  )}{" "}
                  left
                </span>
              </div>
            </div>
          )
        )}
      </div>

      <div className="budget-recent">
        <h3>
          Recent Budget Spending
        </h3>

        {data.recentExpenses
          .length === 0 ? (
          <p>
            No budget spending
            recorded yet.
          </p>
        ) : (
          data.recentExpenses.map(
            (expense) => (
              <div
                className="budget-recent-row"
                key={
                  expense._id
                }
              >
                <div>
                  <strong>
                    {
                      expense.title
                    }
                  </strong>

                  <span>
                    {
                      expense.category
                    }
                  </span>
                </div>

                <strong>
                  {money(
                    expense.amount
                  )}
                </strong>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}