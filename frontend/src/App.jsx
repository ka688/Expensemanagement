import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useState,
} from "react";
import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import AddExpense from "./pages/AddExpense";
import EditExpense from "./pages/EditExpense";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Budgets from "./pages/Budgets";

import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import "./index.css";

function ProtectedLayout({
  children,
}) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="main-area">
        <Navbar
          setMobileOpen={setMobileOpen}
        />

        <main>{children}</main>
      </div>
    </div>
  );
}

function App() {
  function DeepLinkHandler() {
    const navigate = useNavigate();

    useEffect(() => {
      let listener;

      const setupDeepLink = async () => {
        listener = await CapacitorApp.addListener(
          "appUrlOpen",
          ({ url }) => {
            if (url === "expensemanager://add-expense") {
              navigate("/add-expense");
            }
          }
        );

        const launchUrl = await CapacitorApp.getLaunchUrl();

        if (launchUrl?.url === "expensemanager://add-expense") {
          navigate("/add-expense");
        }
      };

      setupDeepLink();

      return () => {
        listener?.remove();
      };
    }, [navigate]);

    return null;
  }

  return (
    <BrowserRouter>
      <DeepLinkHandler />
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Expenses />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-expense"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <AddExpense />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-expense/:id"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <EditExpense />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Reports />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/budgets"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Budgets />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Profile />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


      </Routes>
    </BrowserRouter>
  );
}

export default App;