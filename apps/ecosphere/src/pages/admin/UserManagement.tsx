import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Trash2, UserPlus, Users, ShieldCheck, Briefcase, User } from "lucide-react";
import { useAuthContext } from "@/store/AuthContext";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type Role = "admin" | "manager" | "employee";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  department: string;
  createdAt: string;
  xp: number;
  points: number;
}

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-primary/20 text-primary border-primary/30",
  manager: "bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30",
  employee: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30",
};

const ROLE_ICONS: Record<Role, React.ElementType> = {
  admin: ShieldCheck,
  manager: Briefcase,
  employee: User,
};

const DEPARTMENTS = [
  "Corporate HQ", "Global Manufacturing", "Logistics & Supply", "R&D", "European Operations",
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

function loadUsers(): UserRecord[] {
  return JSON.parse(localStorage.getItem("esg_users") || "[]");
}

function saveUsers(users: UserRecord[]) {
  localStorage.setItem("esg_users", JSON.stringify(users));
}

export default function UserManagement() {
  const { user: currentUser } = useAuthContext();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee" as Role, department: "Corporate HQ" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setUsers(loadUsers());
    const onUpdate = () => setUsers(loadUsers());
    window.addEventListener("esg_auth_update", onUpdate);
    return () => window.removeEventListener("esg_auth_update", onUpdate);
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  const counts = { admin: users.filter(u => u.role === "admin").length, manager: users.filter(u => u.role === "manager").length, employee: users.filter(u => u.role === "employee").length };

  const changeRole = (userId: string, newRole: Role) => {
    const updated = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsers(updated);
    saveUsers(updated);
    window.dispatchEvent(new Event("esg_auth_update"));
    toast({ title: "Role updated", description: `User role changed to ${newRole}.` });
  };

  const deleteUser = (target: UserRecord) => {
    if (target.id === currentUser?.id || target.id === undefined) {
      toast({ title: "Cannot delete", description: "You cannot delete your own account.", variant: "destructive" });
      return;
    }
    const updated = users.filter(u => u.id !== target.id);
    setUsers(updated);
    saveUsers(updated);
    window.dispatchEvent(new Event("esg_auth_update"));
    toast({ title: "User deleted", description: `${target.name} has been removed.` });
    setDeleteTarget(null);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Valid email required";
    if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (users.find(u => u.email === form.email)) errs.email = "Email already exists";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInvite = () => {
    if (!validateForm()) return;
    const newUser: UserRecord = {
      id: Math.random().toString(36).substring(2, 9),
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      department: form.department,
      createdAt: new Date().toISOString(),
      xp: 0,
      points: 0,
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
    window.dispatchEvent(new Event("esg_auth_update"));
    toast({ title: "User created", description: `${newUser.name} has been added as ${newUser.role}.` });
    setInviteOpen(false);
    setForm({ name: "", email: "", password: "", role: "employee", department: "Corporate HQ" });
    setFormErrors({});
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all accounts, roles, and access levels.</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: users.length, icon: Users, color: "text-foreground" },
          { label: "Admins", value: counts.admin, icon: ShieldCheck, color: "text-primary" },
          { label: "Managers", value: counts.manager, icon: Briefcase, color: "text-[#3b82f6]" },
          { label: "Employees", value: counts.employee, icon: User, color: "text-[#f59e0b]" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="bg-card border-card-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${s.color} opacity-70`} />
                  <div>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, email, or department…" className="pl-9 bg-card border-card-border" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <Card className="bg-card border-card-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">XP</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u, i) => {
                const RoleIcon = ROLE_ICONS[u.role];
                const isSelf = u.id === currentUser?.id;
                return (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${ROLE_COLORS[u.role]}`}>
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.name} {isSelf && <span className="text-[10px] text-muted-foreground">(you)</span>}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => !isSelf && changeRole(u.id, v as Role)} disabled={isSelf}>
                        <SelectTrigger className="w-32 h-7 text-xs bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm">{u.department}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-primary">{u.xp}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#f97316]">{u.points}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        disabled={isSelf}
                        onClick={() => setDeleteTarget(u)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-card border-card-border">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(["name", "email", "password"] as const).map((field) => (
              <div key={field} className="space-y-1.5">
                <Label className="capitalize">{field}</Label>
                <Input
                  type={field === "password" ? "password" : "text"}
                  placeholder={field === "email" ? "name@company.com" : field === "password" ? "Min 6 characters" : "Full name"}
                  value={form[field]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                  className="bg-background border-border"
                />
                {formErrors[field] && <p className="text-xs text-destructive">{formErrors[field]}</p>}
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleInvite}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-card border-card-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This cannot be undone.
          </p>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteUser(deleteTarget)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
