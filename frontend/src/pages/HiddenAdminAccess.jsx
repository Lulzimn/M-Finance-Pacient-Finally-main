import { useState } from "react";
import axios from "axios";
import { AdminAccessPanel } from "./AdminAccessPanel";

// Kjo faqe nuk duhet të importohet në asnjë menu ose layout!
// Aksesohet vetëm me linkun e fshehtë të backend-it

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function HiddenAdminAccess() {
  const [step, setStep] = useState(1);
  const [link, setLink] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${BACKEND_URL}/api/admin/hidden-access-verify`, { link, email });
      if (res.data.success) {
        setSuccess(true);
        setStep(2);
      } else {
        setError("Akses i refuzuar");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Gabim në verifikim");
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", padding: 24, background: "#f8fafc", borderRadius: 8 }}>
        <h2 style={{ fontWeight: 600, fontSize: 22, marginBottom: 16 }}>Akses Admin i Fshehtë</h2>
        <p style={{ color: "#16a34a", marginBottom: 16 }}>Akses i autorizuar! Tani mund të menaxhosh emailet, rolet dhe reset password.</p>
        <AdminAccessPanel email={email} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24, background: "#f8fafc", borderRadius: 8 }}>
      <h2 style={{ fontWeight: 600, fontSize: 22, marginBottom: 16 }}>Akses Admin i Fshehtë</h2>
      <form onSubmit={handleVerify}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 500 }}>Linku i fshehtë</label>
          <input
            type="text"
            value={link}
            onChange={e => setLink(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #cbd5e1", marginTop: 4 }}
            placeholder="Vendos linkun e fshehtë"
            autoComplete="off"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 500 }}>Email admin</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #cbd5e1", marginTop: 4 }}
            placeholder="Vendos emailin admin"
            autoComplete="off"
          />
        </div>
        {error && <div style={{ color: "#dc2626", marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={{ background: "#2563eb", color: "#fff", padding: "8px 20px", border: "none", borderRadius: 4, fontWeight: 600 }}>
          Verifiko
        </button>
      </form>
    </div>
  );
}
