import { useState, useEffect, useMemo } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Plus, Search, Pencil, Trash2, Calendar, Clock, Mail, Check, X, UserPlus, User } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Predefined appointment reasons
const APPOINTMENT_REASONS = [
  { value: "kontroll", label: "Kontroll i Përgjithshëm" },
  { value: "pastrim", label: "Pastrim Dhëmbësh" },
  { value: "mbushje", label: "Mbushje" },
  { value: "vadhje", label: "Vadhje Dhëmbi" },
  { value: "rrenje", label: "Trajtim i Rrënjës" },
  { value: "proteze", label: "Protezë" },
  { value: "implant", label: "Implant" },
  { value: "ortodonci", label: "Ortodonci / Aparate" },
  { value: "zbardhim", label: "Zbardhim Dhëmbësh" },
  { value: "kirurgji", label: "Kirurgji Orale" },
  { value: "emergjence", label: "Emergjencë / Dhimbje" },
  { value: "konsultim", label: "Konsultim" },
  { value: "tjeter", label: "Tjetër" }
];

export default function AppointmentsPage({ user, setUser, isStaff = false }) {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Patient search state
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: "",
    data_termini: "",
    ora: "",
    arsyeja: "",
    shenimet: "",
    send_email: true
  });
  
  // New patient data
  const [newPatientData, setNewPatientData] = useState({
    emri: "",
    mbiemri: "",
    telefon: "",
    email: "",
    ditelindja: ""
  });

  const fetchData = async () => {
    try {
      const [appointmentsRes, patientsRes] = await Promise.all([
        axios.get(`${API}/appointments`),
        axios.get(`${API}/patients`)
      ]);
      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data);
    } catch (error) {
      toast.error("Gabim në marrjen e të dhënave");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter patients based on search term
  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm.trim()) return patients.slice(0, 10);
    
    const search = patientSearchTerm.toLowerCase();
    return patients.filter(p => 
      p.emri?.toLowerCase().includes(search) ||
      p.mbiemri?.toLowerCase().includes(search) ||
      `${p.emri} ${p.mbiemri}`.toLowerCase().includes(search) ||
      p.ditelindja?.includes(patientSearchTerm)
    ).slice(0, 10);
  }, [patients, patientSearchTerm]);

  const handleSelectPatient = (patient) => {
    setFormData({ ...formData, patient_id: patient.patient_id });
    setPatientSearchTerm(`${patient.emri} ${patient.mbiemri}`);
    setShowPatientDropdown(false);
    setIsNewPatient(false);
  };

  const handleNewPatientMode = () => {
    setIsNewPatient(true);
    setFormData({ ...formData, patient_id: "" });
    setPatientSearchTerm("");
    setShowPatientDropdown(false);
    // Pre-fill from search term if possible
    const parts = patientSearchTerm.trim().split(" ");
    if (parts.length >= 2) {
      setNewPatientData({
        ...newPatientData,
        emri: parts[0],
        mbiemri: parts.slice(1).join(" ")
      });
    } else if (parts.length === 1) {
      setNewPatientData({
        ...newPatientData,
        emri: parts[0],
        mbiemri: ""
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let patientId = formData.patient_id;
      
      // If new patient, create them first
      if (isNewPatient) {
        if (!newPatientData.emri || !newPatientData.mbiemri) {
          toast.error("Ju lutem plotësoni emrin dhe mbiemrin e pacientit");
          return;
        }
        
        const patientResponse = await axios.post(`${API}/patients`, newPatientData);
        patientId = patientResponse.data.patient_id;
        toast.success("Pacienti u regjistrua me sukses");
      }
      
      if (!patientId) {
        toast.error("Ju lutem zgjidhni ose shtoni një pacient");
        return;
      }
      
      const appointmentData = {
        ...formData,
        patient_id: patientId
      };
      
      if (selectedAppointment) {
        await axios.put(`${API}/appointments/${selectedAppointment.appointment_id}`, appointmentData);
        toast.success("Termini u përditësua me sukses");
      } else {
        const response = await axios.post(`${API}/appointments`, appointmentData);
        if (response.data.email_sent) {
          toast.success("Termini u krijua dhe email-i u dërgua pacientit");
        } else {
          toast.success("Termini u krijua me sukses");
        }
      }
      
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në ruajtjen e terminit");
    }
  };

  const resetForm = () => {
    setSelectedAppointment(null);
    setFormData({
      patient_id: "",
      data_termini: new Date().toISOString().split('T')[0],
      ora: "09:00",
      arsyeja: "",
      shenimet: "",
      send_email: true
    });
    setPatientSearchTerm("");
    setIsNewPatient(false);
    setNewPatientData({
      emri: "",
      mbiemri: "",
      telefon: "",
      email: "",
      ditelindja: ""
    });
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      patient_id: appointment.patient_id,
      data_termini: appointment.data_termini,
      ora: appointment.ora,
      arsyeja: appointment.arsyeja,
      shenimet: appointment.shenimet || "",
      send_email: false
    });
    setPatientSearchTerm(appointment.patient_name || "");
    setIsNewPatient(false);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/appointments/${selectedAppointment.appointment_id}`);
      toast.success("Termini u fshi me sukses");
      setDeleteDialogOpen(false);
      setSelectedAppointment(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në fshirjen e terminit");
    }
  };

  const handleStatusChange = async (appointment, newStatus) => {
    try {
      await axios.put(`${API}/appointments/${appointment.appointment_id}/status?statusi=${newStatus}`);
      toast.success("Statusi u përditësua");
      fetchData();
    } catch (error) {
      toast.error("Gabim në përditësimin e statusit");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: "bg-sky-100 text-sky-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700"
    };
    const labels = {
      scheduled: "Planifikuar",
      completed: "Përfunduar",
      cancelled: "Anuluar"
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  const getReasonLabel = (value) => {
    return APPOINTMENT_REASONS.find(r => r.value === value)?.label || value;
  };

  const filteredAppointments = appointments.filter(apt =>
    apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.arsyeja?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getReasonLabel(apt.arsyeja)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.data_termini?.includes(searchTerm)
  );

  return (
    <PageLayout user={user} setUser={setUser} isAdmin={!isStaff}>
      <div data-testid="appointments-page" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Terminet</h1>
            <p className="text-slate-500 mt-1">{appointments.length} termine të regjistruara</p>
          </div>
          <Button
            onClick={() => { resetForm(); setDialogOpen(true); }}
            className="bg-sky-600 text-white shadow-md hover:bg-sky-700"
            data-testid="add-appointment-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Cakto Termin
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Kërko termine..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" data-testid="search-appointments" />
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
            ) : filteredAppointments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Pacienti</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ora</TableHead>
                    <TableHead>Arsyeja</TableHead>
                    <TableHead>Statusi</TableHead>
                    <TableHead className="text-right">Veprimet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => (
                    <TableRow key={apt.appointment_id} className="table-row" data-testid={`appointment-row-${apt.appointment_id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{apt.patient_name}</p>
                          {apt.patient_email && (
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {apt.patient_email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-sky-600" />
                          <span className="font-medium">{apt.data_termini}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{apt.ora}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{getReasonLabel(apt.arsyeja)}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(apt.statusi)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {apt.statusi === "scheduled" && (
                            <>
                              <button onClick={() => handleStatusChange(apt, "completed")} className="action-btn text-emerald-600 hover:bg-emerald-50" title="Shëno si përfunduar">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleStatusChange(apt, "cancelled")} className="action-btn text-red-500 hover:bg-red-50" title="Anulo">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={() => handleEdit(apt)} className="action-btn action-btn-edit" data-testid={`edit-appointment-${apt.appointment_id}`}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedAppointment(apt); setDeleteDialogOpen(true); }} className="action-btn action-btn-delete" data-testid={`delete-appointment-${apt.appointment_id}`}>
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
                <Calendar className="empty-state-icon" />
                <p className="empty-state-text">Nuk ka termine të regjistruara</p>
                <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Cakto Terminin e Parë
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg bg-slate-50">
            <DialogHeader>
              <DialogTitle className="text-slate-900">{selectedAppointment ? "Ndrysho Terminin" : "Cakto Termin të Ri"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Patient Search/Selection */}
              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <Label>Pacienti *</Label>
                  {!isNewPatient && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-sky-600 hover:text-sky-700 h-auto py-1 px-2"
                      onClick={handleNewPatientMode}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Pacient i Ri
                    </Button>
                  )}
                </div>
                
                {!isNewPatient ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Kërko me emër, mbiemër, ose datëlindje..."
                      value={patientSearchTerm}
                      onChange={(e) => {
                        setPatientSearchTerm(e.target.value);
                        setShowPatientDropdown(true);
                        setFormData({ ...formData, patient_id: "" });
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      className="pl-10"
                      data-testid="patient-search-input"
                    />
                    
                    {/* Patient Dropdown */}
                    {showPatientDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredPatients.length > 0 ? (
                          <>
                            {filteredPatients.map((patient) => (
                              <button
                                key={patient.patient_id}
                                type="button"
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
                                onClick={() => handleSelectPatient(patient)}
                              >
                                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-sky-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{patient.emri} {patient.mbiemri}</p>
                                  <p className="text-xs text-slate-500">
                                    {patient.ditelindja && `Datëlindja: ${patient.ditelindja}`}
                                    {patient.telefon && ` • ${patient.telefon}`}
                                  </p>
                                </div>
                              </button>
                            ))}
                            <button
                              type="button"
                              className="w-full px-4 py-3 text-left hover:bg-sky-50 flex items-center gap-3 text-sky-600 border-t border-slate-200"
                              onClick={handleNewPatientMode}
                            >
                              <UserPlus className="w-5 h-5" />
                              <span className="font-medium">Shto Pacient të Ri</span>
                            </button>
                          </>
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-slate-500 mb-3">Nuk u gjet asnjë pacient</p>
                            <Button type="button" variant="outline" size="sm" onClick={handleNewPatientMode}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Shto Pacient të Ri
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* New Patient Form */
                  <div className="space-y-3 p-4 bg-sky-50 rounded-lg border border-sky-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-sky-700">Pacient i Ri</p>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="text-slate-500 h-auto py-1 px-2"
                        onClick={() => {
                          setIsNewPatient(false);
                          setNewPatientData({ emri: "", mbiemri: "", telefon: "", email: "", ditelindja: "" });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Emri *</Label>
                        <Input
                          value={newPatientData.emri}
                          onChange={(e) => setNewPatientData({ ...newPatientData, emri: e.target.value })}
                          placeholder="Emri"
                          required={isNewPatient}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Mbiemri *</Label>
                        <Input
                          value={newPatientData.mbiemri}
                          onChange={(e) => setNewPatientData({ ...newPatientData, mbiemri: e.target.value })}
                          placeholder="Mbiemri"
                          required={isNewPatient}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Telefon</Label>
                        <Input
                          value={newPatientData.telefon}
                          onChange={(e) => setNewPatientData({ ...newPatientData, telefon: e.target.value })}
                          placeholder="+389 XX XXX XXX"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Datëlindja</Label>
                        <Input
                          type="date"
                          value={newPatientData.ditelindja}
                          onChange={(e) => setNewPatientData({ ...newPatientData, ditelindja: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Email (për njoftim)</Label>
                      <Input
                        type="email"
                        value={newPatientData.email}
                        onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <Label>Data *</Label>
                  <Input 
                    type="date" 
                    value={formData.data_termini} 
                    onChange={(e) => setFormData({ ...formData, data_termini: e.target.value })} 
                    required 
                    data-testid="appointment-date-input" 
                  />
                </div>
                <div className="form-group">
                  <Label>Ora *</Label>
                  <Input 
                    type="time" 
                    value={formData.ora} 
                    onChange={(e) => setFormData({ ...formData, ora: e.target.value })} 
                    required 
                    data-testid="appointment-time-input" 
                  />
                </div>
              </div>

              {/* Reason - Dropdown */}
              <div className="form-group">
                <Label>Arsyeja *</Label>
                <Select 
                  value={formData.arsyeja} 
                  onValueChange={(value) => setFormData({ ...formData, arsyeja: value })}
                  required
                >
                  <SelectTrigger data-testid="appointment-reason-select">
                    <SelectValue placeholder="Zgjidhni arsyen e terminit" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_REASONS.map(reason => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="form-group">
                <Label>Shënime (Opsionale)</Label>
                <Textarea 
                  value={formData.shenimet} 
                  onChange={(e) => setFormData({ ...formData, shenimet: e.target.value })} 
                  rows={2} 
                  placeholder="Shënime shtesë për terminin..."
                  data-testid="appointment-notes-input" 
                />
              </div>

              {/* Send Email Checkbox */}
              {!selectedAppointment && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="send_email"
                    checked={formData.send_email}
                    onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <Label htmlFor="send_email" className="text-sm font-normal cursor-pointer">
                    Dërgo email njoftimi pacientit (nga staffmdental@gmail.com)
                  </Label>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Anulo</Button>
                <Button type="submit" data-testid="save-appointment-btn">
                  {selectedAppointment ? "Ruaj Ndryshimet" : "Cakto Terminin"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md bg-slate-50">
            <DialogHeader><DialogTitle className="text-slate-900">Konfirmo Fshirjen</DialogTitle></DialogHeader>
            <p className="text-slate-700 font-medium">Jeni të sigurt që doni të fshini këtë termin?</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>Anulo</Button>
              <Button type="button" variant="destructive" onClick={handleDelete} data-testid="confirm-delete-appointment-btn">Fshi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
