import { useState, useEffect, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
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

// Auth Callback Component - REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        try {
          const response = await axios.get(`${API}/auth/session?session_id=${sessionId}`, {
            withCredentials: true
          });
          const user = response.data;
          
          // Redirect based on role
          if (user.role === "admin") {
            navigate("/admin", { state: { user } });
          } else {
            navigate("/staff", { state: { user } });
          }
        } catch (error) {
          console.error("Auth error:", error);
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    };

    processAuth();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Duke u autentikuar...</p>
      </div>
    </div>
  );
};

// Protect Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // First, try to get user from sessionStorage
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        return;
      } catch (error) {
        sessionStorage.removeItem('user');
      }
    }

    // If user data passed from AuthCallback, use it
    if (location.state?.user) {
      setUser(location.state.user);
      sessionStorage.setItem('user', JSON.stringify(location.state.user));
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, {
          withCredentials: true
        });
        setUser(response.data);
        sessionStorage.setItem('user', JSON.stringify(response.data));
        setIsAuthenticated(true);
      } catch (error) {
        sessionStorage.removeItem('user');
        setIsAuthenticated(false);
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate, location.state]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role
  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/staff" replace />;
    }
  }

  return children({ user, setUser });
};

// App Router
function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id BEFORE rendering routes
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

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
