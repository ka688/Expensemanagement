import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function ExpenseChart({
  data,
}) {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3>Income vs Expenses</h3>
          <p>Monthly overview</p>
        </div>
      </div>

      <div className="chart-container">
        {data.length === 0 ? (
          <div className="empty-chart">
            No transaction data yet
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#16a34a"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="expense"
                name="Expenses"
                stroke="#dc2626"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}