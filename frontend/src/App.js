import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

// Pages
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import PatientsPage from "./pages/PatientsPage";
import InvoicesPage from "./pages/InvoicesPage";
import FinancatPage from "./pages/FinancatPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import ActivityLogsPage from "./pages/ActivityLogsPage";
import AppointmentsPage from "./pages/AppointmentsPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios to ALWAYS send credentials
axios.defaults.withCredentials = true;

// Protect Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user exists in sessionStorage
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        return;
      } catch (err) {
        console.error("Error parsing user data:", err);
        sessionStorage.removeItem('user');
        setIsAuthenticated(false);
        navigate("/login");
        return;
      }
    }

    // If no user in storage, verify with backend
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, {
          withCredentials: true
        });
        setUser(response.data);
        sessionStorage.setItem('user', JSON.stringify(response.data));
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Auth check failed:", err);
        sessionStorage.removeItem('user');
        setIsAuthenticated(false);
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard if trying to access unauthorized route
    return <Navigate to={user?.role === "admin" ? "/admin" : "/staff"} replace />;
  }

  return children({ user, setUser });
};

// App Router
function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            {({ user, setUser }) => <AdminDashboard user={user} setUser={setUser} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/patients"
        element={
          <ProtectedRoute requiredRole="admin">
            {({ user, setUser }) => <PatientsPage user={user} setUser={setUser} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/appointments"
        element={
          <ProtectedRoute requiredRole="admin">
            {({ user, setUser }) => <AppointmentsPage user={user} setUser={setUser} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/invoices"
        element={
          <ProtectedRoute requiredRole="admin">
            {({ user, setUser }) => <InvoicesPage user={user} setUser={setUser} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/financat"
        element={
          <ProtectedRoute requiredRole="admin">
            {({ user, setUser }) => <FinancatPage user={user} setUser={setUser} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute requiredRole="admin">
            {({ user, setUser }) => <ReportsPage user={user} setUser={setUser} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            {({ user, setUser }) => <SettingsPage user={user} setUser={setUser} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute requiredRole="admin">
            {({ user, setUser }) => <ActivityLogsPage user={user} setUser={setUser} />}
          </ProtectedRoute>
        }
      />

      {/* Staff Routes */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute requiredRole="staff">
            {({ user, setUser }) => <StaffDashboard user={user} setUser={setUser} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/patients"
        element={
          <ProtectedRoute requiredRole="staff">
            {({ user, setUser }) => <PatientsPage user={user} setUser={setUser} isStaff />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/invoices"
        element={
          <ProtectedRoute requiredRole="staff">
            {({ user, setUser }) => <InvoicesPage user={user} setUser={setUser} isStaff />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/appointments"
        element={
          <ProtectedRoute requiredRole="staff">
            {({ user, setUser }) => <AppointmentsPage user={user} setUser={setUser} isStaff />}
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
