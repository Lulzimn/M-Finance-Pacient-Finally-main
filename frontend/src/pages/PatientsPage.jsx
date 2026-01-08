import { useState, useEffect } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Plus, Search, Pencil, Trash2, Users, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PatientsPage({ user, setUser, isStaff = false }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    emri: "",
    mbiemri: "",
    telefon: "",
    email: "",
    adresa: "",
    shenimet: ""
  });

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`);
      setPatients(response.data);
    } catch (error) {
      toast.error("Gabim në marrjen e pacientëve");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPatient) {
        await axios.put(`${API}/patients/${selectedPatient.patient_id}`, formData);
        toast.success("Pacienti u përditësua me sukses");
      } else {
        await axios.post(`${API}/patients`, formData);
        toast.success("Pacienti u shtua me sukses");
      }
      setDialogOpen(false);
      setSelectedPatient(null);
      setFormData({ emri: "", mbiemri: "", telefon: "", email: "", adresa: "", shenimet: "" });
      fetchPatients();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në ruajtjen e pacientit");
    }
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      emri: patient.emri,
      mbiemri: patient.mbiemri,
      telefon: patient.telefon || "",
      email: patient.email || "",
      adresa: patient.adresa || "",
      shenimet: patient.shenimet || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/patients/${selectedPatient.patient_id}`);
      toast.success("Pacienti u fshi me sukses");
      setDeleteDialogOpen(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në fshirjen e pacientit");
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.emri} ${p.mbiemri}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.telefon?.includes(searchTerm) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout user={user} setUser={setUser} isAdmin={!isStaff}>
      <div data-testid="patients-page" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Pacientët</h1>
            <p className="text-slate-500 mt-1">{patients.length} pacientë të regjistruar</p>
          </div>
          <Button onClick={() => { setSelectedPatient(null); setFormData({ emri: "", mbiemri: "", telefon: "", email: "", adresa: "", shenimet: "" }); setDialogOpen(true); }} data-testid="add-patient-btn">
            <Plus className="w-4 h-4 mr-2" />
            Shto Pacient
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Kërko pacientë..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-patients"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <Card key={patient.patient_id} className="overflow-hidden" data-testid={`patient-card-${patient.patient_id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sky-600 font-medium">
                          {patient.emri?.charAt(0)}{patient.mbiemri?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{patient.emri} {patient.mbiemri}</p>
                        <p className="text-xs text-slate-400 font-mono">{patient.patient_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(patient)} className="action-btn action-btn-edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {!isStaff && (
                        <button onClick={() => { setSelectedPatient(patient); setDeleteDialogOpen(true); }} className="action-btn action-btn-delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {patient.telefon && (
                      <a href={`tel:${patient.telefon}`} className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700">
                        <Phone className="w-4 h-4" />
                        <span>{patient.telefon}</span>
                      </a>
                    )}
                    {patient.email && (
                      <a href={`mailto:${patient.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-700">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{patient.email}</span>
                      </a>
                    )}
                    {patient.adresa && (
                      <p className="text-sm text-slate-500">{patient.adresa}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="empty-state">
              <Users className="empty-state-icon" />
              <p className="empty-state-text">Nuk ka pacientë</p>
              <Button onClick={() => setDialogOpen(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Shto Pacientin e Parë
              </Button>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredPatients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Emri i Plotë</TableHead>
                    <TableHead>Kontakti</TableHead>
                    <TableHead>Adresa</TableHead>
                    <TableHead className="text-right">Veprimet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.patient_id} className="table-row" data-testid={`patient-row-${patient.patient_id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                            <span className="text-sky-600 font-medium text-sm">
                              {patient.emri?.charAt(0)}{patient.mbiemri?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{patient.emri} {patient.mbiemri}</p>
                            <p className="text-xs text-slate-400 font-mono">{patient.patient_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {patient.telefon && (
                            <a href={`tel:${patient.telefon}`} className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700">
                              <Phone className="w-3 h-3" />
                              {patient.telefon}
                            </a>
                          )}
                          {patient.email && (
                            <a href={`mailto:${patient.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-700">
                              <Mail className="w-3 h-3" />
                              {patient.email}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{patient.adresa || "-"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(patient)}
                            className="action-btn action-btn-edit"
                            data-testid={`edit-patient-${patient.patient_id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {!isStaff && (
                            <button
                              onClick={() => { setSelectedPatient(patient); setDeleteDialogOpen(true); }}
                              className="action-btn action-btn-delete"
                              data-testid={`delete-patient-${patient.patient_id}`}
                            >
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
                <Users className="empty-state-icon" />
                <p className="empty-state-text">Nuk ka pacientë</p>
                <Button onClick={() => setDialogOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Shto Pacientin e Parë
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedPatient ? "Ndrysho Pacientin" : "Shto Pacient të Ri"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <Label htmlFor="emri">Emri *</Label>
                  <Input
                    id="emri"
                    value={formData.emri}
                    onChange={(e) => setFormData({ ...formData, emri: e.target.value })}
                    required
                    data-testid="patient-emri-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="mbiemri">Mbiemri *</Label>
                  <Input
                    id="mbiemri"
                    value={formData.mbiemri}
                    onChange={(e) => setFormData({ ...formData, mbiemri: e.target.value })}
                    required
                    data-testid="patient-mbiemri-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <Label htmlFor="telefon">Telefon</Label>
                  <Input
                    id="telefon"
                    value={formData.telefon}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    data-testid="patient-telefon-input"
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    data-testid="patient-email-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <Label htmlFor="adresa">Adresa</Label>
                <Input
                  id="adresa"
                  value={formData.adresa}
                  onChange={(e) => setFormData({ ...formData, adresa: e.target.value })}
                  data-testid="patient-adresa-input"
                />
              </div>
              <div className="form-group">
                <Label htmlFor="shenimet">Shënime</Label>
                <Textarea
                  id="shenimet"
                  value={formData.shenimet}
                  onChange={(e) => setFormData({ ...formData, shenimet: e.target.value })}
                  rows={3}
                  data-testid="patient-shenimet-input"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Anulo
                </Button>
                <Button type="submit" data-testid="save-patient-btn">
                  {selectedPatient ? "Ruaj Ndryshimet" : "Shto Pacientin"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Konfirmo Fshirjen</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">
              Jeni të sigurt që doni të fshini pacientin <strong>{selectedPatient?.emri} {selectedPatient?.mbiemri}</strong>?
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Anulo
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} data-testid="confirm-delete-btn">
                Fshi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
