import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/store/useStore";
import { useAuthContext } from "@/store/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Heart, Users, Target, Plus, Trash2, Pencil, CheckCircle } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

const ACTIVITY_STATUSES = ["planned", "active", "completed", "cancelled"];
const DEPTS = ["Corporate HQ", "Global Manufacturing", "Logistics & Supply", "R&D", "European Operations"];

export default function Social() {
  const { user } = useAuthContext();
  const { data: activities, add: addActivity, update: updateActivity, remove: removeActivity } = useStore<any>("esg_csr_activities");
  const { data: participations, add: addParticipation, update: updateParticipation } = useStore<any>("esg_employee_participations");
  const { data: categories } = useStore<any>("esg_categories");
  const { data: policies, update: updatePolicy } = useStore<any>("esg_policies");

  const [activityModal, setActivityModal] = useState(false);
  const [activityEdit, setActivityEdit] = useState<any>(null);
  const [signUpModal, setSignUpModal] = useState(false);
  const [signUpActivity, setSignUpActivity] = useState<any>(null);
  const [signUpProof, setSignUpProof] = useState(false);

  const csrCategories = categories.filter((c: any) => c.type === "csr_activity");

  // Activity form
  const defActivity = { title: "", categoryId: csrCategories[0]?.id || "1", date: "", location: "", description: "", status: "planned" };
  const [aForm, setAForm] = useState(defActivity);
  const [userAcks, setUserAcks] = useState<string[]>([]);
  const [aErr, setAErr] = useState<any>({});

  useEffect(() => {
    if (user?.id) {
      const token = localStorage.getItem('esg_token');
      fetch('/api/esg_user_policy_acks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUserAcks(data);
        }
      })
      .catch(console.error);
    }
  }, [user]);

  const handleApprove = async (id: string) => {
    const p = participations.find((item: any) => item.id === id);
    if (p) {
      await updateParticipation(id, { approvalStatus: "approved", pointsEarned: 500 });
      window.dispatchEvent(new CustomEvent("esg_store_update", { detail: { key: "esg_employees" } }));
      window.dispatchEvent(new Event("esg_auth_update"));
      toast({ title: "Approved ✓", description: "Participation approved and 500 points/200 XP awarded!" });
    } else {
      await updateParticipation(id, { approvalStatus: "approved" });
      toast({ title: "Approved ✓", description: "Participation approved." });
    }
  };

  const handleReject = (id: string) => { updateParticipation(id, { approvalStatus: "rejected" }); toast({ title: "Rejected", variant: "destructive" }); };

  const openActivityModal = (item?: any) => {
    setActivityEdit(item || null);
    setAForm(item ? { ...item } : defActivity);
    setAErr({});
    setActivityModal(true);
  };

  const saveActivity = () => {
    const e: any = {};
    if (!aForm.title.trim()) e.title = "Required";
    if (!aForm.date) e.date = "Required";
    if (!aForm.location.trim()) e.location = "Required";
    if (Object.keys(e).length) { setAErr(e); return; }
    if (activityEdit) updateActivity(activityEdit.id, { ...aForm, participantCount: activityEdit.participantCount });
    else addActivity({ ...aForm, participantCount: 0 });
    toast({ title: activityEdit ? "Activity updated" : "Activity added" });
    setActivityModal(false);
  };

  const handleSignUp = (activity: any) => {
    if (participations.find((p: any) => p.activityId === activity.id && p.employeeName === user?.name)) {
      toast({ title: "Already signed up", description: "You have already submitted participation for this activity.", variant: "destructive" });
      return;
    }
    setSignUpActivity(activity);
    setSignUpProof(false);
    setSignUpModal(true);
  };

  const submitParticipation = () => {
    addParticipation({
      employeeName: user?.name || "Unknown",
      activityId: signUpActivity.id,
      proofAttached: signUpProof,
      approvalStatus: "pending",
      pointsEarned: 0,
      completionDate: null,
    });
    toast({ title: "Participation submitted! 🙌", description: "Awaiting manager approval." });
    setSignUpModal(false);
  };

  const handleAcknowledge = (policy: any) => {
    if (userAcks.includes(policy.id)) {
      toast({ title: "Already Acknowledged", description: "You have already acknowledged this policy." });
      return;
    }
    const alreadyMax = policy.acknowledgementCount >= policy.totalEmployees;
    if (alreadyMax) { toast({ title: "Already at 100%" }); return; }

    const token = localStorage.getItem('esg_token');
    fetch(`/api/esg_policies/${policy.id}/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }).then(async res => {
      if (res.ok) {
        setUserAcks([...userAcks, policy.id]);
        window.dispatchEvent(new CustomEvent('esg_store_update', { detail: { key: 'esg_policies' } }));
        window.dispatchEvent(new Event('esg_auth_update'));
        toast({ title: "Policy acknowledged ✓", description: `Thanks for acknowledging: ${policy.name}. +50 XP / points awarded!` });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to acknowledge policy", variant: "destructive" });
      }
    });
  };

  const diversityData = [
    { name: "Underrepresented Minorities", value: 35 },
    { name: "Women in Leadership", value: 42 },
    { name: "Veterans", value: 8 },
    { name: "Other", value: 15 },
  ];
  const COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

  const myParticipations = participations.filter((p: any) => p.employeeName === user?.name);
  const completedCount = activities.filter((a: any) => a.status === "completed").length;
  const approvedPart = participations.filter((p: any) => p.approvalStatus === "approved").length;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Social</h1>
        <p className="text-muted-foreground text-sm mt-1">Track CSR, employee engagement, and diversity metrics.</p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-secondary/50 border border-border w-full justify-start overflow-x-auto h-auto py-1 mb-6 flex-wrap gap-1">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#3b82f6]/10 data-[state=active]:text-[#3b82f6]">Dashboard</TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:bg-[#3b82f6]/10 data-[state=active]:text-[#3b82f6]">CSR Activities</TabsTrigger>
          <TabsTrigger value="participation" className="data-[state=active]:bg-[#3b82f6]/10 data-[state=active]:text-[#3b82f6]">Participation</TabsTrigger>
          <TabsTrigger value="diversity" className="data-[state=active]:bg-[#3b82f6]/10 data-[state=active]:text-[#3b82f6]">Diversity</TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-[#3b82f6]/10 data-[state=active]:text-[#3b82f6]">Policy Acknowledgement</TabsTrigger>
          {user?.role === "employee" && (
            <TabsTrigger value="my-participation" className="data-[state=active]:bg-[#3b82f6]/10 data-[state=active]:text-[#3b82f6]">My Participation</TabsTrigger>
          )}
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-card-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4 text-[#3b82f6]" />Participation Requests</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{participations.length}</div><p className="text-xs text-[#3b82f6] mt-1">{approvedPart} approved</p></CardContent></Card>
            <Card className="bg-card border-card-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Heart className="w-4 h-4 text-[#3b82f6]" />Active CSR Programs</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{activities.filter((a: any) => a.status === "active").length}</div><p className="text-xs text-muted-foreground mt-1">{completedCount} completed</p></CardContent></Card>
            <Card className="bg-card border-card-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Target className="w-4 h-4 text-[#3b82f6]" />Policy Compliance</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-[#3b82f6]">{Math.round(policies.reduce((s: number, p: any) => s + (p.acknowledgementCount / (p.totalEmployees || 1)), 0) / (policies.length || 1) * 100)}%</div><p className="text-xs text-muted-foreground mt-1">avg acknowledgement</p></CardContent></Card>
          </div>
          {/* Recent activities summary */}
          <Card className="bg-card border-card-border">
            <CardHeader><CardTitle className="text-base font-semibold">Recent CSR Activities</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Date</TableHead><TableHead>Location</TableHead><TableHead>Participants</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{activities.slice(0, 5).map((a: any) => (<TableRow key={a.id}><TableCell className="font-medium">{a.title}</TableCell><TableCell>{a.date}</TableCell><TableCell>{a.location}</TableCell><TableCell>{a.participantCount}</TableCell><TableCell><Badge variant="outline" className="capitalize text-[#3b82f6] border-[#3b82f6]/30">{a.status}</Badge></TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSR Activities */}
        <TabsContent value="activities">
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>CSR Activities</CardTitle>
              {(user?.role === "admin" || user?.role === "manager") && (
                <Button size="sm" className="bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90" onClick={() => openActivityModal()}><Plus className="w-4 h-4 mr-2" />New Activity</Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Date</TableHead><TableHead>Location</TableHead><TableHead>Participants</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{activities.map((a: any) => (<TableRow key={a.id}><TableCell className="font-medium">{a.title}</TableCell><TableCell>{a.date}</TableCell><TableCell>{a.location}</TableCell><TableCell>{a.participantCount}</TableCell><TableCell><Badge variant="outline" className="capitalize text-[#3b82f6] border-[#3b82f6]/30">{a.status}</Badge></TableCell><TableCell className="text-right space-x-1">
                  {user?.role === "employee" && (a.status === "active" || a.status === "planned") && (
                    <Button size="sm" variant="outline" className="h-7 text-xs border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10" onClick={() => handleSignUp(a)}>Sign Up</Button>
                  )}
                  {(user?.role === "admin" || user?.role === "manager") && (<><Button variant="ghost" size="icon" onClick={() => openActivityModal(a)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" onClick={() => removeActivity(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></>)}
                </TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participation */}
        <TabsContent value="participation">
          <Card className="bg-card border-card-border">
            <CardHeader><CardTitle>{user?.role === "employee" ? "All Participation Records" : "Pending Approvals"}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Activity</TableHead><TableHead>Proof</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{participations.map((p: any) => (<TableRow key={p.id}><TableCell className="font-medium">{p.employeeName}</TableCell><TableCell>{activities.find((a: any) => a.id === p.activityId)?.title || p.activityId}</TableCell><TableCell>{p.proofAttached ? <Badge variant="outline" className="bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20">Attached</Badge> : <span className="text-sm text-muted-foreground">None</span>}</TableCell><TableCell><Badge variant={p.approvalStatus === "approved" ? "default" : p.approvalStatus === "rejected" ? "destructive" : "secondary"} className={p.approvalStatus === "approved" ? "bg-[#3b82f6]" : ""}>{p.approvalStatus}</Badge></TableCell><TableCell className="text-right space-x-2">{p.approvalStatus === "pending" && (user?.role === "admin" || user?.role === "manager") && (<><Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 h-7 text-xs" onClick={() => handleReject(p.id)}>Reject</Button><Button size="sm" className="bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white h-7 text-xs" onClick={() => handleApprove(p.id)}>Approve</Button></>)}</TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diversity */}
        <TabsContent value="diversity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-card-border">
              <CardHeader><CardTitle>Representation Breakdown</CardTitle></CardHeader>
              <CardContent className="h-[300px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={diversityData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                      {diversityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="bg-card border-card-border">
              <CardHeader><CardTitle>Diversity Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-2">
                {diversityData.map((d, i) => (
                  <div key={d.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm"><span className="font-medium">{d.name}</span><span className="font-bold" style={{ color: COLORS[i] }}>{d.value}%</span></div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${d.value}%`, backgroundColor: COLORS[i] }} /></div>
                  </div>
                ))}
                <div className="pt-2 p-3 bg-[#3b82f6]/10 rounded-lg border border-[#3b82f6]/20">
                  <p className="text-sm text-[#3b82f6] font-medium">D&I Goal: 50% underrepresented groups by 2026</p>
                  <p className="text-xs text-muted-foreground mt-1">Current: 35% — 15pp gap remaining</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Policy Acknowledgement */}
        <TabsContent value="policies">
          <Card className="bg-card border-card-border">
            <CardHeader><CardTitle>Corporate Policies — Acknowledgement Status</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Policy</TableHead><TableHead>Category</TableHead><TableHead>Version</TableHead><TableHead>Acknowledged</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>{policies.map((p: any) => {
                  const pct = Math.round((p.acknowledgementCount / (p.totalEmployees || 1)) * 100);
                  const full = pct >= 100;
                  return (<TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>v{p.version}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-[#3b82f6] rounded-full" style={{ width: `${Math.min(100, pct)}%` }} /></div>
                        <span className="text-xs text-muted-foreground">{p.acknowledgementCount}/{p.totalEmployees}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{p.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {userAcks.includes(p.id) ? (
                        <span className="flex items-center justify-end gap-1 text-xs text-[#00d4aa]"><CheckCircle className="w-3.5 h-3.5" /> Acknowledged</span>
                      ) : full ? (
                        <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground"><CheckCircle className="w-3.5 h-3.5" /> 100% Complete</span>
                      ) : (
                        <Button size="sm" className="h-7 text-xs bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white" onClick={() => handleAcknowledge(p)}>Acknowledge</Button>
                      )}
                    </TableCell>
                  </TableRow>);
                })}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee My Participation */}
        {user?.role === "employee" && (
          <TabsContent value="my-participation">
            <div className="space-y-6">
              <Card className="bg-card border-card-border">
                <CardHeader><CardTitle>My Submissions</CardTitle></CardHeader>
                <CardContent>
                  {myParticipations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">You haven't submitted any participations yet. Browse CSR Activities and sign up!</p>
                  ) : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Activity</TableHead><TableHead>Proof</TableHead><TableHead>Status</TableHead><TableHead>Points</TableHead></TableRow></TableHeader>
                      <TableBody>{myParticipations.map((p: any) => (<TableRow key={p.id}><TableCell className="font-medium">{activities.find((a: any) => a.id === p.activityId)?.title || "Activity"}</TableCell><TableCell>{p.proofAttached ? <Badge variant="outline" className="bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20">Attached</Badge> : <span className="text-sm text-muted-foreground">None</span>}</TableCell><TableCell><Badge variant={p.approvalStatus === "approved" ? "default" : p.approvalStatus === "rejected" ? "destructive" : "secondary"} className={p.approvalStatus === "approved" ? "bg-[#3b82f6]" : ""}>{p.approvalStatus}</Badge></TableCell><TableCell className="font-bold text-[#f97316]">{p.pointsEarned}</TableCell></TableRow>))}</TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-card-border">
                <CardHeader><CardTitle>Available Activities to Join</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activities.filter((a: any) => a.status === "active" || a.status === "planned").map((a: any) => {
                      const alreadyJoined = participations.some((p: any) => p.activityId === a.id && p.employeeName === user?.name);
                      return (
                        <div key={a.id} className="p-4 rounded-lg bg-secondary/30 border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{a.title}</h4>
                            <Badge variant="outline" className="capitalize text-[#3b82f6] border-[#3b82f6]/30 text-[10px]">{a.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">📅 {a.date} · 📍 {a.location}</p>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{a.description}</p>
                          {alreadyJoined ? (
                            <Button size="sm" variant="outline" disabled className="w-full h-7 text-xs text-[#00d4aa] border-[#00d4aa]/30">✓ Already Signed Up</Button>
                          ) : (
                            <Button size="sm" className="w-full h-7 text-xs bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white" onClick={() => handleSignUp(a)}>Sign Up</Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Activity Modal */}
      <Dialog open={activityModal} onOpenChange={() => setActivityModal(false)}>
        <DialogContent className="bg-card border-card-border max-w-md">
          <DialogHeader><DialogTitle>{activityEdit ? "Edit" : "New"} CSR Activity</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input className="bg-background border-border" value={aForm.title} onChange={e => setAForm({ ...aForm, title: e.target.value })} />{aErr.title && <p className="text-xs text-destructive">{aErr.title}</p>}</div>
            <div className="space-y-1.5"><Label>Category</Label><Select value={aForm.categoryId} onValueChange={v => setAForm({ ...aForm, categoryId: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{csrCategories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" className="bg-background border-border" value={aForm.date} onChange={e => setAForm({ ...aForm, date: e.target.value })} />{aErr.date && <p className="text-xs text-destructive">{aErr.date}</p>}</div>
              <div className="space-y-1.5"><Label>Status</Label><Select value={aForm.status} onValueChange={v => setAForm({ ...aForm, status: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{ACTIVITY_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1.5"><Label>Location</Label><Input className="bg-background border-border" value={aForm.location} onChange={e => setAForm({ ...aForm, location: e.target.value })} />{aErr.location && <p className="text-xs text-destructive">{aErr.location}</p>}</div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea className="bg-background border-border resize-none" rows={2} value={aForm.description} onChange={e => setAForm({ ...aForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setActivityModal(false)}>Cancel</Button><Button className="bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90" onClick={saveActivity}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Up Modal */}
      <Dialog open={signUpModal} onOpenChange={setSignUpModal}>
        <DialogContent className="bg-card border-card-border max-w-sm">
          <DialogHeader><DialogTitle>Sign Up for Activity</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-[#3b82f6]/10 rounded-lg border border-[#3b82f6]/20">
              <p className="font-medium text-sm">{signUpActivity?.title}</p>
              <p className="text-xs text-muted-foreground mt-1">📅 {signUpActivity?.date} · 📍 {signUpActivity?.location}</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="proof" checked={signUpProof} onChange={e => setSignUpProof(e.target.checked)} className="w-4 h-4 accent-[#3b82f6]" />
              <Label htmlFor="proof" className="font-normal cursor-pointer">I have proof of participation ready</Label>
            </div>
            <p className="text-xs text-muted-foreground">Your submission will be reviewed by your manager before points are awarded.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignUpModal(false)}>Cancel</Button>
            <Button className="bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90" onClick={submitParticipation}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
