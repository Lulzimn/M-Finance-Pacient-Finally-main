import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function AdminAccessPanel({ }) {
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [resetEmail, setResetEmail] = useState("");
  const [resetResult, setResetResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAllowedEmails = async () => {
    try {
      const res = await axios.get(`${API}/admin/allowed-emails`, { withCredentials: true });
      setAllowedEmails(res.data);
    } catch (err) {
      setError("Nuk mund të lexohen emailet e lejuara");
    }
  };

  useEffect(() => {
    fetchAllowedEmails();
    // eslint-disable-next-line
  }, []);

  const handleAddEmail = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post(`${API}/admin/allowed-emails`, { email: newEmail, role: newRole }, { withCredentials: true });
      setNewEmail("");
      setNewRole("staff");
      fetchAllowedEmails();
    } catch (err) {
      setError(err.response?.data?.detail || "Gabim në shtim");
    }
  };

  const handleDeleteEmail = async (email) => {
    setError("");
    try {
      await axios.delete(`${API}/admin/allowed-emails`, { data: { email }, withCredentials: true });
      fetchAllowedEmails();
    } catch (err) {
      setError(err.response?.data?.detail || "Gabim në fshirje");
    }
  };

  const handleUpdateRole = async (email, role) => {
    setError("");
    try {
      await axios.put(`${API}/admin/allowed-emails`, { email, role }, { withCredentials: true });
      fetchAllowedEmails();
    } catch (err) {
      setError(err.response?.data?.detail || "Gabim në ndryshim roli");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetResult("");
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: resetEmail });
      setResetResult("Email për reset password u dërgua!");
      setResetEmail("");
    } catch (err) {
      setError(err.response?.data?.detail || "Gabim në reset password");
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 10 }}>Menaxho Email & Role</h3>
      <form onSubmit={handleAddEmail} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email i ri" required style={{ flex: 2, padding: 6, borderRadius: 4, border: "1px solid #cbd5e1" }} />
        <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ flex: 1, padding: 6, borderRadius: 4 }}>
          <option value="staff">staff</option>
          <option value="admin">admin</option>
        </select>
        <button type="submit" style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, padding: "6px 16px", fontWeight: 600 }}>Shto</button>
      </form>
      <ul style={{ listStyle: "none", padding: 0, marginBottom: 16 }}>
        {allowedEmails.map(ae => (
          <li key={ae.email} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ flex: 2 }}>{ae.email}</span>
            <select value={ae.role} onChange={e => handleUpdateRole(ae.email, e.target.value)} style={{ flex: 1, padding: 4, borderRadius: 4 }}>
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
            <button onClick={() => handleDeleteEmail(ae.email)} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 4, padding: "4px 10px", fontWeight: 600 }}>Fshi</button>
          </li>
        ))}
      </ul>
      <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 10 }}>Reset Password</h3>
      <form onSubmit={handleResetPassword} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="Email për reset" required style={{ flex: 2, padding: 6, borderRadius: 4, border: "1px solid #cbd5e1" }} />
        <button type="submit" style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, padding: "6px 16px", fontWeight: 600 }} disabled={loading}>Reset</button>
      </form>
      {resetResult && <div style={{ color: "#16a34a", marginBottom: 8 }}>{resetResult}</div>}
      {error && <div style={{ color: "#dc2626", marginBottom: 8 }}>{error}</div>}
    </div>
  );
}
