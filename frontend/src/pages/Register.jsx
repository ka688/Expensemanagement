import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/register",
        form
      );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Registration failed"
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
            START YOUR FINANCIAL JOURNEY
          </span>

          <h1>
            Build better
            <br />
            <span>money habits.</span>
          </h1>

          <p>
            Create your personal expense manager and
            get a clearer view of your spending, budgets
            and financial progress.
          </p>

          <div className="auth-feature-list">

            <div className="auth-feature">
              <div className="auth-feature-icon">
                +
              </div>

              <div>
                <strong>One simple place</strong>
                <span>
                  Keep your financial activity organized.
                </span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-icon">
                ✓
              </div>

              <div>
                <strong>Track with confidence</strong>
                <span>
                  Record income and expenses with ease.
                </span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="auth-feature-icon">
                ✦
              </div>

              <div>
                <strong>Understand your spending</strong>
                <span>
                  Discover patterns and useful insights.
                </span>
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
              GET STARTED
            </span>

            <h2>
              Create
              <br />
              your account.
            </h2>

            <p>
              Set up your account and start taking
              control of your expenses today.
            </p>

          </div>

          <form
            className="premium-auth-form"
            onSubmit={handleSubmit}
          >

            {/* NAME */}
            <div className="auth-field">

              <label htmlFor="register-name">
                Your name
              </label>

              <div className="auth-input-wrapper">

                <span className="auth-input-icon">
                  ◯
                </span>

                <input
                  id="register-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                />

              </div>
            </div>

            {/* EMAIL */}
            <div className="auth-field">

              <label htmlFor="register-email">
                Email address
              </label>

              <div className="auth-input-wrapper">

                <span className="auth-input-icon">
                  ✉
                </span>

                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

              </div>
            </div>

            {/* PASSWORD */}
            <div className="auth-field">

              <label htmlFor="register-password">
                Password
              </label>

              <div className="auth-input-wrapper">

                <span className="auth-input-icon">
                  ●
                </span>

                <input
                  id="register-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  minLength="6"
                  autoComplete="new-password"
                  required
                />

              </div>

              <span className="auth-field-hint">
                Use at least 6 characters.
              </span>

            </div>

            {/* ERROR */}
            {error && (
              <div className="premium-auth-error">

                <span>!</span>

                <p>
                  {error}
                </p>

              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              className="premium-auth-button"
              disabled={loading}
            >

              <span>
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </span>

              {!loading && (
                <span className="auth-button-arrow">
                  →
                </span>
              )}

            </button>

          </form>

          {/* LOGIN LINK */}
          <div className="auth-divider">
            <span>
              ALREADY HAVE AN ACCOUNT?
            </span>
          </div>

          <Link
            to="/login"
            className="auth-register-link"
          >

            <span>
              Sign in to your account
            </span>

            <span>
              →
            </span>

          </Link>

          <p className="auth-security-note">
            Your financial information stays protected.
          </p>

        </div>

      </section>

    </div>
  );
}