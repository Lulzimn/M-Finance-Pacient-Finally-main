import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;


export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Removed auto-redirect - user must explicitly login

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.post(
        `${API}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      
      const user = response.data;
      sessionStorage.setItem('user', JSON.stringify(user));
      
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/staff");
      }
    } catch (error) {
      setError(error.response?.data?.detail || "Email ose fjalëkalim i pasaktë");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ...hequr imazhet dhe backgroundet... */}

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* ...hequr logo mobile... */}

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

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 block mb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  autoComplete="email"
                  disabled={loading}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 block mb-2">
                  Fjalëkalimi
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div></div>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                >
                  Keni harruar fjalëkalimin?
                </Link>
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white py-6 rounded-xl font-medium"
              >
                {loading ? "Po kyçem..." : "Kyçuni"}
              </Button>
            </form>

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
