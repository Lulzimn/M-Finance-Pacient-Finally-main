import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSuccess(true);
      setEmail("");
    } catch (error) {
      setError(error.response?.data?.detail || "Gabim gjatë dërgimit të email-it");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ...hequr imazhet dhe backgroundet... */}

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* ...hequr logo mobile... */}

          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Keni harruar fjalëkalimin?</h2>
              <p className="text-slate-500">
                Shkruani email-in tuaj dhe do t'ju dërgojmë një link për të rivendosur fjalëkalimin
              </p>
            </div>

            {success && (
              <Alert className="mb-6 bg-emerald-50 border-emerald-200">
                <AlertDescription className="text-emerald-700">
                  ✓ Kontrollo email-in tënd! Nëse llogaria ekziston, do të marrësh një link për të rivendosur fjalëkalimin.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="mb-6 bg-red-50 border-red-200">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-6 rounded-xl font-medium"
                >
                  {loading ? "Duke dërguar..." : "Dërgo Link për Rivendosje"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="text-sm text-sky-600 hover:text-sky-700 font-medium"
              >
                ← Kthehu tek kyçja
              </Link>
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
