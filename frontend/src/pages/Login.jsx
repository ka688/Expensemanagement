import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-auth-page">

      {/* LEFT SIDE */}
      <section className="auth-showcase">

        <div className="auth-brand">
          <div className="auth-brand-icon">₹</div>

          <div>
            <strong>Expense</strong>
            <span>Manager</span>
          </div>
        </div>

        <div className="auth-showcase-content">
          <span className="auth-eyebrow">
            YOUR MONEY. YOUR CONTROL.
          </span>

          <h1>
            Take control of
            <br />
            <span>your money.</span>
          </h1>

          <p>
            Track expenses, understand your spending,
            manage budgets and make smarter financial
            decisions — all in one place.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <div className="auth-feature-icon">↗</div>
              <div>
                <strong>Track everything</strong>
                <span>Keep every transaction organized.</span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-icon">◎</div>
              <div>
                <strong>Stay on budget</strong>
                <span>Know exactly where your money goes.</span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-icon">✦</div>
              <div>
                <strong>See the bigger picture</strong>
                <span>Turn your spending into useful insights.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-showcase-footer">
          <span>Simple.</span>
          <span>Private.</span>
          <span>Built for you.</span>
        </div>

      </section>

      {/* RIGHT SIDE */}
      <section className="auth-form-section">

        <div className="auth-form-wrapper">

          <div className="auth-mobile-brand">
            <div className="auth-brand-icon">₹</div>
            <div>
              <strong>Expense</strong>
              <span>Manager</span>
            </div>
          </div>

          <div className="auth-form-header">
            <span className="auth-form-kicker">
              WELCOME BACK
            </span>

            <h2>Sign in.</h2>

            <p>
              Welcome back. Enter your details to
              continue managing your finances.
            </p>
          </div>

          <form
            className="premium-auth-form"
            onSubmit={handleSubmit}
          >

            <div className="auth-field">
              <label htmlFor="login-email">
                Email address
              </label>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon">✉</span>

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
  <label htmlFor="login-password">
    Password
  </label>

  <div className="auth-input-wrapper password-input-wrapper">
    <span className="auth-input-icon">●</span>

    <input
      id="login-password"
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Enter your password"
      autoComplete="current-password"
      required
    />

    <button
      type="button"
      className="password-toggle"
      onClick={() => setShowPassword((prev) => !prev)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      title={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3l18 18" />
          <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
          <path d="M9.88 4.24A9.77 9.77 0 0 1 12 4c5 0 9.27 3.11 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M6.61 6.61C4.62 7.89 3.1 9.74 2 12c1.73 4.89 6 8 10 8a9.77 9.77 0 0 0 2.12-.24" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  </div>
</div>

            {error && (
              <div className="premium-auth-error">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="premium-auth-button"
              disabled={loading}
            >
              <span>
                {loading ? "Signing in..." : "Sign in"}
              </span>

              {!loading && (
                <span className="auth-button-arrow">
                  →
                </span>
              )}
            </button>

          </form>

          <div className="auth-divider">
            <span>NEW TO EXPENSE MANAGER?</span>
          </div>

          <Link
            to="/register"
            className="auth-register-link"
          >
            <span>Create your account</span>
            <span>→</span>
          </Link>

          <p className="auth-security-note">
            Your financial information stays protected.
          </p>

        </div>

      </section>

    </div>
  );
}