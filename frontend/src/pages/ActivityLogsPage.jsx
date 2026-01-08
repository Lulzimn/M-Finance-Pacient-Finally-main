import { useState, useEffect } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Search, Activity, User, FileText, TrendingUp, TrendingDown, Settings } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ACTION_ICONS = {
  KRIJOI: <TrendingUp className="w-4 h-4 text-emerald-600" />,
  PËRDITËSOI: <Settings className="w-4 h-4 text-sky-600" />,
  FSHIU: <TrendingDown className="w-4 h-4 text-red-600" />,
  REGJISTRUAR: <User className="w-4 h-4 text-sky-600" />,
  NDRYSHOI_ROL: <User className="w-4 h-4 text-amber-600" />
};

const ENTITY_LABELS = {
  patient: "Pacient",
  invoice: "Faturë",
  inflow: "Hyrje",
  outflow: "Dalje",
  user: "Përdorues",
  exchange_rate: "Kurs Këmbimi"
};

export default function ActivityLogsPage({ user, setUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${API}/activity-logs?limit=200`);
        setLogs(response.data);
      } catch (error) {
        toast.error("Gabim në marrjen e aktiviteteve");
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log =>
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ENTITY_LABELS[log.entity_type]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout user={user} setUser={setUser} isAdmin>
      <div data-testid="activity-logs-page" className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Regjistri i Aktiviteteve</h1>
          <p className="text-slate-500 mt-1">Gjurmimi i të gjitha veprimeve në sistem</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Kërko aktivitete..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-logs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Data & Ora</TableHead>
                    <TableHead>Përdoruesi</TableHead>
                    <TableHead>Veprimi</TableHead>
                    <TableHead>Entiteti</TableHead>
                    <TableHead>Detajet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.log_id} className="table-row" data-testid={`log-row-${log.log_id}`}>
                      <TableCell>
                        <span className="text-sm text-slate-600 font-mono">
                          {new Date(log.timestamp).toLocaleString("sq-AL")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-900">{log.user_name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {ACTION_ICONS[log.action] || <Activity className="w-4 h-4 text-slate-400" />}
                          <span className={`text-sm font-medium ${
                            log.action === "KRIJOI" ? "text-emerald-600" :
                            log.action === "FSHIU" ? "text-red-600" :
                            "text-slate-600"
                          }`}>
                            {log.action}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {ENTITY_LABELS[log.entity_type] || log.entity_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">{log.details || "-"}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="empty-state">
                <Activity className="empty-state-icon" />
                <p className="empty-state-text">Nuk ka aktivitete të regjistruara</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
