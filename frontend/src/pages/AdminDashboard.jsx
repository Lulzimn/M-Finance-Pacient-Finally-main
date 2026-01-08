import { useState, useEffect } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { TrendingUp, TrendingDown, Users, FileText, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ user, setUser }) {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("MKD");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, monthlyRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/reports/monthly`)
      ]);
      setStats(statsRes.data);
      setMonthlyData(monthlyRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount, curr = currency) => {
    return new Intl.NumberFormat("sq-AL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + " " + curr;
  };

  const getAmount = (mkd, eur) => {
    return currency === "MKD" ? mkd : eur;
  };

  if (loading || !stats) {
    return (
      <PageLayout user={user} setUser={setUser} isAdmin>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user} setUser={setUser} isAdmin>
      <div data-testid="admin-dashboard" className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Mirësevini, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Currency Toggle */}
            <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => setCurrency("MKD")}
                data-testid="currency-mkd-btn"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currency === "MKD" ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                MKD
              </button>
              <button
                onClick={() => setCurrency("EUR")}
                data-testid="currency-eur-btn"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currency === "EUR" ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                EUR
              </button>
            </div>
            <Button onClick={fetchData} variant="outline" size="icon" data-testid="refresh-btn">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Balance */}
          <Card className="stat-card" data-testid="balance-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Bilanci Total</p>
                  <p className={`stat-value mt-2 ${stats.balance_mkd >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatCurrency(getAmount(stats.balance_mkd, stats.balance_eur))}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stats.balance_mkd >= 0 ? "bg-emerald-100" : "bg-red-100"
                }`}>
                  {stats.balance_mkd >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Inflows */}
          <Card className="stat-card" data-testid="inflows-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Hyrjet Totale</p>
                  <p className="stat-value mt-2 text-emerald-600">
                    {formatCurrency(getAmount(stats.total_inflows_mkd, stats.total_inflows_eur))}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Sot: {formatCurrency(stats.today_inflows_mkd, "MKD")}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Outflows */}
          <Card className="stat-card" data-testid="outflows-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Daljet Totale</p>
                  <p className="stat-value mt-2 text-red-600">
                    {formatCurrency(getAmount(stats.total_outflows_mkd, stats.total_outflows_eur))}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Sot: {formatCurrency(stats.today_outflows_mkd, "MKD")}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="stat-card" data-testid="quick-stats-card">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Pacientë</span>
                  </div>
                  <span className="font-bold text-slate-900">{stats.patients_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Fatura në pritje</span>
                  </div>
                  <span className="font-bold text-amber-600">{stats.invoices_pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">EUR/MKD</span>
                  </div>
                  <span className="font-mono text-sm text-slate-600">{stats.exchange_rate}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert if high outflows */}
        {stats.today_outflows_mkd > stats.today_inflows_mkd && stats.today_outflows_mkd > 10000 && (
          <div className="alert-warning" data-testid="high-outflow-alert">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Paralajmërim: Shpenzime të larta</p>
              <p className="text-sm text-amber-700 mt-1">
                Daljet e sotme ({formatCurrency(stats.today_outflows_mkd, "MKD")}) janë më të larta se hyrjet.
              </p>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <Card data-testid="monthly-chart">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Trendi i Muajit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {monthlyData?.daily_data && monthlyData.daily_data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData.daily_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => val.split("-")[2]}
                        stroke="#94a3b8"
                        fontSize={12}
                      />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "white", 
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px"
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="inflows" 
                        stroke="#10b981" 
                        fill="#d1fae5" 
                        name="Hyrje"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="outflows" 
                        stroke="#ef4444" 
                        fill="#fee2e2" 
                        name="Dalje"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    Nuk ka të dhëna për këtë muaj
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card data-testid="category-chart">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Shpërndarja sipas Kategorisë</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {monthlyData?.inflows_by_category && Object.keys(monthlyData.inflows_by_category).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        ...Object.entries(monthlyData.inflows_by_category || {}).map(([name, value]) => ({
                          name: name === "pagesa_pacient" ? "Pagesa" : name === "sherbim_dentar" ? "Shërbime" : "Tjeter",
                          value,
                          type: "inflow"
                        })),
                        ...Object.entries(monthlyData.outflows_by_category || {}).map(([name, value]) => ({
                          name: name === "furnizime" ? "Furnizime" : name === "qira" ? "Qira" : name === "paga" ? "Paga" : "Operative",
                          value,
                          type: "outflow"
                        }))
                      ]}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                      <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "white", 
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px"
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#0284c7"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    Nuk ka të dhëna për kategoritë
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Summary */}
        <Card data-testid="monthly-summary">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Përmbledhje Mujore</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <p className="text-sm text-emerald-700 font-medium">Hyrje Muaji</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                  {formatCurrency(monthlyData?.total_inflows_mkd || 0, "MKD")}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <p className="text-sm text-red-700 font-medium">Dalje Muaji</p>
                <p className="text-2xl font-bold text-red-600 mt-1 font-mono">
                  {formatCurrency(monthlyData?.total_outflows_mkd || 0, "MKD")}
                </p>
              </div>
              <div className="text-center p-4 bg-sky-50 rounded-xl">
                <p className="text-sm text-sky-700 font-medium">Bilanci Muaji</p>
                <p className={`text-2xl font-bold mt-1 font-mono ${
                  (monthlyData?.balance_mkd || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  {formatCurrency(monthlyData?.balance_mkd || 0, "MKD")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
