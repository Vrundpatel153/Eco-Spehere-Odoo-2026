import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, ClipboardCheck, Plus, Trash2, Pencil, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/50",
  high: "bg-orange-500/20 text-orange-500 border-orange-500/50",
  medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
  low: "bg-secondary text-secondary-foreground",
};

const DEPTS = ["Corporate HQ", "Global Manufacturing", "Logistics & Supply", "R&D", "European Operations"];
const POLICY_CATS = ["Ethics", "Supply Chain", "Technology", "HR", "Environment", "Finance", "Safety"];
const AUDIT_STATUSES = ["planned", "in_progress", "completed", "cancelled"];
const ISSUE_STATUSES = ["open", "in_progress", "resolved"];
const SEVERITIES = ["low", "medium", "high", "critical"];

export default function Governance() {
  const { data: issues, add: addIssue, update: updateIssue, remove: removeIssue } = useStore<any>("esg_compliance_issues");
  const { data: audits, add: addAudit, update: updateAudit, remove: removeAudit } = useStore<any>("esg_audits");
  const { data: policies, add: addPolicy, update: updatePolicy, remove: removePolicy } = useStore<any>("esg_policies");

  // Policy modal
  const [policyModal, setPolicyModal] = useState(false);
  const [policyEdit, setPolicyEdit] = useState<any>(null);
  const defPolicy = { name: "", category: "Ethics", version: "1.0", status: "draft", totalEmployees: "2870" };
  const [pForm, setPForm] = useState(defPolicy);
  const [pErr, setPErr] = useState<any>({});

  // Audit modal
  const [auditModal, setAuditModal] = useState(false);
  const [auditEdit, setAuditEdit] = useState<any>(null);
  const defAudit = { title: "", department: "Corporate HQ", auditor: "", scheduledDate: "", status: "planned" };
  const [aForm, setAForm] = useState(defAudit);
  const [aErr, setAErr] = useState<any>({});

  // Issue modal
  const [issueModal, setIssueModal] = useState(false);
  const [issueEdit, setIssueEdit] = useState<any>(null);
  const defIssue = { severity: "medium", description: "", owner: "", dueDate: "", status: "open" };
  const [iForm, setIForm] = useState(defIssue);
  const [iErr, setIErr] = useState<any>({});

  const openPolicyModal = (item?: any) => { setPolicyEdit(item || null); setPForm(item ? { ...item, totalEmployees: String(item.totalEmployees) } : defPolicy); setPErr({}); setPolicyModal(true); };
  const openAuditModal = (item?: any) => { setAuditEdit(item || null); setAForm(item ? { ...item } : defAudit); setAErr({}); setAuditModal(true); };
  const openIssueModal = (item?: any) => { setIssueEdit(item || null); setIForm(item ? { ...item } : defIssue); setIErr({}); setIssueModal(true); };

  const savePolicy = () => {
    const e: any = {};
    if (!pForm.name.trim()) e.name = "Required";
    if (!pForm.version.trim()) e.version = "Required";
    if (Object.keys(e).length) { setPErr(e); return; }
    const payload = { ...pForm, totalEmployees: Number(pForm.totalEmployees), acknowledgementCount: policyEdit?.acknowledgementCount || 0 };
    if (policyEdit) updatePolicy(policyEdit.id, payload);
    else addPolicy(payload);
    toast({ title: policyEdit ? "Policy updated" : "Policy added" });
    setPolicyModal(false);
  };

  const saveAudit = () => {
    const e: any = {};
    if (!aForm.title.trim()) e.title = "Required";
    if (!aForm.auditor.trim()) e.auditor = "Required";
    if (!aForm.scheduledDate) e.scheduledDate = "Required";
    if (Object.keys(e).length) { setAErr(e); return; }
    if (auditEdit) updateAudit(auditEdit.id, aForm);
    else addAudit(aForm);
    toast({ title: auditEdit ? "Audit updated" : "Audit scheduled" });
    setAuditModal(false);
  };

  const saveIssue = () => {
    const e: any = {};
    if (!iForm.description.trim()) e.description = "Required";
    if (!iForm.owner.trim()) e.owner = "Required";
    if (!iForm.dueDate) e.dueDate = "Required";
    if (Object.keys(e).length) { setIErr(e); return; }
    if (issueEdit) updateIssue(issueEdit.id, iForm);
    else addIssue({ ...iForm, auditId: "manual" });
    toast({ title: issueEdit ? "Issue updated" : "Issue added" });
    setIssueModal(false);
  };

  const resolveIssue = (id: string) => {
    updateIssue(id, { status: "resolved" });
    toast({ title: "Issue resolved ✓" });
  };

  const openIssues = issues.filter((i: any) => i.status !== "resolved");
  const plannedAudits = audits.filter((a: any) => a.status === "planned").length;
  const policyAck = policies.length > 0
    ? Math.round(policies.reduce((s: number, p: any) => s + ((p.acknowledgementCount / (p.totalEmployees || 1)) * 100), 0) / policies.length)
    : 0;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Governance</h1>
        <p className="text-muted-foreground text-sm mt-1">Audits, policies, and compliance issue tracking.</p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-secondary/50 border border-border w-full justify-start overflow-x-auto h-auto py-1 mb-6 flex-wrap gap-1">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#f59e0b]/10 data-[state=active]:text-[#f59e0b]">Dashboard</TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-[#f59e0b]/10 data-[state=active]:text-[#f59e0b]">Policies</TabsTrigger>
          <TabsTrigger value="audits" className="data-[state=active]:bg-[#f59e0b]/10 data-[state=active]:text-[#f59e0b]">Audits</TabsTrigger>
          <TabsTrigger value="issues" className="data-[state=active]:bg-[#f59e0b]/10 data-[state=active]:text-[#f59e0b]">Compliance Issues</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-card-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-[#f59e0b]" />Policy Acknowledgement</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{policyAck}%</div><p className="text-xs text-muted-foreground mt-1">Average across all policies</p></CardContent></Card>
            <Card className="bg-card border-card-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" />Open Issues</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-destructive">{openIssues.length}</div><p className="text-xs text-destructive mt-1">Requires attention</p></CardContent></Card>
            <Card className="bg-card border-card-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-[#f59e0b]" />Upcoming Audits</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{plannedAudits}</div><p className="text-xs text-muted-foreground mt-1">Planned</p></CardContent></Card>
          </div>
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Compliance Issues</CardTitle>
              <Button size="sm" variant="outline" className="border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b]/10" onClick={() => openIssueModal()}><Plus className="w-4 h-4 mr-2" />Add Issue</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Severity</TableHead><TableHead>Description</TableHead><TableHead>Owner</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{openIssues.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((issue: any) => {
                  const isOverdue = new Date(issue.dueDate) < new Date() && issue.status === "open";
                  return (<TableRow key={issue.id} className={cn(isOverdue && "border-l-2 border-l-destructive bg-destructive/5")}><TableCell><Badge className={cn(SEVERITY_COLORS[issue.severity])} variant="outline">{issue.severity.toUpperCase()}</Badge></TableCell><TableCell className="font-medium max-w-xs truncate" title={issue.description}>{issue.description}</TableCell><TableCell>{issue.owner}</TableCell><TableCell className={cn(isOverdue && "text-destructive font-semibold")}>{issue.dueDate}</TableCell><TableCell><Badge variant="outline" className="capitalize text-[#f59e0b] border-[#f59e0b]/30">{issue.status.replace("_", " ")}</Badge></TableCell><TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-[#00d4aa] hover:text-[#00d4aa] hover:bg-[#00d4aa]/10" onClick={() => resolveIssue(issue.id)}><CheckCircle className="w-3.5 h-3.5 mr-1" />Resolve</Button>
                    <Button variant="ghost" size="icon" onClick={() => openIssueModal(issue)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button>
                  </TableCell></TableRow>);
                })}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies */}
        <TabsContent value="policies">
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Corporate Policies</CardTitle>
              <Button size="sm" className="bg-[#f59e0b] text-background hover:bg-[#f59e0b]/90" onClick={() => openPolicyModal()}><Plus className="w-4 h-4 mr-2" />New Policy</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Version</TableHead><TableHead>Acknowledgement</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{policies.map((p: any) => {
                  const pct = Math.round((p.acknowledgementCount / (p.totalEmployees || 1)) * 100);
                  return (<TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.category}</TableCell><TableCell>v{p.version}</TableCell><TableCell><div className="flex items-center gap-2"><div className="h-1.5 w-20 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-[#f59e0b] rounded-full" style={{ width: `${Math.min(100, pct)}%` }} /></div><span className="text-xs text-muted-foreground">{pct}%</span></div></TableCell><TableCell><Badge variant="outline" className="capitalize">{p.status}</Badge></TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => openPolicyModal(p)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" onClick={() => removePolicy(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell></TableRow>);
                })}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audits */}
        <TabsContent value="audits">
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Audit Schedule</CardTitle>
              <Button size="sm" className="bg-[#f59e0b] text-background hover:bg-[#f59e0b]/90" onClick={() => openAuditModal()}><Plus className="w-4 h-4 mr-2" />Schedule Audit</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Department</TableHead><TableHead>Auditor</TableHead><TableHead>Scheduled Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{audits.map((a: any) => (<TableRow key={a.id}><TableCell className="font-medium">{a.title}</TableCell><TableCell>{a.department}</TableCell><TableCell>{a.auditor}</TableCell><TableCell>{a.scheduledDate}</TableCell><TableCell><Badge variant="outline" className="capitalize text-[#f59e0b] border-[#f59e0b]/30">{a.status.replace("_", " ")}</Badge></TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => openAuditModal(a)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" onClick={() => removeAudit(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Issues */}
        <TabsContent value="issues">
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>All Compliance Issues</CardTitle>
              <Button size="sm" className="bg-[#f59e0b] text-background hover:bg-[#f59e0b]/90" onClick={() => openIssueModal()}><Plus className="w-4 h-4 mr-2" />Add Issue</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Severity</TableHead><TableHead>Description</TableHead><TableHead>Owner</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{issues.map((issue: any) => {
                  const isOverdue = new Date(issue.dueDate) < new Date() && issue.status !== "resolved";
                  return (<TableRow key={issue.id} className={cn(isOverdue && "border-l-2 border-l-destructive bg-destructive/5")}><TableCell><Badge className={cn(SEVERITY_COLORS[issue.severity])} variant="outline">{issue.severity.toUpperCase()}</Badge></TableCell><TableCell className="font-medium max-w-xs truncate" title={issue.description}>{issue.description}</TableCell><TableCell>{issue.owner}</TableCell><TableCell className={cn(isOverdue && "text-destructive font-semibold")}>{issue.dueDate}</TableCell><TableCell><Badge variant="outline" className="capitalize">{issue.status.replace("_", " ")}</Badge></TableCell><TableCell className="text-right space-x-1">
                    {issue.status !== "resolved" && <Button size="sm" variant="ghost" className="h-7 text-xs text-[#00d4aa] hover:bg-[#00d4aa]/10" onClick={() => resolveIssue(issue.id)}><CheckCircle className="w-3.5 h-3.5 mr-1" />Resolve</Button>}
                    <Button variant="ghost" size="icon" onClick={() => openIssueModal(issue)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => removeIssue(issue.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell></TableRow>);
                })}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Policy Modal */}
      <Dialog open={policyModal} onOpenChange={() => setPolicyModal(false)}>
        <DialogContent className="bg-card border-card-border max-w-md">
          <DialogHeader><DialogTitle>{policyEdit ? "Edit" : "New"} Policy</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Policy Name</Label><Input className="bg-background border-border" value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} />{pErr.name && <p className="text-xs text-destructive">{pErr.name}</p>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Category</Label><Select value={pForm.category} onValueChange={v => setPForm({ ...pForm, category: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{POLICY_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Version</Label><Input className="bg-background border-border" value={pForm.version} onChange={e => setPForm({ ...pForm, version: e.target.value })} />{pErr.version && <p className="text-xs text-destructive">{pErr.version}</p>}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Status</Label><Select value={pForm.status} onValueChange={v => setPForm({ ...pForm, status: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Total Employees</Label><Input type="number" className="bg-background border-border" value={pForm.totalEmployees} onChange={e => setPForm({ ...pForm, totalEmployees: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPolicyModal(false)}>Cancel</Button><Button className="bg-[#f59e0b] text-background hover:bg-[#f59e0b]/90" onClick={savePolicy}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Modal */}
      <Dialog open={auditModal} onOpenChange={() => setAuditModal(false)}>
        <DialogContent className="bg-card border-card-border max-w-md">
          <DialogHeader><DialogTitle>{auditEdit ? "Edit" : "Schedule"} Audit</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Audit Title</Label><Input className="bg-background border-border" value={aForm.title} onChange={e => setAForm({ ...aForm, title: e.target.value })} />{aErr.title && <p className="text-xs text-destructive">{aErr.title}</p>}</div>
            <div className="space-y-1.5"><Label>Department</Label><Select value={aForm.department} onValueChange={v => setAForm({ ...aForm, department: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Auditor</Label><Input className="bg-background border-border" placeholder="External firm or internal team" value={aForm.auditor} onChange={e => setAForm({ ...aForm, auditor: e.target.value })} />{aErr.auditor && <p className="text-xs text-destructive">{aErr.auditor}</p>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Scheduled Date</Label><Input type="date" className="bg-background border-border" value={aForm.scheduledDate} onChange={e => setAForm({ ...aForm, scheduledDate: e.target.value })} />{aErr.scheduledDate && <p className="text-xs text-destructive">{aErr.scheduledDate}</p>}</div>
              <div className="space-y-1.5"><Label>Status</Label><Select value={aForm.status} onValueChange={v => setAForm({ ...aForm, status: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{AUDIT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAuditModal(false)}>Cancel</Button><Button className="bg-[#f59e0b] text-background hover:bg-[#f59e0b]/90" onClick={saveAudit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Modal */}
      <Dialog open={issueModal} onOpenChange={() => setIssueModal(false)}>
        <DialogContent className="bg-card border-card-border max-w-md">
          <DialogHeader><DialogTitle>{issueEdit ? "Edit" : "Add"} Compliance Issue</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Description</Label><Textarea className="bg-background border-border resize-none" rows={3} value={iForm.description} onChange={e => setIForm({ ...iForm, description: e.target.value })} />{iErr.description && <p className="text-xs text-destructive">{iErr.description}</p>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Severity</Label><Select value={iForm.severity} onValueChange={v => setIForm({ ...iForm, severity: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{SEVERITIES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Status</Label><Select value={iForm.status} onValueChange={v => setIForm({ ...iForm, status: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{ISSUE_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1.5"><Label>Owner</Label><Input className="bg-background border-border" placeholder="Name or title of responsible party" value={iForm.owner} onChange={e => setIForm({ ...iForm, owner: e.target.value })} />{iErr.owner && <p className="text-xs text-destructive">{iErr.owner}</p>}</div>
            <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" className="bg-background border-border" value={iForm.dueDate} onChange={e => setIForm({ ...iForm, dueDate: e.target.value })} />{iErr.dueDate && <p className="text-xs text-destructive">{iErr.dueDate}</p>}</div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIssueModal(false)}>Cancel</Button><Button className="bg-[#f59e0b] text-background hover:bg-[#f59e0b]/90" onClick={saveIssue}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
