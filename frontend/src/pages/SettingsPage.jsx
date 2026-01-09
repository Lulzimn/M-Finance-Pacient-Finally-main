import { useState, useEffect } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Settings, Users, DollarSign, Shield, Pencil, Check, X, Trash2, Clock, UserCheck } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SettingsPage({ user, setUser }) {
  const [users, setUsers] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newRate, setNewRate] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchData = async () => {
    try {
      const [usersRes, rateRes] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/exchange-rate`)
      ]);
      setUsers(usersRes.data);
      setExchangeRate(rateRes.data);
      setNewRate(rateRes.data.eur_to_mkd.toString());
    } catch (error) {
      toast.error("Gabim në marrjen e të dhënave");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateRate = async () => {
    try {
      const rate = parseFloat(newRate);
      if (isNaN(rate) || rate <= 0) {
        toast.error("Kursi duhet të jetë numër pozitiv");
        return;
      }
      await axios.put(`${API}/exchange-rate`, { eur_to_mkd: rate });
      toast.success("Kursi u përditësua me sukses");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në përditësimin e kursit");
    }
  };

  const handleUpdateRole = async (userId) => {
    try {
      await axios.put(`${API}/users/${userId}/role?role=${editingRole}`);
      toast.success("Roli u përditësua me sukses");
      setEditingUserId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në përditësimin e rolit");
    }
  };

  const startEditRole = (u) => {
    setEditingUserId(u.user_id);
    setEditingRole(u.role);
  };

  const cancelEditRole = () => {
    setEditingUserId(null);
    setEditingRole("");
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await axios.delete(`${API}/users/${userToDelete.user_id}`);
      toast.success("Përdoruesi u fshi me sukses");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gabim në fshirjen e përdoruesit");
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: "bg-sky-100 text-sky-700",
      staff: "bg-slate-100 text-slate-700",
      pending: "bg-amber-100 text-amber-700"
    };
    const labels = {
      admin: "Admin",
      staff: "Staf",
      pending: "Në Pritje"
    };
    const icons = {
      admin: <Shield className="w-3 h-3 mr-1" />,
      staff: <UserCheck className="w-3 h-3 mr-1" />,
      pending: <Clock className="w-3 h-3 mr-1" />
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role] || styles.staff}`}>
        {icons[role]}
        {labels[role] || role}
      </span>
    );
  };

  // Separate pending users
  const pendingUsers = users.filter(u => u.role === "pending");
  const activeUsers = users.filter(u => u.role !== "pending");

  if (loading) {
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
      <div data-testid="settings-page" className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cilësimet</h1>
          <p className="text-slate-500 mt-1">Menaxhoni cilësimet e sistemit</p>
        </div>

        {/* Exchange Rate */}
        <Card data-testid="exchange-rate-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-sky-600" />
              Kursi i Këmbimit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="form-group flex-1">
                <Label>1 EUR = ? MKD</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  className="max-w-xs font-mono"
                  data-testid="exchange-rate-input"
                />
              </div>
              <Button onClick={handleUpdateRate} data-testid="update-rate-btn">
                Përditëso Kursin
              </Button>
            </div>
            {exchangeRate && (
              <p className="text-sm text-slate-500 mt-4">
                Përditësuar së fundmi: {new Date(exchangeRate.updated_at).toLocaleString("sq-AL")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pending Users */}
        {pendingUsers.length > 0 && (
          <Card data-testid="pending-users" className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-amber-700">
                <Clock className="w-5 h-5" />
                Përdorues në Pritje për Aprovim ({pendingUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingUsers.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-amber-200">
                    <div className="flex items-center gap-3">
                      {u.picture ? (
                        <img src={u.picture} alt={u.name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <span className="text-amber-600 font-medium">{u.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-sm text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => { setEditingUserId(u.user_id); setEditingRole("staff"); handleUpdateRole(u.user_id, "staff"); }}
                        data-testid={`approve-user-${u.user_id}`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Aprovo si Staf
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => { setEditingUserId(u.user_id); setEditingRole("admin"); handleUpdateRole(u.user_id, "admin"); }}
                      >
                        Aprovo si Admin
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => { setUserToDelete(u); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Management */}
        <Card data-testid="user-management">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-sky-600" />
              Menaxhimi i Përdoruesve ({activeUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>Përdoruesi</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roli</TableHead>
                  <TableHead>Regjistruar</TableHead>
                  <TableHead className="text-right">Veprimet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeUsers.map((u) => (
                  <TableRow key={u.user_id} className="table-row" data-testid={`user-row-${u.user_id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {u.picture ? (
                          <img src={u.picture} alt={u.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                            <span className="text-sky-600 font-medium text-sm">{u.name?.charAt(0)}</span>
                          </div>
                        )}
                        <span className="font-medium text-slate-900">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{u.email}</span>
                    </TableCell>
                    <TableCell>
                      {editingUserId === u.user_id ? (
                        <Select value={editingRole} onValueChange={setEditingRole}>
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="staff">Staf</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getRoleBadge(u.role)
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-500">
                        {new Date(u.created_at).toLocaleDateString("sq-AL")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingUserId === u.user_id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateRole(u.user_id)}
                            className="action-btn text-emerald-600 hover:bg-emerald-50"
                            data-testid={`save-role-${u.user_id}`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditRole}
                            className="action-btn text-slate-600 hover:bg-slate-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEditRole(u)}
                            className="action-btn action-btn-edit"
                            disabled={u.user_id === user?.user_id}
                            data-testid={`edit-role-${u.user_id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {u.user_id !== user?.user_id && (
                            <button
                              onClick={() => { setUserToDelete(u); setDeleteDialogOpen(true); }}
                              className="action-btn action-btn-delete"
                              data-testid={`delete-user-${u.user_id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5 text-sky-600" />
              Informacioni i Sistemit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Versioni</p>
                <p className="font-medium text-slate-900">M-Dental v1.0.0</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Përdorues Aktiv</p>
                <p className="font-medium text-slate-900">{activeUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete User Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md bg-slate-50">
            <DialogHeader>
              <DialogTitle>Konfirmo Fshirjen e Përdoruesit</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">
              Jeni të sigurt që doni të fshini përdoruesin <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
            </p>
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Kjo veprim nuk mund të kthehet. Përdoruesi nuk do të ketë më akses në sistem.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>Anulo</Button>
              <Button type="button" variant="destructive" onClick={handleDeleteUser} data-testid="confirm-delete-user-btn">
                <Trash2 className="w-4 h-4 mr-2" />
                Fshi Përdoruesin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
