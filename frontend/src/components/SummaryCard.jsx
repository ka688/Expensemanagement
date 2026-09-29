export default function SummaryCard({
  title,
  value,
  icon,
  type,
}) {
  return (
    <div className={`summary-card ${type || ""}`}>
      <div className="summary-card-top">
        <div>
          <p>{title}</p>
          <h2>{value}</h2>
        </div>

        <div className="summary-icon">
          {icon}
        </div>
      </div>
    </div>
  );
}