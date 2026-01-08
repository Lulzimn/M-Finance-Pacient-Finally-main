import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MONTHS = [
  { value: "1", label: "Janar" },
  { value: "2", label: "Shkurt" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Prill" },
  { value: "5", label: "Maj" },
  { value: "6", label: "Qershor" },
  { value: "7", label: "Korrik" },
  { value: "8", label: "Gusht" },
  { value: "9", label: "Shtator" },
  { value: "10", label: "Tetor" },
  { value: "11", label: "Nëntor" },
  { value: "12", label: "Dhjetor" }
];

const COLORS = ["#0284c7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ReportsPage({ user, setUser }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reports/monthly?year=${year}&month=${month}`);
      setReport(response.data);
    } catch (error) {
      toast.error("Gabim në marrjen e raportit");
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async (format = 'excel') => {
    setExporting(true);
    try {
      const endpoint = format === 'pdf' ? 'pdf' : 'excel';
      const response = await axios.get(`${API}/export/${endpoint}?type=cashflow`, { 
        responseType: "blob",
        withCredentials: true 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `hyrje_dalje_export.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExportDialogOpen(false);
      toast.success("Eksporti u krye me sukses");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gabim në eksportim");
    } finally {
      setExporting(false);
    }
  };

  const inflowsPieData = report?.inflows_by_category ? Object.entries(report.inflows_by_category).map(([name, value]) => ({
    name: name === "pagesa_pacient" ? "Pagesa" : name === "sherbim_dentar" ? "Shërbime" : "Tjetër",
    value
  })) : [];

  const outflowsPieData = report?.outflows_by_category ? Object.entries(report.outflows_by_category).map(([name, value]) => ({
    name: name === "furnizime" ? "Furnizime" : name === "qira" ? "Qira" : name === "paga" ? "Paga" : name === "operative" ? "Operative" : "Tjetër",
    value
  })) : [];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <PageLayout user={user} setUser={setUser} isAdmin>
      <div data-testid="reports-page" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Raportet</h1>
            <p className="text-slate-500 mt-1">Analiza financiare e detajuar</p>
          </div>
          <Button onClick={() => setExportDialogOpen(true)} data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" />
            Shkarko Hyrje & Dalje
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Periudha:</span>
              </div>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-36" data-testid="month-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-28" data-testid="year-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="stat-card" data-testid="report-inflows-card">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-500">Hyrje Totale</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2 font-mono">
                    {(report?.total_inflows_mkd || 0).toLocaleString()} MKD
                  </p>
                </CardContent>
              </Card>
              <Card className="stat-card" data-testid="report-outflows-card">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-500">Dalje Totale</p>
                  <p className="text-3xl font-bold text-red-600 mt-2 font-mono">
                    {(report?.total_outflows_mkd || 0).toLocaleString()} MKD
                  </p>
                </CardContent>
              </Card>
              <Card className="stat-card" data-testid="report-balance-card">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-500">Bilanci</p>
                  <p className={`text-3xl font-bold mt-2 font-mono ${(report?.balance_mkd || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {(report?.balance_mkd || 0).toLocaleString()} MKD
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Daily Trend Chart */}
            <Card data-testid="daily-trend-chart">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Trendi Ditor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {report?.daily_data && report.daily_data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={report.daily_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tickFormatter={(val) => val.split("-")[2]} stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                        <Area type="monotone" dataKey="inflows" stroke="#10b981" fill="#d1fae5" name="Hyrje" />
                        <Area type="monotone" dataKey="outflows" stroke="#ef4444" fill="#fee2e2" name="Dalje" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      Nuk ka të dhëna për këtë periudhë
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="inflows-pie-chart">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-emerald-700">Hyrjet sipas Kategorisë</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {inflowsPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={inflowsPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {inflowsPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value.toLocaleString()} MKD`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        Nuk ka hyrje të regjistruara
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="outflows-pie-chart">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-red-700">Daljet sipas Kategorisë</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {outflowsPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={outflowsPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {outflowsPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value.toLocaleString()} MKD`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        Nuk ka dalje të regjistruara
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eksporto të Dhënat</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Zgjedh Formatin */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Zgjedh Formatin</Label>
              <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excel" id="excel" />
                  <Label htmlFor="excel" className="font-normal cursor-pointer">
                    Excel (.xlsx)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="font-normal cursor-pointer">
                    PDF (.pdf)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)} disabled={exporting}>
              Anulo
            </Button>
            <Button onClick={() => handleExport(exportFormat)} disabled={exporting}>
              {exporting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Duke sharkuar...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Shkarko
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
