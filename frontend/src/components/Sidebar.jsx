import { NavLink, useNavigate } from "react-router-dom";

export default function Sidebar({
  mobileOpen,
  setMobileOpen,
}) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const closeMobile = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-logo">
          <div className="logo-icon">
            ₹
          </div>

          <div>
            <strong>Expense</strong>
            <span>Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            onClick={closeMobile}
          >
            <span>📊</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/expenses"
            onClick={closeMobile}
          >
            <span>💳</span>
            Transactions
          </NavLink>

          <NavLink
            to="/add-expense"
            onClick={closeMobile}
          >
            <span>➕</span>
            Add Transaction
          </NavLink>

          <NavLink
             to="/budgets"
             onClick={closeMobile}
          >
            <span>🎯</span>
            Budgets
          </NavLink>

          <NavLink
            to="/reports"
            onClick={closeMobile}
          >
            <span>📈</span>
            Reports
          </NavLink>

          <NavLink
            to="/profile"
            onClick={closeMobile}
          >
            <span>👤</span>
            Profile
          </NavLink>
        </nav>

        <button
          className="logout-button"
          onClick={logout}
        >
          🚪 Logout
        </button>
      </aside>
    </>
  );
}