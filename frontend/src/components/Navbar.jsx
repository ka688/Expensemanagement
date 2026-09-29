import { useState } from "react";

export default function Navbar({
  setMobileOpen,
}) {
  const [user] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user")
      );
    } catch {
      return null;
    }
  });

  return (
    <header className="topbar">
      <button
        className="mobile-menu-button"
        onClick={() =>
          setMobileOpen((current) => !current)
        }
      >
        ☰
      </button>

      <div className="topbar-title">
        Expense Management
      </div>

      <div className="topbar-user">
        <div className="avatar">
          {user?.name
            ? user.name
                .charAt(0)
                .toUpperCase()
            : "U"}
        </div>

        <div className="user-info">
          <strong>
            {user?.name || "User"}
          </strong>

          <span>
            {user?.email || ""}
          </span>
        </div>
      </div>
    </header>
  );
}