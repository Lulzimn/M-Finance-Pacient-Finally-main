import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_mdental-billing/artifacts/g349ocju_63C124A8-2AE7-4F0A-BB53-C2E63E1954E0.png";
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export default function LoginPage() {
  const navigate = useNavigate();
  const [devEmail, setDevEmail] = useState("lulzimn995@gmail.com");
  const [devName, setDevName] = useState("Test Admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, {
          withCredentials: true
        });
        const user = response.data;
        if (user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/staff");
        }
      } catch (error) {
        // Not authenticated, stay on login page
      }
    };
    checkAuth();
  }, [navigate]);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/admin";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleMicrosoftLogin = () => {
    const redirectUrl = window.location.origin + "/admin";
    window.location.href = `https://auth.emergentagent.com/microsoft?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleDevLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.post(
        `${API}/auth/dev-login?email=${encodeURIComponent(devEmail)}&name=${encodeURIComponent(devName)}`,
        {},
        { withCredentials: true }
      );
      
      const user = response.data;
      // Save user to sessionStorage so it persists during navigation
      sessionStorage.setItem('user', JSON.stringify(user));
      
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/staff");
      }
    } catch (error) {
      setError(error.response?.data?.detail || "Gabim në kyçje");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1642844819197-5f5f21b89ff8?crop=entropy&cs=srgb&fm=jpg&q=85')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/80 to-slate-900/90"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <img src={LOGO_URL} alt="M-Dental Logo" className="h-24 w-auto mb-6" />
          </div>
          <div className="space-y-4 text-sky-100/80">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span>Menaxhim i saktë i financave</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span>Evidencë e hyrjeve dhe daljeve</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span>Raporte të detajuara</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={LOGO_URL} alt="M-Dental Logo" className="h-20 mx-auto mb-4" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Mirësevini!</h2>
              <p className="text-slate-500">Kyçuni në sistemin tuaj të menaxhimit financiar</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Dev Login Form - Only show in development */}
            {!IS_PRODUCTION && (
              <form onSubmit={handleDevLogin} className="space-y-4 mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <p className="text-xs font-semibold text-yellow-800 mb-3">⚙️ DEV LOGIN (Local Testing)</p>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Name</label>
                  <input
                    type="text"
                    value={devName}
                    onChange={(e) => setDevName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {loading ? "Po kyçem..." : "Kyçuni (Dev)"}
                </Button>
              </form>
            )}

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  {IS_PRODUCTION ? 'Kyçuni me' : 'Ose'}
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button
              onClick={handleGoogleLogin}
              data-testid="google-login-btn"
              className="w-full bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 py-6 rounded-xl font-medium transition-all flex items-center justify-center gap-3 mb-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Vazhdo me Google
            </Button>

            {/* Microsoft/Outlook Login Button */}
            <Button
              onClick={handleMicrosoftLogin}
              className="w-full bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 py-6 rounded-xl font-medium transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                <path d="M0 0h11v11H0z" fill="#f25022"/>
                <path d="M12 0h11v11H12z" fill="#00a4ef"/>
                <path d="M0 12h11v11H0z" fill="#7fba00"/>
                <path d="M12 12h11v11H12z" fill="#ffb900"/>
              </svg>
              Vazhdo me Microsoft / Outlook
            </Button>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                Duke u kyçur, ju pranoni kushtet e përdorimit
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-slate-400">
            <p>© 2024 M-Dental. Të gjitha të drejtat e rezervuara.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
