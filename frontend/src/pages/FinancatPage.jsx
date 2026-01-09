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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Plus, Search, Pencil, Trash2, TrendingUp, TrendingDown, Download, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const INFLOW_CATEGORIES = [
  { value: "pagesa_pacient", label: "Pagesa nga Pacient" },
  { value: "sherbim_dentar", label: "Shërbim Dentar" },
  { value: "tjeter", label: "Tjetër" }
];

const OUTFLOW_CATEGORIES = [
  { value: "furnizime", label: "Furnizime Dentare" },
  { value: "qira", label: "Qira" },
  { value: "paga", label: "Paga" },
  { value: "operative", label: "Shpenzime Operative" },
  { value: "tjeter", label: "Tjetër" }
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "karte", label: "Kartë" },
  { value: "transfer", label: "Transfer Bankar" }
];

export default function FinancatPage({ user, setUser }) {
  const [inflows, setInflows] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [transactionType, setTransactionType] = useState("inflow"); // 'inflow' or 'outflow'
  
  const [formData, setFormData] = useState({
    kategoria: "",
    pershkrimi: "",
    shuma: "",
    valuta: "MKD",
    metoda_pageses: "cash",
    patient_id: ""
  });

  const fetchData = async () => {
    try {
      const [inflowsRes, outflowsRes, patientsRes] = await Promise.all([
        axios.get(`${API}/inflows`),
        axios.get(`${API}/outflows`),
        axios.get(`${API}/patients`)
      ]);
      setInflows(inflowsRes.data);
      setOutflows(outflowsRes.data);
      setPatients(patientsRes.data);
    } catch (error) {
      toast.error("Gabim në marrjen e të dhënave");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = (type = "inflow") => {
    setTransactionType(type);
    setFormData({
      kategoria: type === "inflow" ? "pagesa_pacient" : "furnizime",
      pershkrimi: "",
      shuma: "",
      valuta: "MKD",
      metoda_pageses: "cash",
      patient_id: ""
    });
    setSelectedItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, shuma: parseFloat(formData.shuma) };
      if (!data.patient_id) delete data.patient_id;
      if (transactionType === "outflow") delete data.metoda_pageses;
      if (transactionType === "outflow") delete data.patient_id;

      if (selectedItem) {
        // Update existing
        if (transactionType === "inflow") {
          await axios.put(`${API}/inflows/${selectedItem.inflow_id}`, data);
        } else {
          await axios.put(`${API}/outflows/${selectedItem.outflow_id}`, data);
        }
        toast.success(`${transactionType === "inflow" ? "Hyrja" : "Dalja"} u përditësua me sukses`);
      } else {
        // Create new
        if (transactionType === "inflow") {
          await axios.post(`${API}/inflows`, data);
        } else {
          await axios.post(`${API}/outflows`, data);
        }
        toast.success(`${transactionType === "inflow" ? "Hyrja" : "Dalja"} u regjistrua me sukses`);
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në ruajtjen e transaksionit");
    }
  };

  const handleEditInflow = (inflow) => {
    setSelectedItem(inflow);
    setTransactionType("inflow");
    setFormData({
      kategoria: inflow.kategoria,
      pershkrimi: inflow.pershkrimi,
      shuma: inflow.shuma.toString(),
      valuta: inflow.valuta,
      metoda_pageses: inflow.metoda_pageses || "cash",
      patient_id: inflow.patient_id || ""
    });
    setDialogOpen(true);
  };

  const handleEditOutflow = (outflow) => {
    setSelectedItem(outflow);
    setTransactionType("outflow");
    setFormData({
      kategoria: outflow.kategoria,
      pershkrimi: outflow.pershkrimi,
      shuma: outflow.shuma.toString(),
      valuta: outflow.valuta,
      metoda_pageses: "cash",
      patient_id: ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      if (selectedItem.inflow_id) {
        await axios.delete(`${API}/inflows/${selectedItem.inflow_id}`);
      } else {
        await axios.delete(`${API}/outflows/${selectedItem.outflow_id}`);
      }
      toast.success("Transaksioni u fshi me sukses");
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      toast.error("Gabim në fshirjen e transaksionit");
    }
  };

  const handleExport = async (type, format) => {
    try {
      const endpoint = format === 'pdf' ? 'pdf' : 'excel';
      const response = await axios.get(`${API}/export/${endpoint}?type=${type}`, { 
        responseType: "blob",
        withCredentials: true 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}_export.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Eksporti u krye me sukses");
    } catch (error) {
      toast.error("Gabim në eksportim");
    }
  };

  const getCategoryLabel = (cat, type) => {
    const categories = type === "inflow" ? INFLOW_CATEGORIES : OUTFLOW_CATEGORIES;
    return categories.find(c => c.value === cat)?.label || cat;
  };

  const getMethodLabel = (method) => PAYMENT_METHODS.find(m => m.value === method)?.label || method;

  // Combine and sort all transactions
  const allTransactions = [
    ...inflows.map(i => ({ ...i, type: "inflow", id: i.inflow_id, date: i.data })),
    ...outflows.map(o => ({ ...o, type: "outflow", id: o.outflow_id, date: o.data }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredTransactions = allTransactions.filter(t => {
    const matchesSearch = 
      t.pershkrimi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryLabel(t.kategoria, t.type).toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "inflows") return t.type === "inflow" && matchesSearch;
    if (activeTab === "outflows") return t.type === "outflow" && matchesSearch;
    return matchesSearch;
  });

  // Calculate totals
  const totalInflowsMKD = inflows.filter(i => i.valuta === "MKD").reduce((sum, i) => sum + i.shuma, 0);
  const totalInflowsEUR = inflows.filter(i => i.valuta === "EUR").reduce((sum, i) => sum + i.shuma, 0);
  const totalOutflowsMKD = outflows.filter(o => o.valuta === "MKD").reduce((sum, o) => sum + o.shuma, 0);
  const totalOutflowsEUR = outflows.filter(o => o.valuta === "EUR").reduce((sum, o) => sum + o.shuma, 0);
  const balanceMKD = totalInflowsMKD - totalOutflowsMKD;
  const balanceEUR = totalInflowsEUR - totalOutflowsEUR;

  return (
    <PageLayout user={user} setUser={setUser} isAdmin>
      <div data-testid="financat-page" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Financat</h1>
            <p className="text-slate-500 mt-1">Menaxhimi i hyrjeve dhe daljeve</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { resetForm("inflow"); setDialogOpen(true); }} data-testid="add-transaction-btn">
              <Plus className="w-4 h-4 mr-2" />
              Regjistro Transaksion
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Hyrje Totale</p>
                  <p className="text-2xl font-bold text-emerald-600">{totalInflowsMKD.toLocaleString()} MKD</p>
                  {totalInflowsEUR > 0 && <p className="text-sm text-emerald-500">+{totalInflowsEUR.toLocaleString()} EUR</p>}
                </div>
                <ArrowUpCircle className="w-10 h-10 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Dalje Totale</p>
                  <p className="text-2xl font-bold text-red-600">{totalOutflowsMKD.toLocaleString()} MKD</p>
                  {totalOutflowsEUR > 0 && <p className="text-sm text-red-500">+{totalOutflowsEUR.toLocaleString()} EUR</p>}
                </div>
                <ArrowDownCircle className="w-10 h-10 text-red-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={`border-l-4 ${balanceMKD >= 0 ? 'border-l-sky-500' : 'border-l-amber-500'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Bilanci</p>
                  <p className={`text-2xl font-bold ${balanceMKD >= 0 ? 'text-sky-600' : 'text-amber-600'}`}>
                    {balanceMKD.toLocaleString()} MKD
                  </p>
                  {(balanceEUR !== 0) && <p className={`text-sm ${balanceEUR >= 0 ? 'text-sky-500' : 'text-amber-500'}`}>{balanceEUR >= 0 ? '+' : ''}{balanceEUR.toLocaleString()} EUR</p>}
                </div>
                <Wallet className="w-10 h-10 text-slate-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Kërko transaksione..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="all">Të Gjitha</TabsTrigger>
                  <TabsTrigger value="inflows" className="text-emerald-600">Hyrje</TabsTrigger>
                  <TabsTrigger value="outflows" className="text-red-600">Dalje</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Tipi</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead>Përshkrimi</TableHead>
                    <TableHead className="text-right">Shuma</TableHead>
                    <TableHead className="text-right">Veprimet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((t) => (
                    <TableRow key={t.id} className="table-row">
                      <TableCell>
                        {t.type === "inflow" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <TrendingUp className="w-4 h-4" /> Hyrje
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <TrendingDown className="w-4 h-4" /> Dalje
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{new Date(t.date).toLocaleDateString("sq-AL")}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === "inflow" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {getCategoryLabel(t.kategoria, t.type)}
                        </span>
                      </TableCell>
                      <TableCell><span className="text-sm text-slate-600">{t.pershkrimi}</span></TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${t.type === "inflow" ? "text-emerald-600" : "text-red-600"}`}>
                          {t.type === "inflow" ? "+" : "-"}{t.shuma.toLocaleString()} {t.valuta}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => t.type === "inflow" ? handleEditInflow(t) : handleEditOutflow(t)} 
                            className="action-btn action-btn-edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setSelectedItem(t); setDeleteDialogOpen(true); }} 
                            className="action-btn action-btn-delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="empty-state py-12">
                <Wallet className="empty-state-icon" />
                <p className="empty-state-text">Nuk ka transaksione të regjistruara</p>
                <Button onClick={() => { resetForm("inflow"); setDialogOpen(true); }} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Regjistro Transaksionin e Parë
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg bg-slate-50">
            <DialogHeader>
              <DialogTitle>{selectedItem ? "Ndrysho Transaksionin" : "Regjistro Transaksion të Ri"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Transaction Type Selector */}
              <div className="form-group">
                <Label>Lloji i Transaksionit *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionType("inflow");
                      setFormData({ ...formData, kategoria: "pagesa_pacient" });
                    }}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      transactionType === "inflow" 
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <TrendingUp className={`w-6 h-6 ${transactionType === "inflow" ? "text-emerald-600" : "text-slate-400"}`} />
                    <span className="font-medium">Hyrje (Para brenda)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionType("outflow");
                      setFormData({ ...formData, kategoria: "furnizime" });
                    }}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      transactionType === "outflow" 
                        ? "border-red-500 bg-red-50 text-red-700" 
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <TrendingDown className={`w-6 h-6 ${transactionType === "outflow" ? "text-red-600" : "text-slate-400"}`} />
                    <span className="font-medium">Dalje (Para jashtë)</span>
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="form-group">
                <Label>Kategoria *</Label>
                <Select value={formData.kategoria} onValueChange={(value) => setFormData({ ...formData, kategoria: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(transactionType === "inflow" ? INFLOW_CATEGORIES : OUTFLOW_CATEGORIES).map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount and Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <Label>Shuma *</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={formData.shuma} 
                    onChange={(e) => setFormData({ ...formData, shuma: e.target.value })} 
                    required 
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <Label>Valuta</Label>
                  <Select value={formData.valuta} onValueChange={(value) => setFormData({ ...formData, valuta: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MKD">MKD (Denar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment Method (Inflows only) */}
              {transactionType === "inflow" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <Label>Metoda Pageses</Label>
                    <Select value={formData.metoda_pageses} onValueChange={(value) => setFormData({ ...formData, metoda_pageses: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="form-group">
                    <Label>Pacienti (Opsional)</Label>
                    <Select value={formData.patient_id || "none"} onValueChange={(value) => setFormData({ ...formData, patient_id: value === "none" ? "" : value })}>
                      <SelectTrigger><SelectValue placeholder="Zgjidh" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Asnjë</SelectItem>
                        {patients.map(p => <SelectItem key={p.patient_id} value={p.patient_id}>{p.emri} {p.mbiemri}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="form-group">
                <Label>Përshkrimi *</Label>
                <Textarea 
                  value={formData.pershkrimi} 
                  onChange={(e) => setFormData({ ...formData, pershkrimi: e.target.value })} 
                  required 
                  rows={2}
                  placeholder={transactionType === "inflow" ? "p.sh. Pagesa për pastrim dhëmbësh" : "p.sh. Blerje materialet dentare"}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Anulo</Button>
                <Button 
                  type="submit" 
                  className={transactionType === "inflow" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
                >
                  {selectedItem ? "Ruaj Ndryshimet" : (transactionType === "inflow" ? "Regjistro Hyrjen" : "Regjistro Daljen")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md bg-slate-50">
            <DialogHeader><DialogTitle>Konfirmo Fshirjen</DialogTitle></DialogHeader>
            <p className="text-slate-600">Jeni të sigurt që doni të fshini këtë transaksion?</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>Anulo</Button>
              <Button type="button" variant="destructive" onClick={handleDelete}>Fshi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
