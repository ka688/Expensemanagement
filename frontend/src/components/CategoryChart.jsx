import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#ca8a04",
  "#db2777",
];

export default function CategoryChart({
  data,
}) {
  const chartData = Object.entries(
    data || {}
  ).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3>Expenses by Category</h3>
          <p>Where your money goes</p>
        </div>
      </div>

      <div className="chart-container">
        {chartData.length === 0 ? (
          <div className="empty-chart">
            No expense data yet
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {chartData.map(
                  (_, index) => (
                    <Cell
                      key={index}
                      fill={
                        COLORS[
                          index %
                            COLORS.length
                        ]
                      }
                    />
                  )
                )}
              </Pie>

              <Tooltip />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}