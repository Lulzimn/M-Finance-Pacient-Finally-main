import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Wallet,
  BarChart3, 
  Settings, 
  LogOut,
  Activity,
  Menu,
  X,
  CalendarDays
} from "lucide-react";
import { useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Logo URL
const LOGO_URL = "https://customer-assets.emergentagent.com/job_mdental-billing/artifacts/g349ocju_63C124A8-2AE7-4F0A-BB53-C2E63E1954E0.png";

export const Sidebar = ({ user, isAdmin = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminLinks = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/patients", icon: Users, label: "Pacientët" },
    { to: "/admin/appointments", icon: CalendarDays, label: "Terminet" },
    { to: "/admin/invoices", icon: FileText, label: "Faturat" },
    { to: "/admin/financat", icon: Wallet, label: "Financat" },
    { to: "/admin/reports", icon: BarChart3, label: "Raportet" },
    { to: "/admin/settings", icon: Settings, label: "Cilësimet" },
    { to: "/admin/logs", icon: Activity, label: "Aktiviteti" },
  ];

  const staffLinks = [
    { to: "/staff", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/staff/patients", icon: Users, label: "Pacientët" },
    { to: "/staff/appointments", icon: CalendarDays, label: "Terminet" },
    { to: "/staff/invoices", icon: FileText, label: "Faturat" },
  ];

  const links = isAdmin ? adminLinks : staffLinks;

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.error("Logout error:", e);
    }
    // Clear session data
    sessionStorage.removeItem('user');
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/admin" || path === "/staff") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-center">
          <img 
            src={LOGO_URL} 
            alt="M-Dental Logo" 
            className="h-16 w-auto object-contain"
          />
        </div>
        <p className="text-slate-400 text-xs text-center mt-2">{isAdmin ? "Admin Panel" : "Staf Panel"}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`nav-${link.label.toLowerCase()}`}
              className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 mb-4">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="text-white font-medium">{user?.name?.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
          <span className="font-medium">Dilni</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
        data-testid="mobile-menu-btn"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div 
            className="w-64 h-full bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="bg-slate-900 border-r border-slate-800 h-full">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
