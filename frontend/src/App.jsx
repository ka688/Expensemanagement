
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useState, useEffect, useRef } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { registerPlugin } from "@capacitor/core";

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
import api from "./services/api";

import "./index.css";

const ExpenseNotification = registerPlugin("ExpenseNotification");

function ProtectedLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [testMessage, setTestMessage] = useState("");

  const postTestNotification = async () => {
    try {
      setTestMessage("Posting test notification...");

      await ExpenseNotification.postTestNotification();

      setTestMessage(
        "Test notification posted. Check Android Logcat."
      );
    } catch (error) {
      console.error("TEST NOTIFICATION ERROR:", error);
      setTestMessage(
        "Could not post notification. Check the app build and Logcat."
      );
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="main-area">
        <Navbar setMobileOpen={setMobileOpen} />

        <main>
          {children}

          <section
            style={{
              margin: "20px",
              padding: "16px",
              border: "1px solid #ccc",
              borderRadius: "12px",
            }}
          >
            <h3>Notification Testing</h3>

            <p>
              Post a fake ₹250 Swiggy notification to test
              automatic notification detection.
            </p>

            <button
              type="button"
              onClick={postTestNotification}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Test Payment Notification
            </button>

            {testMessage && (
              <p role="status">{testMessage}</p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

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


function App() {


  const processedNotifications = useRef(new Map());

  useEffect(() => {
    let listener;
    let isMounted = true;

    console.log("REACT APP MOUNTED");
    console.log("SETTING UP EXPENSE NOTIFICATION LISTENER");

    const setupNotificationListener = async () => {
      try {
        listener = await ExpenseNotification.addListener(
          "expenseNotification",
          async (data) => {
            console.log("EXPENSE NOTIFICATION EVENT RECEIVED:", data);
            console.log(
              "NOTIFICATION ID CHECK:",
              data.notificationKey,
              data.postTime
            );
            try {
              // Never save Expense Manager's own test notifications.
              if (data.packageName === "com.flusheye.expensemanager") {
                console.log("Ignoring Expense Manager's own notification");
                return;
              }

              const amount = Number(data.amount);
              const transactionType =
                data.transactionType === "income" ? "Income" :
                  data.transactionType === "expense" ? "Expense" : null;

              if (!Number.isFinite(amount) || amount <= 0 || !transactionType) {
                console.log("Ignoring invalid transaction data");
                return;
              }

              const notificationText = `${data.title || ""} ${data.text || ""}`.trim();

              // Remove duplicate records older than 3 seconds.
              const now = Date.now();

              for (const [key, timestamp] of processedNotifications.current) {
                if (now - timestamp > 3000) {
                  processedNotifications.current.delete(key);
                }
              }

              // Identify matching payment notifications by their content.
              const notificationId = [
                data.packageName,
                data.title,
                data.text,
                amount,
                transactionType,
              ].join("|");

              const lastProcessed = processedNotifications.current.get(notificationId);

              if (lastProcessed && now - lastProcessed <= 3000) {
                console.log("Duplicate payment notification ignored:", notificationId);
                return;
              }

              processedNotifications.current.set(notificationId, now);


              // Try to extract the merchant from text such as
              // "Payment debited Rs. 250 to Swiggy".
              const merchantMatch = notificationText.match(
                /(?:to|at)\s+(.+?)(?:[.!]|$)/i
              );

              const title = merchantMatch
                ? merchantMatch[1].trim()
                : data.title || "Detected transaction";

              const lowerText = notificationText.toLowerCase();

              let category = "Other";

              if (/swiggy|zomato|food|restaurant|cafe/.test(lowerText)) {
                category = "Food";
              } else if (/uber|ola|taxi|fuel|petrol|metro/.test(lowerText)) {
                category = "Transport";
              } else if (/shopping|amazon|flipkart/.test(lowerText)) {
                category = "Shopping";
              } else if (transactionType === "Income") {
                category = "Income";
              }

              const today = new Date();
              const date = [
                today.getFullYear(),
                String(today.getMonth() + 1).padStart(2, "0"),
                String(today.getDate()).padStart(2, "0"),
              ].join("-");

              const expenseData = {
                title,
                amount,
                category,
                type: transactionType,
                date,
                description: `Automatically detected from ${data.packageName}. ${notificationText}`,
              };

              console.log("SAVING DETECTED TRANSACTION:", expenseData);

              await api.post("/expenses", expenseData);
              console.log("DETECTED TRANSACTION SAVED SUCCESSFULLY");
              console.log("DISPATCHING expensesUpdated EVENT");

              const event = new CustomEvent("expensesUpdated");
              const dispatched = window.dispatchEvent(event);

              console.log("expensesUpdated EVENT DISPATCHED:", dispatched);
            } catch (error) {
              console.error(
                "FAILED TO SAVE DETECTED TRANSACTION:",
                error.response?.data || error.message
              );
            }
          }
        );

        if (isMounted) {
          console.log("EXPENSE NOTIFICATION LISTENER READY");
        } else {
          listener.remove();
        }
      } catch (error) {
        console.error("NOTIFICATION LISTENER SETUP FAILED:", error);
      }
    };

    setupNotificationListener();

    return () => {
      isMounted = false;
      listener?.remove();
    };
  }, []);

  // Keep the rest of your existing App component below.

  return (
    <BrowserRouter>
      <DeepLinkHandler />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;