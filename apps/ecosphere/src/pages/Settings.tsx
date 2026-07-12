import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2, Plus, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { config, updateConfig } = useStore<any>("esg_config");
  const { data: depts, add: addDept, update: updateDept, remove: removeDept } = useStore<any>("esg_departments");
  const { data: categories, add: addCategory, update: updateCategory, remove: removeCategory } = useStore<any>("esg_categories");

  const [weights, setWeights] = useState({ env: 40, soc: 30, gov: 30 });
  const [sumError, setSumError] = useState(false);

  useEffect(() => {
    if (config) setWeights({ env: config.envWeight || 40, soc: config.socialWeight || 30, gov: config.govWeight || 30 });
  }, [config]);

  const handleWeightChange = (key: "env" | "soc" | "gov", value: number[]) => {
    const next = { ...weights, [key]: value[0] };
    setWeights(next);
    setSumError(next.env + next.soc + next.gov !== 100);
  };

  const saveWeights = () => {
    if (weights.env + weights.soc + weights.gov !== 100) { toast({ title: "Error", description: "Weights must sum to 100%", variant: "destructive" }); return; }
    updateConfig({ envWeight: weights.env, socialWeight: weights.soc, govWeight: weights.gov });
    toast({ title: "Saved", description: "ESG weights updated successfully." });
  };

  // Department modal
  const [deptModal, setDeptModal] = useState(false);
  const [deptEdit, setDeptEdit] = useState<any>(null);
  const defDept = { name: "", code: "", head: "", employeeCount: "100", status: "active" };
  const [dForm, setDForm] = useState(defDept);
  const [dErr, setDErr] = useState<any>({});

  const openDeptModal = (item?: any) => {
    setDeptEdit(item || null);
    setDForm(item ? { ...item, employeeCount: String(item.employeeCount) } : defDept);
    setDErr({});
    setDeptModal(true);
  };

  const saveDept = () => {
    const e: any = {};
    if (!dForm.name.trim()) e.name = "Required";
    if (!dForm.code.trim()) e.code = "Required";
    if (!dForm.head.trim()) e.head = "Required";
    if (Object.keys(e).length) { setDErr(e); return; }
    const payload = { ...dForm, code: dForm.code.toUpperCase(), employeeCount: Number(dForm.employeeCount), envScore: deptEdit?.envScore ?? 75, socialScore: deptEdit?.socialScore ?? 75, govScore: deptEdit?.govScore ?? 75, parentId: null };
    if (deptEdit) updateDept(deptEdit.id, payload);
    else addDept(payload);
    toast({ title: deptEdit ? "Department updated" : "Department added" });
    setDeptModal(false);
  };

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [catEdit, setCatEdit] = useState<any>(null);
  const defCat = { name: "", type: "csr_activity", status: "active" };
  const [cForm, setCForm] = useState(defCat);
  const [cErr, setCErr] = useState<any>({});

  const openCatModal = (item?: any) => {
    setCatEdit(item || null);
    setCForm(item ? { ...item } : defCat);
    setCErr({});
    setCatModal(true);
  };

  const saveCat = () => {
    const e: any = {};
    if (!cForm.name.trim()) e.name = "Required";
    if (Object.keys(e).length) { setCErr(e); return; }
    if (catEdit) updateCategory(catEdit.id, cForm);
    else addCategory(cForm);
    toast({ title: catEdit ? "Category updated" : "Category added" });
    setCatModal(false);
  };

  if (!config) return null;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings & Administration</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure platform behavior, scoring, and organization data.</p>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="bg-secondary/50 border border-border w-full justify-start overflow-x-auto h-auto py-1 mb-6 flex-wrap gap-1">
          <TabsTrigger value="config">ESG Configuration</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Config */}
        <TabsContent value="config" className="space-y-6 max-w-2xl">
          <Card className="bg-card border-card-border">
            <CardHeader><CardTitle className="text-lg">System Behaviors</CardTitle><CardDescription>Automations and global requirements.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "autoEmissionCalc", label: "Auto Emission Calculation", desc: "Automatically calculate tCO2e from transactions." },
                { key: "evidenceRequired", label: "Evidence Required", desc: "Force employees to upload proof for challenges." },
                { key: "badgeAutoAward", label: "Auto-Award Badges", desc: "Issue badges immediately when unlock rules are met." },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5"><Label>{label}</Label><p className="text-sm text-muted-foreground">{desc}</p></div>
                  <Switch checked={!!config[key]} onCheckedChange={c => updateConfig({ [key]: c })} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border">
            <CardHeader><CardTitle className="text-lg">Score Weighting</CardTitle><CardDescription>Determine how the Overall ESG Score is calculated.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "env" as const, label: "Environmental", color: "text-[#00d4aa]" },
                { key: "soc" as const, label: "Social", color: "text-[#3b82f6]" },
                { key: "gov" as const, label: "Governance", color: "text-[#f59e0b]" },
              ].map(({ key, label, color }) => (
                <div key={key} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className={color}>{label} Weight ({weights[key]}%)</Label>
                  </div>
                  <Slider value={[weights[key]]} max={100} step={1} onValueChange={v => handleWeightChange(key, v)} />
                </div>
              ))}
              {sumError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  <AlertCircle className="w-4 h-4" />
                  Weights sum to {weights.env + weights.soc + weights.gov}%. They must equal exactly 100%.
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button onClick={saveWeights} disabled={sumError}>Save Weights</Button>
                <span className="text-xs text-muted-foreground">Total: {weights.env + weights.soc + weights.gov}%</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="max-w-2xl">
          <Card className="bg-card border-card-border">
            <CardHeader><CardTitle>Notification Preferences</CardTitle><CardDescription>Choose which events trigger notifications.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "notifyComplianceIssue", label: "Compliance Issue Created", desc: "Get notified when a new compliance issue is logged." },
                { key: "notifyApprovalDecision", label: "Approval Decision", desc: "Get notified when a participation request is approved or rejected." },
                { key: "notifyPolicyReminder", label: "Policy Reminder", desc: "Receive reminders for unacknowledged policies." },
                { key: "notifyBadgeUnlock", label: "Badge Unlock", desc: "Get notified when you earn a new badge." },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5"><Label>{label}</Label><p className="text-sm text-muted-foreground">{desc}</p></div>
                  <Switch checked={!!config[key]} onCheckedChange={c => updateConfig({ [key]: c })} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments */}
        <TabsContent value="departments">
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Organization Departments</CardTitle>
              <Button size="sm" onClick={() => openDeptModal()}><Plus className="w-4 h-4 mr-2" />Add Department</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Head</TableHead><TableHead>Employees</TableHead><TableHead>ESG Scores</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{depts.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-muted-foreground">{d.code}</TableCell>
                    <TableCell className="font-bold">{d.name}</TableCell>
                    <TableCell>{d.head}</TableCell>
                    <TableCell>{d.employeeCount}</TableCell>
                    <TableCell className="text-xs">
                      <span className="text-[#00d4aa]">E:{d.envScore}</span> · <span className="text-[#3b82f6]">S:{d.socialScore}</span> · <span className="text-[#f59e0b]">G:{d.govScore}</span>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{d.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openDeptModal(d)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => removeDept(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories">
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Activity & Challenge Categories</CardTitle>
              <Button size="sm" onClick={() => openCatModal()}><Plus className="w-4 h-4 mr-2" />Add Category</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{categories.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{c.type.replace("_", " ")}</Badge></TableCell>
                    <TableCell><Badge variant={c.status === "active" ? "default" : "secondary"} className={c.status === "active" ? "bg-[#00d4aa] text-background" : ""}>{c.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openCatModal(c)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => removeCategory(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Department Modal */}
      <Dialog open={deptModal} onOpenChange={() => setDeptModal(false)}>
        <DialogContent className="bg-card border-card-border max-w-md">
          <DialogHeader><DialogTitle>{deptEdit ? "Edit" : "Add"} Department</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name</Label><Input className="bg-background border-border" value={dForm.name} onChange={e => setDForm({ ...dForm, name: e.target.value })} />{dErr.name && <p className="text-xs text-destructive">{dErr.name}</p>}</div>
              <div className="space-y-1.5"><Label>Code (short)</Label><Input className="bg-background border-border uppercase" value={dForm.code} onChange={e => setDForm({ ...dForm, code: e.target.value.toUpperCase() })} />{dErr.code && <p className="text-xs text-destructive">{dErr.code}</p>}</div>
            </div>
            <div className="space-y-1.5"><Label>Department Head</Label><Input className="bg-background border-border" value={dForm.head} onChange={e => setDForm({ ...dForm, head: e.target.value })} />{dErr.head && <p className="text-xs text-destructive">{dErr.head}</p>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Employee Count</Label><Input type="number" className="bg-background border-border" value={dForm.employeeCount} onChange={e => setDForm({ ...dForm, employeeCount: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Status</Label><Select value={dForm.status} onValueChange={v => setDForm({ ...dForm, status: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDeptModal(false)}>Cancel</Button><Button onClick={saveDept}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={catModal} onOpenChange={() => setCatModal(false)}>
        <DialogContent className="bg-card border-card-border max-w-sm">
          <DialogHeader><DialogTitle>{catEdit ? "Edit" : "Add"} Category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Category Name</Label><Input className="bg-background border-border" value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} />{cErr.name && <p className="text-xs text-destructive">{cErr.name}</p>}</div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={cForm.type} onValueChange={v => setCForm({ ...cForm, type: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="csr_activity">CSR Activity</SelectItem><SelectItem value="challenge">Challenge</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={cForm.status} onValueChange={v => setCForm({ ...cForm, status: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCatModal(false)}>Cancel</Button><Button onClick={saveCat}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
