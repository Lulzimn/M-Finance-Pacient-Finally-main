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
import { Plus, Search, Pencil, Trash2, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORIES = [
  { value: "pagesa_pacient", label: "Pagesa nga Pacient" },
  { value: "sherbim_dentar", label: "Shërbim Dentar" },
  { value: "tjeter", label: "Tjetër" }
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "karte", label: "Kartë" },
  { value: "transfer", label: "Transfer Bankar" }
];

export default function InflowsPage({ user, setUser }) {
  const [inflows, setInflows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInflow, setSelectedInflow] = useState(null);
  const [exportFormat, setExportFormat] = useState("excel");
  const [formData, setFormData] = useState({
    kategoria: "pagesa_pacient",
    pershkrimi: "",
    shuma: "",
    valuta: "MKD",
    metoda_pageses: "cash",
    patient_id: "",
    invoice_id: ""
  });

  const fetchData = async () => {
    try {
      const [inflowsRes, patientsRes, invoicesRes] = await Promise.all([
        axios.get(`${API}/inflows`),
        axios.get(`${API}/patients`),
        axios.get(`${API}/invoices`)
      ]);
      setInflows(inflowsRes.data);
      setPatients(patientsRes.data);
      setInvoices(invoicesRes.data.filter(inv => inv.statusi === "pending"));
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
      if (!data.patient_id) delete data.patient_id;
      if (!data.invoice_id) delete data.invoice_id;
      
      if (selectedInflow) {
        await axios.put(`${API}/inflows/${selectedInflow.inflow_id}`, data);
        toast.success("Hyrja u përditësua me sukses");
      } else {
        await axios.post(`${API}/inflows`, data);
        toast.success("Hyrja u regjistrua me sukses");
      }
      setDialogOpen(false);
      setSelectedInflow(null);
      setFormData({ kategoria: "pagesa_pacient", pershkrimi: "", shuma: "", valuta: "MKD", metoda_pageses: "cash", patient_id: "", invoice_id: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në ruajtjen e hyrjes");
    }
  };

  const handleEdit = (inflow) => {
    setSelectedInflow(inflow);
    setFormData({
      kategoria: inflow.kategoria,
      pershkrimi: inflow.pershkrimi,
      shuma: inflow.shuma.toString(),
      valuta: inflow.valuta,
      metoda_pageses: inflow.metoda_pageses,
      patient_id: inflow.patient_id || "",
      invoice_id: inflow.invoice_id || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/inflows/${selectedInflow.inflow_id}`);
      toast.success("Hyrja u fshi me sukses");
      setDeleteDialogOpen(false);
      setSelectedInflow(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në fshirjen e hyrjes");
    }
  };

  const handleExport = async (format = 'excel') => {
    try {
      const endpoint = format === 'pdf' ? 'pdf' : 'excel';
      const response = await axios.get(`${API}/export/${endpoint}?type=inflows`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", format === 'pdf' ? "hyrjet_export.pdf" : "hyrjet_export.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Eksporti u krye me sukses");
    } catch (error) {
      toast.error("Gabim në eksportim");
    }
  };

  const getCategoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat;
  const getMethodLabel = (method) => PAYMENT_METHODS.find(m => m.value === method)?.label || method;

  const filteredInflows = inflows.filter(inf =>
    inf.pershkrimi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryLabel(inf.kategoria).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMKD = filteredInflows.filter(i => i.valuta === "MKD").reduce((sum, i) => sum + i.shuma, 0);
  const totalEUR = filteredInflows.filter(i => i.valuta === "EUR").reduce((sum, i) => sum + i.shuma, 0);

  return (
    <PageLayout user={user} setUser={setUser} isAdmin>
      <div data-testid="inflows-page" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Hyrjet e Parave</h1>
            <p className="text-slate-500 mt-1">
              Total: <span className="font-bold text-emerald-600">{totalMKD.toLocaleString()} MKD</span>
              {totalEUR > 0 && <span className="ml-2 font-bold text-emerald-600">+ {totalEUR.toLocaleString()} EUR</span>}
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
            <Button variant="outline" onClick={() => handleExport(exportFormat)} data-testid="export-inflows-btn">
              <Download className="w-4 h-4 mr-2" />
              Shkarko
            </Button>
            <Button onClick={() => { setSelectedInflow(null); setFormData({ kategoria: "pagesa_pacient", pershkrimi: "", shuma: "", valuta: "MKD", metoda_pageses: "cash", patient_id: "", invoice_id: "" }); setDialogOpen(true); }} data-testid="add-inflow-btn">
              <Plus className="w-4 h-4 mr-2" />
              Regjistro Hyrje
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Kërko hyrje..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" data-testid="search-inflows" />
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
            ) : filteredInflows.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Data</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead>Përshkrimi</TableHead>
                    <TableHead>Metoda</TableHead>
                    <TableHead className="text-right">Shuma</TableHead>
                    <TableHead className="text-right">Veprimet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInflows.map((inflow) => (
                    <TableRow key={inflow.inflow_id} className="table-row" data-testid={`inflow-row-${inflow.inflow_id}`}>
                      <TableCell>
                        <span className="text-sm text-slate-600">{new Date(inflow.data).toLocaleDateString("sq-AL")}</span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          {getCategoryLabel(inflow.kategoria)}
                        </span>
                      </TableCell>
                      <TableCell><span className="text-sm text-slate-600">{inflow.pershkrimi}</span></TableCell>
                      <TableCell><span className="text-sm text-slate-500">{getMethodLabel(inflow.metoda_pageses)}</span></TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-emerald-600">
                          +{inflow.shuma.toLocaleString()} 
                          <span className={`ml-1 ${inflow.valuta === "EUR" ? "currency-eur" : "currency-mkd"} currency-badge`}>{inflow.valuta}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(inflow)} className="action-btn action-btn-edit" data-testid={`edit-inflow-${inflow.inflow_id}`}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedInflow(inflow); setDeleteDialogOpen(true); }} className="action-btn action-btn-delete" data-testid={`delete-inflow-${inflow.inflow_id}`}>
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
                <TrendingUp className="empty-state-icon" />
                <p className="empty-state-text">Nuk ka hyrje të regjistruara</p>
                <Button onClick={() => setDialogOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Regjistro Hyrjen e Parë
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedInflow ? "Ndrysho Hyrjen" : "Regjistro Hyrje të Re"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <Label>Kategoria *</Label>
                  <Select value={formData.kategoria} onValueChange={(value) => setFormData({ ...formData, kategoria: value })}>
                    <SelectTrigger data-testid="inflow-kategoria-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-group">
                  <Label>Metoda Pageses</Label>
                  <Select value={formData.metoda_pageses} onValueChange={(value) => setFormData({ ...formData, metoda_pageses: value })}>
                    <SelectTrigger data-testid="inflow-metoda-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <Label>Shuma *</Label>
                  <Input type="number" step="0.01" value={formData.shuma} onChange={(e) => setFormData({ ...formData, shuma: e.target.value })} required data-testid="inflow-shuma-input" />
                </div>
                <div className="form-group">
                  <Label>Valuta</Label>
                  <Select value={formData.valuta} onValueChange={(value) => setFormData({ ...formData, valuta: value })}>
                    <SelectTrigger data-testid="inflow-valuta-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MKD">MKD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="form-group">
                <Label>Pacienti (Opsional)</Label>
                <Select value={formData.patient_id} onValueChange={(value) => setFormData({ ...formData, patient_id: value })}>
                  <SelectTrigger data-testid="inflow-patient-select"><SelectValue placeholder="Zgjidh pacientin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Asnjë</SelectItem>
                    {patients.map(p => <SelectItem key={p.patient_id} value={p.patient_id}>{p.emri} {p.mbiemri}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label>Fatura (Opsional)</Label>
                <Select value={formData.invoice_id} onValueChange={(value) => setFormData({ ...formData, invoice_id: value })}>
                  <SelectTrigger data-testid="inflow-invoice-select"><SelectValue placeholder="Lidh me faturë" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Asnjë</SelectItem>
                    {invoices.map(inv => <SelectItem key={inv.invoice_id} value={inv.invoice_id}>{inv.patient_name} - {inv.shuma} {inv.valuta}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <Label>Përshkrimi *</Label>
                <Textarea value={formData.pershkrimi} onChange={(e) => setFormData({ ...formData, pershkrimi: e.target.value })} required rows={3} data-testid="inflow-pershkrimi-input" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Anulo</Button>
                <Button type="submit" data-testid="save-inflow-btn">{selectedInflow ? "Ruaj Ndryshimet" : "Regjistro Hyrjen"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Konfirmo Fshirjen</DialogTitle></DialogHeader>
            <p className="text-slate-600">Jeni të sigurt që doni të fshini këtë hyrje?</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>Anulo</Button>
              <Button type="button" variant="destructive" onClick={handleDelete} data-testid="confirm-delete-inflow-btn">Fshi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
