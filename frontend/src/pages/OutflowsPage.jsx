import { useState, useEffect } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Plus, Search, Pencil, Trash2, TrendingDown, Download } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORIES = [
  { value: "furnizime", label: "Furnizime Dentare" },
  { value: "qira", label: "Qira" },
  { value: "paga", label: "Paga" },
  { value: "operative", label: "Shpenzime Operative" },
  { value: "tjeter", label: "Tjetër" }
];

export default function OutflowsPage({ user, setUser }) {
  const [outflows, setOutflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOutflow, setSelectedOutflow] = useState(null);
  const [exportFormat, setExportFormat] = useState("excel");
  const [formData, setFormData] = useState({
    kategoria: "furnizime",
    pershkrimi: "",
    shuma: "",
    valuta: "MKD"
  });

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/outflows`);
      setOutflows(response.data);
    } catch (error) {
      toast.error("Gabim në marrjen e të dhënave");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, shuma: parseFloat(formData.shuma) };
      if (selectedOutflow) {
        await axios.put(`${API}/outflows/${selectedOutflow.outflow_id}`, data);
        toast.success("Dalja u përditësua me sukses");
      } else {
        await axios.post(`${API}/outflows`, data);
        toast.success("Dalja u regjistrua me sukses");
      }
      setDialogOpen(false);
      setSelectedOutflow(null);
      setFormData({ kategoria: "furnizime", pershkrimi: "", shuma: "", valuta: "MKD" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në ruajtjen e daljes");
    }
  };

  const handleEdit = (outflow) => {
    setSelectedOutflow(outflow);
    setFormData({
      kategoria: outflow.kategoria,
      pershkrimi: outflow.pershkrimi,
      shuma: outflow.shuma.toString(),
      valuta: outflow.valuta
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/outflows/${selectedOutflow.outflow_id}`);
      toast.success("Dalja u fshi me sukses");
      setDeleteDialogOpen(false);
      setSelectedOutflow(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në fshirjen e daljes");
    }
  };

  const handleExport = async (format = 'excel') => {
    try {
      const endpoint = format === 'pdf' ? 'pdf' : 'excel';
      const response = await axios.get(`${API}/export/${endpoint}?type=outflows`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", format === 'pdf' ? "daljet_export.pdf" : "daljet_export.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Eksporti u krye me sukses");
    } catch (error) {
      toast.error("Gabim në eksportim");
    }
  };

  const getCategoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat;

  const filteredOutflows = outflows.filter(out =>
    out.pershkrimi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryLabel(out.kategoria).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMKD = filteredOutflows.filter(o => o.valuta === "MKD").reduce((sum, o) => sum + o.shuma, 0);
  const totalEUR = filteredOutflows.filter(o => o.valuta === "EUR").reduce((sum, o) => sum + o.shuma, 0);

  return (
    <PageLayout user={user} setUser={setUser} isAdmin>
      <div data-testid="outflows-page" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Daljet e Parave</h1>
            <p className="text-slate-500 mt-1">
              Total: <span className="font-bold text-red-600">{totalMKD.toLocaleString()} MKD</span>
              {totalEUR > 0 && <span className="ml-2 font-bold text-red-600">+ {totalEUR.toLocaleString()} EUR</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-32" aria-label="Zgjidh formatin e eksportit">
                <SelectValue placeholder="Formati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExport(exportFormat)} data-testid="export-outflows-btn">
              <Download className="w-4 h-4 mr-2" />
              Shkarko
            </Button>
            <Button onClick={() => { setSelectedOutflow(null); setFormData({ kategoria: "furnizime", pershkrimi: "", shuma: "", valuta: "MKD" }); setDialogOpen(true); }} data-testid="add-outflow-btn">
              <Plus className="w-4 h-4 mr-2" />
              Regjistro Dalje
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Kërko dalje..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" data-testid="search-outflows" />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredOutflows.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Data</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead>Përshkrimi</TableHead>
                    <TableHead className="text-right">Shuma</TableHead>
                    <TableHead className="text-right">Veprimet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOutflows.map((outflow) => (
                    <TableRow key={outflow.outflow_id} className="table-row" data-testid={`outflow-row-${outflow.outflow_id}`}>
                      <TableCell>
                        <span className="text-sm text-slate-600">{new Date(outflow.data).toLocaleDateString("sq-AL")}</span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {getCategoryLabel(outflow.kategoria)}
                        </span>
                      </TableCell>
                      <TableCell><span className="text-sm text-slate-600">{outflow.pershkrimi}</span></TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-red-600">
                          -{outflow.shuma.toLocaleString()} 
                          <span className={`ml-1 ${outflow.valuta === "EUR" ? "currency-eur" : "currency-mkd"} currency-badge`}>{outflow.valuta}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(outflow)} className="action-btn action-btn-edit" data-testid={`edit-outflow-${outflow.outflow_id}`}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedOutflow(outflow); setDeleteDialogOpen(true); }} className="action-btn action-btn-delete" data-testid={`delete-outflow-${outflow.outflow_id}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="empty-state">
                <TrendingDown className="empty-state-icon" />
                <p className="empty-state-text">Nuk ka dalje të regjistruara</p>
                <Button onClick={() => setDialogOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Regjistro Daljen e Parë
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md bg-slate-50">
            <DialogHeader>
              <DialogTitle className="text-slate-900">{selectedOutflow ? "Ndrysho Daljen" : "Regjistro Dalje të Re"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <Label>Kategoria *</Label>
                <Select value={formData.kategoria} onValueChange={(value) => setFormData({ ...formData, kategoria: value })}>
                  <SelectTrigger data-testid="outflow-kategoria-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <Label>Shuma *</Label>
                  <Input type="number" step="0.01" value={formData.shuma} onChange={(e) => setFormData({ ...formData, shuma: e.target.value })} required data-testid="outflow-shuma-input" />
                </div>
                <div className="form-group">
                  <Label>Valuta</Label>
                  <Select value={formData.valuta} onValueChange={(value) => setFormData({ ...formData, valuta: value })}>
                    <SelectTrigger data-testid="outflow-valuta-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MKD">MKD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="form-group">
                <Label>Përshkrimi *</Label>
                <Textarea value={formData.pershkrimi} onChange={(e) => setFormData({ ...formData, pershkrimi: e.target.value })} required rows={3} data-testid="outflow-pershkrimi-input" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Anulo</Button>
                <Button type="submit" data-testid="save-outflow-btn">{selectedOutflow ? "Ruaj Ndryshimet" : "Regjistro Daljen"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md bg-slate-50">
            <DialogHeader><DialogTitle className="text-slate-900">Konfirmo Fshirjen</DialogTitle></DialogHeader>
            <p className="text-slate-700 font-medium">Jeni të sigurt që doni të fshini këtë dalje?</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>Anulo</Button>
              <Button type="button" variant="destructive" onClick={handleDelete} data-testid="confirm-delete-outflow-btn">Fshi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
