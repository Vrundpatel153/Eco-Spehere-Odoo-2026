import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Leaf, Zap, Wind, Plus, Trash2, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const DEPTS = ["Corporate HQ", "Global Manufacturing", "Logistics & Supply", "R&D", "European Operations"];
const FACTOR_CATS = ["Energy", "Fuel", "Travel", "Industrial", "Waste", "Other"];
const SOURCES = ["manufacturing", "fleet", "expense", "purchase", "energy", "other"];
const ENERGY_RATINGS = ["A++", "A+", "A", "B", "C", "D", "E"];
const GOAL_STATUSES = ["on_track", "at_risk", "achieved", "missed"];

function FactorModal({ open, onClose, editItem, add, update }: any) {
  const def = { name: "", category: "Energy", factor: "", unit: "", status: "active" };
  const [f, setF] = useState<any>(editItem || def);
  const [err, setErr] = useState<any>({});

  const onOpen = () => { setF(editItem || def); setErr({}); };
  if (open && JSON.stringify(f) === JSON.stringify(def) && editItem) { setF(editItem); }

  const save = () => {
    const e: any = {};
    if (!f.name.trim()) e.name = "Required";
    if (!f.factor || isNaN(Number(f.factor))) e.factor = "Valid number required";
    if (!f.unit.trim()) e.unit = "Required";
    if (Object.keys(e).length) { setErr(e); return; }
    const payload = { ...f, factor: Number(f.factor) };
    if (editItem) update(editItem.id, payload);
    else add(payload);
    toast({ title: editItem ? "Factor updated" : "Factor added" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-card-border max-w-md">
        <DialogHeader><DialogTitle>{editItem ? "Edit" : "Add"} Emission Factor</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {(["name", "unit"] as const).map(k => (
            <div key={k} className="space-y-1.5">
              <Label className="capitalize">{k}</Label>
              <Input className="bg-background border-border" value={f[k] || ""} onChange={e => setF({ ...f, [k]: e.target.value })} />
              {err[k] && <p className="text-xs text-destructive">{err[k]}</p>}
            </div>
          ))}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={f.category} onValueChange={v => setF({ ...f, category: v })}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>{FACTOR_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Factor (numeric)</Label>
            <Input type="number" className="bg-background border-border" value={f.factor || ""} onChange={e => setF({ ...f, factor: e.target.value })} />
            {err.factor && <p className="text-xs text-destructive">{err.factor}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={f.status} onValueChange={v => setF({ ...f, status: v })}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button className="bg-[#00d4aa] text-background hover:bg-[#00d4aa]/90" onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductModal({ open, onClose, editItem, add, update }: any) {
  const def = { name: "", department: "R&D", carbonFootprint: "", energyRating: "A", recyclability: "80", status: "active" };
  const [f, setF] = useState<any>(editItem || def);
  const [err, setErr] = useState<any>({});

  const save = () => {
    const e: any = {};
    if (!f.name.trim()) e.name = "Required";
    if (isNaN(Number(f.carbonFootprint))) e.carbonFootprint = "Valid number";
    if (Object.keys(e).length) { setErr(e); return; }
    const payload = { ...f, carbonFootprint: Number(f.carbonFootprint), recyclability: Number(f.recyclability) };
    if (editItem) update(editItem.id, payload);
    else add(payload);
    toast({ title: editItem ? "Product updated" : "Product added" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); else setF(editItem || def); }}>
      <DialogContent className="bg-card border-card-border max-w-md">
        <DialogHeader><DialogTitle>{editItem ? "Edit" : "Add"} Product Profile</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Product Name</Label><Input className="bg-background border-border" value={f.name || ""} onChange={e => setF({ ...f, name: e.target.value })} />{err.name && <p className="text-xs text-destructive">{err.name}</p>}</div>
          <div className="space-y-1.5"><Label>Department</Label><Select value={f.department} onValueChange={v => setF({ ...f, department: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Carbon Footprint (tCO2e)</Label><Input type="number" className="bg-background border-border" value={f.carbonFootprint || ""} onChange={e => setF({ ...f, carbonFootprint: e.target.value })} />{err.carbonFootprint && <p className="text-xs text-destructive">{err.carbonFootprint}</p>}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Energy Rating</Label><Select value={f.energyRating} onValueChange={v => setF({ ...f, energyRating: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{ENERGY_RATINGS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Recyclability (%)</Label><Input type="number" min="0" max="100" className="bg-background border-border" value={f.recyclability || ""} onChange={e => setF({ ...f, recyclability: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={f.status} onValueChange={v => setF({ ...f, status: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button className="bg-[#00d4aa] text-background hover:bg-[#00d4aa]/90" onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransactionModal({ open, onClose, editItem, add, update }: any) {
  const def = { date: "", department: "Corporate HQ", source: "manufacturing", emissions: "", unit: "tCO2e", description: "" };
  const [f, setF] = useState<any>(editItem || def);
  const [err, setErr] = useState<any>({});

  useEffect(() => {
    if (open) {
      setF(editItem ? { ...editItem, emissions: String(editItem.emissions) } : def);
      setErr({});
    }
  }, [open, editItem]);

  const save = () => {
    const e: any = {};
    if (!f.date) e.date = "Required";
    if (!f.emissions || isNaN(Number(f.emissions))) e.emissions = "Valid number";
    if (!f.description.trim()) e.description = "Required";
    if (Object.keys(e).length) { setErr(e); return; }
    const payload = { ...f, emissions: Number(f.emissions) };
    if (editItem) {
      update(editItem.id, payload);
      toast({ title: "Transaction updated" });
    } else {
      add(payload);
      toast({ title: "Transaction added" });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setF(def); setErr({}); onClose(); } }}>
      <DialogContent className="bg-card border-card-border max-w-md">
        <DialogTitle>{editItem ? "Edit" : "Add"} Carbon Transaction</DialogTitle>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" className="bg-background border-border" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />{err.date && <p className="text-xs text-destructive">{err.date}</p>}</div>
          <div className="space-y-1.5"><Label>Department</Label><Select value={f.department} onValueChange={v => setF({ ...f, department: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Source</Label><Select value={f.source} onValueChange={v => setF({ ...f, source: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Emissions (tCO2e)</Label><Input type="number" className="bg-background border-border" value={f.emissions} onChange={e => setF({ ...f, emissions: e.target.value })} />{err.emissions && <p className="text-xs text-destructive">{err.emissions}</p>}</div>
          </div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea className="bg-background border-border resize-none" rows={2} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />{err.description && <p className="text-xs text-destructive">{err.description}</p>}</div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button className="bg-[#00d4aa] text-background hover:bg-[#00d4aa]/90" onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GoalModal({ open, onClose, editItem, add, update }: any) {
  const def = { title: "", department: "Corporate HQ", target: "", current: "", unit: "tCO2e", deadline: "", status: "on_track" };
  const [f, setF] = useState<any>(editItem || def);
  const [err, setErr] = useState<any>({});

  const save = () => {
    const e: any = {};
    if (!f.title.trim()) e.title = "Required";
    if (!f.deadline) e.deadline = "Required";
    if (Object.keys(e).length) { setErr(e); return; }
    const payload = { ...f, target: Number(f.target), current: Number(f.current) };
    if (editItem) update(editItem.id, payload);
    else add(payload);
    toast({ title: editItem ? "Goal updated" : "Goal added" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setF(editItem || def); setErr({}); onClose(); } }}>
      <DialogContent className="bg-card border-card-border max-w-md">
        <DialogHeader><DialogTitle>{editItem ? "Edit" : "Add"} Environmental Goal</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Title</Label><Input className="bg-background border-border" value={f.title || ""} onChange={e => setF({ ...f, title: e.target.value })} />{err.title && <p className="text-xs text-destructive">{err.title}</p>}</div>
          <div className="space-y-1.5"><Label>Department</Label><Select value={f.department} onValueChange={v => setF({ ...f, department: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Target</Label><Input type="number" className="bg-background border-border" value={f.target || ""} onChange={e => setF({ ...f, target: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Current</Label><Input type="number" className="bg-background border-border" value={f.current || ""} onChange={e => setF({ ...f, current: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Unit</Label><Input className="bg-background border-border" value={f.unit || ""} onChange={e => setF({ ...f, unit: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Deadline</Label><Input type="date" className="bg-background border-border" value={f.deadline || ""} onChange={e => setF({ ...f, deadline: e.target.value })} />{err.deadline && <p className="text-xs text-destructive">{err.deadline}</p>}</div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={f.status} onValueChange={v => setF({ ...f, status: v })}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{GOAL_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button className="bg-[#00d4aa] text-background hover:bg-[#00d4aa]/90" onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Environmental() {
  const { data: emissions, add: addEmission, update: updateEmission, remove: removeEmission } = useStore<any>("esg_carbon_transactions");
  const { data: goals, add: addGoal, update: updateGoal, remove: removeGoal } = useStore<any>("esg_goals");
  const { data: factors, add: addFactor, update: updateFactor, remove: removeFactor } = useStore<any>("esg_emission_factors");
  const { data: products, add: addProduct, update: updateProduct, remove: removeProduct } = useStore<any>("esg_products");

  const [factorModal, setFactorModal] = useState(false);
  const [factorEdit, setFactorEdit] = useState<any>(null);
  const [productModal, setProductModal] = useState(false);
  const [productEdit, setProductEdit] = useState<any>(null);
  const [txModal, setTxModal] = useState(false);
  const [txEdit, setTxEdit] = useState<any>(null);
  const [goalModal, setGoalModal] = useState(false);
  const [goalEdit, setGoalEdit] = useState<any>(null);

  const emissionsBySource = emissions.reduce((acc: any, e: any) => {
    acc[e.source] = (acc[e.source] || 0) + e.emissions;
    return acc;
  }, {});
  const sourceChartData = Object.entries(emissionsBySource).map(([name, value]) => ({ name, value }));

  const totalEmissions = emissions.reduce((s: number, e: any) => s + e.emissions, 0);

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Environmental</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage emissions, products, and environmental targets.</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-secondary/50 border border-border w-full justify-start overflow-x-auto h-auto py-1 mb-6 flex-wrap gap-1">
          {["dashboard", "factors", "products", "transactions", "goals"].map(t => (
            <TabsTrigger key={t} value={t} className="data-[state=active]:bg-[#00d4aa]/10 data-[state=active]:text-[#00d4aa] capitalize">{t === "factors" ? "Emission Factors" : t === "transactions" ? "Carbon Transactions" : t}</TabsTrigger>
          ))}
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-card-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Wind className="w-4 h-4 text-[#00d4aa]" />Total Emissions</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{totalEmissions.toFixed(0)}<span className="text-sm text-muted-foreground ml-1">tCO2e</span></div></CardContent></Card>
            <Card className="bg-card border-card-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-[#00d4aa]" />Energy Consumption</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">4.2<span className="text-sm text-muted-foreground ml-1">GWh</span></div></CardContent></Card>
            <Card className="bg-card border-card-border"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Leaf className="w-4 h-4 text-[#00d4aa]" />Active Goals</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-[#00d4aa]">{goals.filter((g: any) => g.status === "on_track").length}</div></CardContent></Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-card-border"><CardHeader><CardTitle className="text-base font-semibold">Emissions by Source</CardTitle></CardHeader><CardContent className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={sourceChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}><CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} /><Bar dataKey="value" fill="#00d4aa" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
            <Card className="bg-card border-card-border flex flex-col"><CardHeader><CardTitle className="text-base font-semibold">Active Goals Tracker</CardTitle></CardHeader><CardContent className="flex-1 flex flex-col gap-4">{goals.map((goal: any) => { const progress = goal.target === 0 ? Math.max(0, 100 - (goal.current / 5)) : Math.min(100, (goal.current / goal.target) * 100); return (<div key={goal.id} className="space-y-2"><div className="flex justify-between items-center text-sm"><span className="font-medium">{goal.title}</span><span className="text-muted-foreground">{goal.current}/{goal.target} {goal.unit}</span></div><Progress value={progress} className={`h-2 ${goal.status === "at_risk" ? "[&>div]:bg-destructive" : "[&>div]:bg-[#00d4aa]"}`} /></div>); })}</CardContent></Card>
          </div>
        </TabsContent>

        {/* Emission Factors Tab */}
        <TabsContent value="factors">
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Emission Factors</CardTitle>
              <Button size="sm" className="bg-[#00d4aa] text-background hover:bg-[#00d4aa]/90" onClick={() => { setFactorEdit(null); setFactorModal(true); }}><Plus className="w-4 h-4 mr-2" />Add Factor</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Factor</TableHead><TableHead>Unit</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{factors.map((f: any) => (<TableRow key={f.id}><TableCell className="font-medium">{f.name}</TableCell><TableCell>{f.category}</TableCell><TableCell>{f.factor}</TableCell><TableCell>{f.unit}</TableCell><TableCell><Badge variant="outline" className="capitalize">{f.status}</Badge></TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => { setFactorEdit(f); setFactorModal(true); }}><Pencil className="w-4 h-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" onClick={() => removeFactor(f.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Product Profiles</CardTitle>
              <Button size="sm" className="bg-[#00d4aa] text-background hover:bg-[#00d4aa]/90" onClick={() => { setProductEdit(null); setProductModal(true); }}><Plus className="w-4 h-4 mr-2" />Add Product</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Department</TableHead><TableHead>Carbon Footprint</TableHead><TableHead>Energy Rating</TableHead><TableHead>Recyclability</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{products.map((p: any) => (<TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.department}</TableCell><TableCell>{p.carbonFootprint} tCO2e</TableCell><TableCell><Badge variant="outline" className="bg-[#00d4aa]/10 text-[#00d4aa] border-[#00d4aa]/20">{p.energyRating}</Badge></TableCell><TableCell>{p.recyclability}%</TableCell><TableCell><Badge variant="outline" className="capitalize">{p.status}</Badge></TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => { setProductEdit(p); setProductModal(true); }}><Pencil className="w-4 h-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" onClick={() => removeProduct(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Carbon Transactions</CardTitle>
              <Button size="sm" className="bg-[#00d4aa] text-background hover:bg-[#00d4aa]/90" onClick={() => { setTxEdit(null); setTxModal(true); }}><Plus className="w-4 h-4 mr-2" />Add Transaction</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Department</TableHead><TableHead>Source</TableHead><TableHead>Emissions</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{[...emissions].sort((a: any, b: any) => b.date.localeCompare(a.date)).map((e: any) => (<TableRow key={e.id}><TableCell>{e.date}</TableCell><TableCell>{e.department}</TableCell><TableCell className="capitalize">{e.source}</TableCell><TableCell className="font-medium text-[#00d4aa]">{e.emissions} {e.unit}</TableCell><TableCell className="max-w-xs truncate text-muted-foreground" title={e.description}>{e.description}</TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => { setTxEdit(e); setTxModal(true); }}><Pencil className="w-4 h-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" onClick={() => removeEmission(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Environmental Goals</CardTitle>
              <Button size="sm" className="bg-[#00d4aa] text-background hover:bg-[#00d4aa]/90" onClick={() => { setGoalEdit(null); setGoalModal(true); }}><Plus className="w-4 h-4 mr-2" />Add Goal</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Department</TableHead><TableHead>Progress</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{goals.map((goal: any) => { const progress = goal.target === 0 ? Math.max(0, 100 - (goal.current / 5)) : Math.min(100, (goal.current / goal.target) * 100); return (<TableRow key={goal.id}><TableCell className="font-medium">{goal.title}</TableCell><TableCell>{goal.department}</TableCell><TableCell><div className="flex items-center gap-2"><Progress value={progress} className={`h-1.5 w-24 ${goal.status === "at_risk" ? "[&>div]:bg-destructive" : "[&>div]:bg-[#00d4aa]"}`} /><span className="text-xs text-muted-foreground">{goal.current}/{goal.target} {goal.unit}</span></div></TableCell><TableCell>{goal.deadline}</TableCell><TableCell><Badge variant="outline" className="capitalize">{goal.status.replace("_", " ")}</Badge></TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => { setGoalEdit(goal); setGoalModal(true); }}><Pencil className="w-4 h-4 text-muted-foreground" /></Button><Button variant="ghost" size="icon" onClick={() => removeGoal(goal.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell></TableRow>); })}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <FactorModal open={factorModal} onClose={() => { setFactorModal(false); setFactorEdit(null); }} editItem={factorEdit} add={addFactor} update={updateFactor} />
      <ProductModal open={productModal} onClose={() => { setProductModal(false); setProductEdit(null); }} editItem={productEdit} add={addProduct} update={updateProduct} />
      <TransactionModal open={txModal} onClose={() => { setTxModal(false); setTxEdit(null); }} editItem={txEdit} add={addEmission} update={updateEmission} />
      <GoalModal open={goalModal} onClose={() => { setGoalModal(false); setGoalEdit(null); }} editItem={goalEdit} add={addGoal} update={updateGoal} />
    </Layout>
  );
}
