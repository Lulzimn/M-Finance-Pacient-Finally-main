import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;


export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [checking, setChecking] = useState(true);

  const token = searchParams.get("token");

  useEffect(() => {
    // Verify token on mount
    const verifyToken = async () => {
      if (!token) {
        setError("Token i pavlefshëm");
        setChecking(false);
        return;
      }

      try {
        await axios.post(`${API}/auth/verify-reset-token`, { token });
        setTokenValid(true);
      } catch (error) {
        console.error("Token verification error:", error);
        setError("Token i pavlefshëm ose i skaduar");
      } finally {
        setChecking(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError("Fjalëkalimi duhet të jetë të paktën 6 karaktere");
      return;
    }

    if (password !== confirmPassword) {
      setError("Fjalëkalimet nuk përputhen");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await axios.post(`${API}/auth/reset-password`, {
        token,
        new_password: password
      });
      
      // Show success and redirect
      alert("Fjalëkalimi u rivendos me sukses! Tani mund të kyçeni.");
      navigate("/login");
    } catch (error) {
      setError(error.response?.data?.detail || "Gabim gjatë rivendosjes së fjalëkalimit");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Po verifikohet...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Token i Pavlefshëm</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <Button
              onClick={() => navigate("/forgot-password")}
              className="bg-sky-600 hover:bg-sky-700"
            >
              Kërko Link të Ri
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ...hequr imazhet dhe backgroundet... */}

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* ...hequr logo mobile... */}

          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Rivendos Fjalëkalimin</h2>
              <p className="text-slate-500">Vendos fjalëkalimin tënd të ri</p>
            </div>

            {error && (
              <Alert className="mb-6 bg-red-50 border-red-200">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 block mb-2">
                  Fjalëkalimi i Ri
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                    minLength={6}
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

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 block mb-2">
                  Konfirmo Fjalëkalimin
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white py-6 rounded-xl font-medium"
              >
                {loading ? "Duke ruajtur..." : "Rivendos Fjalëkalimin"}
              </Button>
            </form>
          </div>

          <div className="mt-8 text-center text-sm text-slate-400">
            <p>© 2024 M-Dental. Të gjitha të drejtat e rezervuara.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
