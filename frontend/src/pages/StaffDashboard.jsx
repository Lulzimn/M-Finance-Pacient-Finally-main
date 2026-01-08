import { useState, useEffect } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, FileText, Clock, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function StaffDashboard({ user, setUser }) {
  const [patients, setPatients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, invoicesRes] = await Promise.all([
          axios.get(`${API}/patients`),
          axios.get(`${API}/invoices`)
        ]);
        setPatients(patientsRes.data);
        setInvoices(invoicesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const pendingInvoices = invoices.filter(inv => inv.statusi === "pending");
  const recentPatients = patients.slice(-5).reverse();

  if (loading) {
    return (
      <PageLayout user={user} setUser={setUser} isAdmin={false}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user} setUser={setUser} isAdmin={false}>
      <div data-testid="staff-dashboard" className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Mirësevini, {user?.name}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="stat-card" data-testid="patients-count-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Pacientë Total</p>
                  <p className="stat-value mt-2 text-sky-600">{patients.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-sky-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card" data-testid="invoices-count-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Fatura Total</p>
                  <p className="stat-value mt-2 text-slate-900">{invoices.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card" data-testid="pending-invoices-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Fatura në Pritje</p>
                  <p className="stat-value mt-2 text-amber-600">{pendingInvoices.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Patients */}
          <Card data-testid="recent-patients">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Pacientët e Fundit</CardTitle>
              <Link to="/staff/patients">
                <Button variant="ghost" size="sm" className="text-sky-600">
                  Shiko të gjithë <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentPatients.length > 0 ? (
                <div className="space-y-3">
                  {recentPatients.map((patient) => (
                    <div 
                      key={patient.patient_id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                          <span className="text-sky-600 font-medium">
                            {patient.emri?.charAt(0)}{patient.mbiemri?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{patient.emri} {patient.mbiemri}</p>
                          <p className="text-sm text-slate-500">{patient.telefon || "Pa telefon"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  Nuk ka pacientë të regjistruar
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Invoices */}
          <Card data-testid="pending-invoices-list">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Fatura në Pritje</CardTitle>
              <Link to="/staff/invoices">
                <Button variant="ghost" size="sm" className="text-sky-600">
                  Shiko të gjitha <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pendingInvoices.length > 0 ? (
                <div className="space-y-3">
                  {pendingInvoices.slice(0, 5).map((invoice) => (
                    <div 
                      key={invoice.invoice_id}
                      className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{invoice.patient_name}</p>
                        <p className="text-sm text-slate-500">{invoice.pershkrimi}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-600">
                          {invoice.shuma.toLocaleString()} {invoice.valuta}
                        </p>
                        <span className="status-pending">Në pritje</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  Nuk ka fatura në pritje
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
