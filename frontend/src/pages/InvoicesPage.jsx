import { useState, useEffect, useRef } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Plus, Search, Pencil, Trash2, FileText, Printer, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = "https://i.ibb.co/G3Bkww3q/63-C124-A8-2-AE7-4-F0-A-BB53-C2-E63-E1954-E0.png";

const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
};

const translations = {
  sq: {
    invoice: 'FATURË',
    clinicSubtitle: 'Klinikë Dentare',
    taxNumber: 'Nr. Tatimor',
    date: 'Data',
    dueDate: 'Afati',
    billedTo: 'FATURUAR PËR',
    description: 'Përshkrimi',
    quantity: 'Sasia',
    price: 'Çmimi',
    total: 'Total',
    subtotal: 'Nëntotali',
    tax: 'Tatimi',
    notes: 'SHËNIME',
    thankYou: 'Faleminderit për besimin tuaj!',
    stamp: 'Vula',
    signature: 'Nënshkrimi',
  },
  en: {
    invoice: 'INVOICE',
    clinicSubtitle: 'Dental Clinic',
    taxNumber: 'Tax No.',
    date: 'Date',
    dueDate: 'Due Date',
    billedTo: 'BILLED TO',
    description: 'Description',
    quantity: 'Qty',
    price: 'Price',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax',
    notes: 'NOTES',
    thankYou: 'Thank you for your trust!',
    stamp: 'Stamp',
    signature: 'Signature',
  },
  de: {
    invoice: 'RECHNUNG',
    clinicSubtitle: 'Zahnklinik',
    taxNumber: 'Steuernr.',
    date: 'Datum',
    dueDate: 'Fälligkeitsdatum',
    billedTo: 'RECHNUNG AN',
    description: 'Beschreibung',
    quantity: 'Menge',
    price: 'Preis',
    total: 'Gesamt',
    subtotal: 'Zwischensumme',
    tax: 'Steuer',
    notes: 'ANMERKUNGEN',
    thankYou: 'Vielen Dank für Ihr Vertrauen!',
    stamp: 'Stempel',
    signature: 'Unterschrift',
  }
};

export default function InvoicesPage({ user, setUser, isStaff = false }) {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(61.5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewClinic, setPreviewClinic] = useState(null);
  const [previewPatient, setPreviewPatient] = useState(null);
  const [previewLang, setPreviewLang] = useState("sq");
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientList, setShowPatientList] = useState(false);
  
  const [formData, setFormData] = useState({
    invoice_number: "",
    patient_id: "",
    valuta: "MKD",
    statusi: "draft",
    issue_date: new Date().toISOString().split('T')[0],
    due_date: "",
    tax_rate: 18,
    notes: "",
    items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }]
  });

  const fetchData = async () => {
    try {
      const [invoicesRes, patientsRes, rateRes] = await Promise.all([
        axios.get(`${API}/invoices`),
        axios.get(`${API}/patients`),
        axios.get(`${API}/exchange-rate`)
      ]);
      setInvoices(invoicesRes.data);
      setPatients(patientsRes.data);
      setExchangeRate(rateRes.data?.eur_to_mkd || 61.5);
    } catch (error) {
      toast.error("Gabim në marrjen e të dhënave");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      invoice_number: generateInvoiceNumber(),
      patient_id: "",
      valuta: "MKD",
      statusi: "draft",
      issue_date: new Date().toISOString().split('T')[0],
      due_date: "",
      tax_rate: 18,
      notes: "",
      items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }]
    });
    setPatientSearch("");
  };

  const handlePatientSelect = (patient) => {
    setFormData({ ...formData, patient_id: patient.patient_id });
    setPatientSearch(`${patient.emri} ${patient.mbiemri}`);
    setShowPatientList(false);
  };

  const filteredPatients = patients.filter(p => {
    if (!patientSearch) return true;
    const search = patientSearch.toLowerCase();
    return `${p.emri} ${p.mbiemri}`.toLowerCase().includes(search) ||
           p.telefon?.includes(search) ||
           p.email?.toLowerCase().includes(search);
  });

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
    }
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unit_price: 0, total: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxAmount = subtotal * (formData.tax_rate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) {
      toast.error("Ju lutem zgjidhni pacientin");
      return;
    }
    setSaving(true);
    try {
      const { subtotal, taxAmount, total } = calculateTotals();
      const data = {
        ...formData,
        subtotal,
        tax_amount: taxAmount,
        total_amount: total
      };

      if (selectedInvoice) {
        await axios.put(`${API}/invoices/${selectedInvoice.invoice_id}`, data);
        toast.success("Fatura u përditësua me sukses");
      } else {
        await axios.post(`${API}/invoices`, data);
        toast.success("Fatura u krijua me sukses");
      }
      setDialogOpen(false);
      setSelectedInvoice(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në ruajtjen e faturës");
    }
    setSaving(false);
  };

  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    const patient = patients.find(p => p.patient_id === invoice.patient_id);
    setPatientSearch(patient ? `${patient.emri} ${patient.mbiemri}` : invoice.patient_name || "");
    setFormData({
      invoice_number: invoice.invoice_number || "",
      patient_id: invoice.patient_id || "",
      valuta: invoice.valuta || "MKD",
      statusi: invoice.statusi || "draft",
      issue_date: invoice.issue_date || new Date().toISOString().split('T')[0],
      due_date: invoice.due_date || "",
      tax_rate: invoice.tax_rate ?? 18,
      notes: invoice.notes || "",
      items: invoice.items?.length > 0 ? invoice.items : [{ description: "", quantity: 1, unit_price: 0, total: 0 }]
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/invoices/${selectedInvoice.invoice_id}`);
      toast.success("Fatura u fshi me sukses");
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në fshirjen e faturës");
    }
  };

  // Fetch invoice print data (with clinic info) for preview/print
  const handlePreview = async (invoice) => {
    try {
      const res = await axios.get(`${API}/invoices/${invoice.invoice_id}/print`);
      setPreviewInvoice(res.data.invoice);
      setPreviewClinic(res.data.clinic);
      setPreviewPatient(res.data.patient);
      setPreviewOpen(true);
    } catch (err) {
      toast.error("Nuk u hap dot fatura për printim");
    }
  };

  const handlePrint = () => {
    if (!previewInvoice || !previewClinic) return;
    const t = translations[previewLang];
    const displayCurrency = previewLang === 'de' || previewLang === 'en' ? 'EUR' : previewInvoice.valuta;
    const convertAmount = (amount) => {
      if (previewInvoice.valuta === displayCurrency) return amount;
      if (previewInvoice.valuta === 'MKD' && displayCurrency === 'EUR') return amount / (previewInvoice.exchange_rate || exchangeRate);
      if (previewInvoice.valuta === 'EUR' && displayCurrency === 'MKD') return amount * (previewInvoice.exchange_rate || exchangeRate);
      return amount;
    };
    const patientName = previewPatient ? `${previewPatient.emri} ${previewPatient.mbiemri}` : previewInvoice.patient_name || '-';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t.invoice} ${previewInvoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #0284c7; }
            .logo { height: 60px; }
            .company-info { margin-top: 12px; }
            .company-name { font-size: 24px; font-weight: bold; color: #0f172a; }
            .company-subtitle { font-size: 14px; color: #64748b; }
            .company-meta { font-size: 13px; color: #64748b; margin-top: 2px; }
            .invoice-title { text-align: right; }
            .invoice-title h1 { font-size: 36px; color: #cbd5e1; font-weight: bold; }
            .invoice-number { font-size: 16px; font-weight: 600; margin-top: 8px; }
            .invoice-dates { font-size: 14px; color: #64748b; margin-top: 8px; }
            .patient-section { margin-bottom: 32px; padding: 20px; background: #f8fafc; border-radius: 8px; }
            .patient-label { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px; text-transform: uppercase; }
            .patient-name { font-size: 18px; font-weight: 600; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
            thead { background: #f8fafc; }
            th { padding: 14px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
            th:last-child { text-align: right; }
            td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; }
            td:last-child { text-align: right; font-weight: 500; }
            .totals { display: flex; justify-content: flex-end; }
            .totals-box { width: 280px; }
            .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; }
            .totals-row.total { font-size: 20px; font-weight: bold; padding-top: 16px; border-top: 2px solid #0f172a; margin-top: 8px; }
            .notes-section { margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px; }
            .notes-label { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px; text-transform: uppercase; }
            .signature-section { margin-top: 60px; }
            .signature-line { width: 200px; height: 60px; border-bottom: 1px solid #64748b; }
            .signature-label { font-size: 12px; color: #64748b; margin-top: 8px; }
            .footer { margin-top: 60px; text-align: center; font-size: 14px; color: #94a3b8; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            @media print { body { padding: 20px; } @page { margin: 1cm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <img src="${LOGO_URL}" alt="M-Dental" class="logo" />
              <div class="company-info">
                <div class="company-name">${previewClinic.name}</div>
                <div class="company-subtitle">${t.clinicSubtitle}</div>
                <div class="company-meta">${t.taxNumber}: ${previewClinic.business_number || '-'}</div>
                <div class="company-meta">${previewClinic.address}</div>
                <div class="company-meta">${previewClinic.phone} | ${previewClinic.email}</div>
              </div>
            </div>
            <div class="invoice-title">
              <h1>${t.invoice}</h1>
              <div class="invoice-number">${previewInvoice.invoice_number}</div>
              <div class="invoice-dates">
                ${t.date}: ${previewInvoice.issue_date || '-'}
                ${previewInvoice.due_date ? `<br>${t.dueDate}: ${previewInvoice.due_date}` : ''}
              </div>
            </div>
          </div>

          <div class="patient-section">
            <div class="patient-label">${t.billedTo}</div>
            <div class="patient-name">${patientName}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${t.description}</th>
                <th style="text-align:center">${t.quantity}</th>
                <th style="text-align:right">${t.price}</th>
                <th>${t.total}</th>
              </tr>
            </thead>
            <tbody>
              ${(previewInvoice.items || []).map(item => `
                <tr>
                  <td>${item.description || '-'}</td>
                  <td style="text-align:center">${item.quantity || 0}</td>
                  <td style="text-align:right">${convertAmount(item.unit_price || 0).toLocaleString()} ${displayCurrency}</td>
                  <td>${convertAmount(item.total || 0).toLocaleString()} ${displayCurrency}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-box">
              <div class="totals-row">
                <span>${t.subtotal}:</span>
                <span>${convertAmount(previewInvoice.subtotal || 0).toLocaleString()} ${displayCurrency}</span>
              </div>
              <div class="totals-row">
                <span>${t.tax} (${previewInvoice.tax_rate || 0}%):</span>
                <span>${convertAmount(previewInvoice.tax_amount || 0).toLocaleString()} ${displayCurrency}</span>
              </div>
              <div class="totals-row total">
                <span>${t.total.toUpperCase()}:</span>
                <span>${convertAmount(previewInvoice.total_amount || 0).toLocaleString()} ${displayCurrency}</span>
              </div>
            </div>
          </div>

          ${previewInvoice.notes ? `
            <div class="notes-section">
              <div class="notes-label">${t.notes}</div>
              <div>${previewInvoice.notes}</div>
            </div>
          ` : ''}

          <div class="signature-section">
            <div class="signature-line"></div>
            <div class="signature-label">${t.stamp} / ${t.signature}</div>
          </div>

          <div class="footer">
            <div>${t.thankYou}</div>
            <div style="margin-top:8px">${previewClinic.name}</div>
          </div>

          <script>setTimeout(() => window.print(), 300);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: "Draft", class: "bg-slate-100 text-slate-700" },
      sent: { label: "Dërguar", class: "bg-blue-100 text-blue-700" },
      paid: { label: "Paguar", class: "bg-emerald-100 text-emerald-700" },
      pending: { label: "Në pritje", class: "bg-amber-100 text-amber-700" },
      cancelled: { label: "Anuluar", class: "bg-red-100 text-red-700" }
    };
    const s = config[status] || config.draft;
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.class}`}>{s.label}</span>;
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = calculateTotals();

  return (
    <PageLayout user={user} setUser={setUser} isAdmin={!isStaff}>
      <div data-testid="invoices-page" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Faturat</h1>
            <p className="text-slate-500 mt-1">{invoices.length} fatura të regjistruara</p>
          </div>
          <Button onClick={() => { setSelectedInvoice(null); resetForm(); setDialogOpen(true); }} data-testid="add-invoice-btn">
            <Plus className="w-4 h-4 mr-2" />
            Faturë e Re
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Kërko fatura..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
            ) : filteredInvoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Nr. Faturës</TableHead>
                    <TableHead>Pacienti</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Totali</TableHead>
                    <TableHead>Statusi</TableHead>
                    <TableHead className="text-right">Veprimet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.invoice_id} className="table-row">
                      <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.patient_name}</TableCell>
                      <TableCell className="text-slate-600">{invoice.issue_date}</TableCell>
                      <TableCell className="text-right font-bold">
                        {(invoice.total_amount || 0).toLocaleString()} {invoice.valuta}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.statusi)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handlePreview(invoice)} className="action-btn text-sky-600 hover:bg-sky-50" title="Shiko">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(invoice)} className="action-btn action-btn-edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          {!isStaff && (
                            <button onClick={() => { setSelectedInvoice(invoice); setDeleteDialogOpen(true); }} className="action-btn action-btn-delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="empty-state">
                <FileText className="empty-state-icon" />
                <p className="empty-state-text">Nuk ka fatura</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Form Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-50">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {selectedInvoice ? 'Ndrysho Faturën' : 'Faturë e Re'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nr. Faturës</Label>
                  <Input value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} required />
                </div>
                <div className="space-y-2 relative">
                  <Label>Pacienti *</Label>
                  <Input
                    placeholder="Kërko sipas emrit..."
                    value={patientSearch}
                    onChange={(e) => { setPatientSearch(e.target.value); setShowPatientList(true); }}
                    onFocus={() => setShowPatientList(true)}
                    required
                  />
                  {showPatientList && patientSearch && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredPatients.length === 0 ? (
                        <div className="p-3 text-sm text-slate-500 text-center">Nuk u gjet asnjë pacient</div>
                      ) : (
                        filteredPatients.slice(0, 10).map(patient => (
                          <button
                            key={patient.patient_id}
                            type="button"
                            onClick={() => handlePatientSelect(patient)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 text-sm border-b last:border-0"
                          >
                            <span className="font-medium">{patient.emri} {patient.mbiemri}</span>
                            {patient.telefon && <span className="text-slate-500 ml-2">({patient.telefon})</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data e Lëshimit</Label>
                  <Input type="date" value={formData.issue_date} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Data e Afatit</Label>
                  <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Valuta</Label>
                  <Select value={formData.valuta} onValueChange={(v) => setFormData({ ...formData, valuta: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MKD">MKD</SelectItem>
                      <SelectItem value="EUR">Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Shërbimet / Produktet</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Shto
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Input placeholder="Përshkrimi" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" placeholder="Sasia" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" placeholder="Çmimi" value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="col-span-2">
                        <Input value={(item.total || 0).toLocaleString()} disabled className="bg-slate-50 font-medium" />
                      </div>
                      <div className="col-span-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={formData.items.length === 1}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Nëntotali:</span>
                  <span className="font-medium">{totals.subtotal.toLocaleString()} {formData.valuta}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Tatimi:</span>
                    <Input type="number" value={formData.tax_rate} onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })} className="w-16 h-8 text-center" />
                    <span className="text-slate-600">%</span>
                  </div>
                  <span className="font-medium">{totals.taxAmount.toLocaleString()} {formData.valuta}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-slate-200">
                  <span>Total:</span>
                  <span className="text-sky-600">{totals.total.toLocaleString()} {formData.valuta}</span>
                </div>
              </div>

              {/* Status & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Statusi</Label>
                  <Select value={formData.statusi} onValueChange={(v) => setFormData({ ...formData, statusi: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Dërguar</SelectItem>
                      <SelectItem value="paid">Paguar</SelectItem>
                      <SelectItem value="cancelled">Anuluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Shënime</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Shënime shtesë..." rows={2} />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Anulo</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedInvoice ? 'Ruaj Ndryshimet' : 'Krijo Faturën'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-50">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Fatura {previewInvoice?.invoice_number}</DialogTitle>
                <div className="flex items-center gap-3">
                  <Select value={previewLang} onValueChange={setPreviewLang}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sq">🇦🇱 Shqip</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Printo
                  </Button>
                </div>
              </div>
            </DialogHeader>
            {previewInvoice && previewClinic && (
              <div className="bg-white border rounded-lg p-6">
                {/* Preview content matches print */}
                <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-sky-600">
                  <div>
                    <img src={LOGO_URL} alt={previewClinic.name} className="h-14 mb-2" />
                    <h2 className="text-xl font-bold">{previewClinic.name}</h2>
                    <p className="text-sm text-slate-500">{translations[previewLang].clinicSubtitle}</p>
                    <p className="text-xs text-slate-500">{translations[previewLang].taxNumber}: {previewClinic.business_number || '-'}</p>
                    <p className="text-xs text-slate-500">{previewClinic.address}</p>
                    <p className="text-xs text-slate-500">{previewClinic.phone} | {previewClinic.email}</p>
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-bold text-slate-300">{translations[previewLang].invoice}</h1>
                    <p className="font-semibold mt-2">{previewInvoice.invoice_number}</p>
                    <p className="text-sm text-slate-500 mt-1">{translations[previewLang].date}: {previewInvoice.issue_date}</p>
                  </div>
                </div>
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs font-semibold text-slate-500 mb-1">{translations[previewLang].billedTo}</p>
                  <p className="font-semibold text-lg">{previewPatient ? `${previewPatient.emri} ${previewPatient.mbiemri}` : previewInvoice.patient_name}</p>
                </div>
                <table className="w-full mb-6">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 rounded-l-lg">{translations[previewLang].description}</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">{translations[previewLang].quantity}</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">{translations[previewLang].price}</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 rounded-r-lg">{translations[previewLang].total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewInvoice.items || []).map((item, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{(item.unit_price || 0).toLocaleString()} {previewInvoice.valuta}</td>
                        <td className="px-4 py-3 text-right font-medium">{(item.total || 0).toLocaleString()} {previewInvoice.valuta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">{translations[previewLang].subtotal}:</span><span>{(previewInvoice.subtotal || 0).toLocaleString()} {previewInvoice.valuta}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">{translations[previewLang].tax} ({previewInvoice.tax_rate}%):</span><span>{(previewInvoice.tax_amount || 0).toLocaleString()} {previewInvoice.valuta}</span></div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t-2"><span>{translations[previewLang].total}:</span><span>{(previewInvoice.total_amount || 0).toLocaleString()} {previewInvoice.valuta}</span></div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md bg-slate-50">
            <DialogHeader><DialogTitle>Konfirmo Fshirjen</DialogTitle></DialogHeader>
            <p className="text-slate-600">Jeni të sigurt që doni të fshini faturën <strong>{selectedInvoice?.invoice_number}</strong>?</p>
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
