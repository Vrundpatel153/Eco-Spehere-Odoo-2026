import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, BarChart3, Users, ShieldCheck, Leaf } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { toast } from "@/hooks/use-toast";

const DEPTS = ["All Departments", "Corporate HQ", "Global Manufacturing", "Logistics & Supply", "R&D", "European Operations"];

export default function Reports() {
  const { data: emissions } = useStore<any>("esg_carbon_transactions");
  const { data: activities } = useStore<any>("esg_csr_activities");
  const { data: participations } = useStore<any>("esg_employee_participations");
  const { data: issues } = useStore<any>("esg_compliance_issues");
  const { data: policies } = useStore<any>("esg_policies");
  const { data: challenges } = useStore<any>("esg_challenges");
  const { data: challengeParticipations } = useStore<any>("esg_challenge_participations");
  const { data: depts } = useStore<any>("esg_departments");

  // Custom builder state
  const [modules, setModules] = useState({ environmental: true, social: true, governance: true, gamification: false });
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generated, setGenerated] = useState(false);

  const handleExport = (type: string) => {
    toast({ title: "Export Started", description: `Generating ${type} report… You'll be notified when ready.` });
  };

  const generateReport = () => {
    if (!modules.environmental && !modules.social && !modules.governance && !modules.gamification) {
      toast({ title: "Select at least one module", variant: "destructive" });
      return;
    }
    setGenerated(true);
    toast({ title: "Report generated ✓", description: "Scroll down to see your custom report." });
  };

  // Computed metrics for report library preview
  const totalEmissions = emissions.reduce((s: number, e: any) => s + e.emissions, 0);
  const emissionsByDept = depts.map((d: any) => ({
    name: d.code,
    value: emissions.filter((e: any) => e.department === d.name).reduce((s: number, e: any) => s + e.emissions, 0),
  })).filter((d: any) => d.value > 0);

  const completedActivities = activities.filter((a: any) => a.status === "completed").length;
  const approvalRate = participations.length > 0
    ? Math.round((participations.filter((p: any) => p.approvalStatus === "approved").length / participations.length) * 100)
    : 0;

  const openIssues = issues.filter((i: any) => i.status !== "resolved").length;
  const resolvedIssues = issues.filter((i: any) => i.status === "resolved").length;
  const issueData = [{ name: "Open", value: openIssues }, { name: "Resolved", value: resolvedIssues }];
  const policyAck = policies.length > 0
    ? Math.round(policies.reduce((s: number, p: any) => s + ((p.acknowledgementCount / (p.totalEmployees || 1)) * 100), 0) / policies.length)
    : 0;

  const activeChallenges = challenges.filter((c: any) => c.status === "active").length;
  const approvedParticipations = challengeParticipations.filter((p: any) => p.approvalStatus === "approved").length;

  // Filtered data for custom builder
  const filteredEmissions = emissions.filter((e: any) => {
    if (deptFilter !== "All Departments" && e.department !== deptFilter) return false;
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });
  const filteredActivities = activities.filter((a: any) => {
    if (deptFilter !== "All Departments") return true; // activities don't have dept
    return true;
  });
  const filteredParticipations = participations.filter((p: any) => {
    if (startDate || endDate) return true;
    return true;
  });
  const filteredIssues = issues;
  const filteredChallengeP = challengeParticipations;

  const COLORS = ["#00d4aa", "#3b82f6", "#f59e0b", "#f97316", "#8b5cf6"];

  const reportCards = [
    {
      title: "Environmental Report",
      desc: "Scope 1, 2 & 3 emissions, energy use, and goals progress.",
      icon: Leaf,
      color: "text-[#00d4aa]",
      bg: "bg-[#00d4aa]/10",
      preview: (
        <div className="mt-3 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Emissions</span>
            <span className="font-bold text-[#00d4aa]">{totalEmissions.toFixed(0)} tCO2e</span>
          </div>
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emissionsByDept.slice(0, 4)} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}t`} />
                <Bar dataKey="value" fill="#00d4aa" radius={[2, 2, 0, 0]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      title: "Social Impact Report",
      desc: "CSR activities, volunteer hours, and diversity metrics.",
      icon: Users,
      color: "text-[#3b82f6]",
      bg: "bg-[#3b82f6]/10",
      preview: (
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Completed Programs</span><span className="font-bold text-[#3b82f6]">{completedActivities}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Participation Requests</span><span className="font-bold text-[#3b82f6]">{participations.length}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Approval Rate</span><span className="font-bold text-[#3b82f6]">{approvalRate}%</span></div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2"><div className="h-full bg-[#3b82f6] rounded-full" style={{ width: `${approvalRate}%` }} /></div>
        </div>
      ),
    },
    {
      title: "Governance & Compliance",
      desc: "Audit logs, policy acknowledgements, and open issues.",
      icon: ShieldCheck,
      color: "text-[#f59e0b]",
      bg: "bg-[#f59e0b]/10",
      preview: (
        <div className="mt-3 flex items-center gap-4">
          <div className="h-[100px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={issueData} cx="50%" cy="50%" outerRadius={45} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                  {issueData.map((_, i) => <Cell key={i} fill={i === 0 ? "#ef4444" : "#00d4aa"} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="text-muted-foreground">Policy Ack: <span className="text-[#f59e0b] font-bold">{policyAck}%</span></p>
            <p className="text-muted-foreground">Open Issues: <span className="text-destructive font-bold">{openIssues}</span></p>
            <p className="text-muted-foreground">Resolved: <span className="text-[#00d4aa] font-bold">{resolvedIssues}</span></p>
          </div>
        </div>
      ),
    },
    {
      title: "Executive ESG Summary",
      desc: "High-level overview of all pillars with YoY comparisons.",
      icon: BarChart3,
      color: "text-primary",
      bg: "bg-primary/10",
      preview: (
        <div className="mt-3">
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depts.slice(0, 4).map((d: any) => ({ name: d.code, E: d.envScore, S: d.socialScore, G: d.govScore }))} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                <Bar dataKey="E" fill="#00d4aa" radius={[2, 2, 0, 0]} />
                <Bar dataKey="S" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="G" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">E=Environmental · S=Social · G=Governance</p>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate and export ESG compliance reports.</p>
        </div>
      </div>

      <Tabs defaultValue="library" className="w-full">
        <TabsList className="bg-secondary/50 border border-border h-auto py-1 mb-6">
          <TabsTrigger value="library">Report Library</TabsTrigger>
          <TabsTrigger value="builder">Custom Builder</TabsTrigger>
        </TabsList>

        {/* Report Library */}
        <TabsContent value="library">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {reportCards.map((r, i) => {
              const Icon = r.icon;
              return (
                <Card key={i} className="bg-card border-card-border hover:border-border transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`w-10 h-10 rounded-lg ${r.bg} flex items-center justify-center mb-3`}>
                          <Icon className={`w-5 h-5 ${r.color}`} />
                        </div>
                        <CardTitle className="text-base">{r.title}</CardTitle>
                        <CardDescription className="mt-1 text-xs">{r.desc}</CardDescription>
                      </div>
                    </div>
                    {r.preview}
                  </CardHeader>
                  <CardContent className="pt-4 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleExport(`PDF — ${r.title}`)}>
                      <Download className="w-3 h-3 mr-1.5" />PDF
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleExport(`CSV — ${r.title}`)}>
                      <Download className="w-3 h-3 mr-1.5" />CSV
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Custom Builder */}
        <TabsContent value="builder">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filters sidebar */}
            <Card className="bg-card border-card-border h-fit">
              <CardHeader><CardTitle className="text-base">Build Your Report</CardTitle><CardDescription className="text-xs">Select modules, filters, and date range.</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Modules</Label>
                  {[
                    { key: "environmental" as const, label: "Environmental", color: "accent-[#00d4aa]" },
                    { key: "social" as const, label: "Social", color: "accent-[#3b82f6]" },
                    { key: "governance" as const, label: "Governance", color: "accent-[#f59e0b]" },
                    { key: "gamification" as const, label: "Gamification", color: "accent-[#f97316]" },
                  ].map(({ key, label, color }) => (
                    <div key={key} className="flex items-center gap-2">
                      <input type="checkbox" id={key} checked={modules[key]} onChange={e => setModules({ ...modules, [key]: e.target.checked })} className={`w-4 h-4 ${color}`} />
                      <Label htmlFor={key} className="font-normal cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Department</Label>
                  <Select value={deptFilter} onValueChange={setDeptFilter}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Date Range</Label>
                  <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">From</Label><Input type="date" className="bg-background border-border h-8 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">To</Label><Input type="date" className="bg-background border-border h-8 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                </div>

                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={generateReport}>Generate Report</Button>
                {generated && (
                  <Button variant="outline" className="w-full gap-2" onClick={() => handleExport("Custom Report")}>
                    <Download className="w-4 h-4" />Export CSV
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-2 space-y-4">
              {!generated ? (
                <Card className="bg-card border-card-border border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                      <BarChart3 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Configure your report</h3>
                    <p className="text-muted-foreground text-sm max-w-xs">Select modules, apply filters, and click Generate Report to see your custom ESG summary.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-foreground">Custom Report Results</h2>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{deptFilter}</Badge>
                      {startDate && <Badge variant="outline">From: {startDate}</Badge>}
                      {endDate && <Badge variant="outline">To: {endDate}</Badge>}
                    </div>
                  </div>

                  {modules.environmental && (
                    <Card className="bg-card border-card-border border-[#00d4aa]/30">
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Leaf className="w-4 h-4 text-[#00d4aa]" />Environmental Module</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-3 bg-secondary/30 rounded-lg"><p className="text-xs text-muted-foreground">Filtered Emissions</p><p className="text-xl font-bold text-[#00d4aa]">{filteredEmissions.reduce((s: number, e: any) => s + e.emissions, 0).toFixed(0)} tCO2e</p></div>
                          <div className="p-3 bg-secondary/30 rounded-lg"><p className="text-xs text-muted-foreground">Transactions</p><p className="text-xl font-bold text-[#00d4aa]">{filteredEmissions.length}</p></div>
                        </div>
                        {filteredEmissions.length > 0 && (
                          <div className="h-[120px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={filteredEmissions.slice(0, 5)} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
                                <XAxis dataKey="source" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                                <Bar dataKey="emissions" fill="#00d4aa" radius={[2, 2, 0, 0]} />
                                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: 11 }} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {modules.social && (
                    <Card className="bg-card border-card-border border-[#3b82f6]/30">
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-[#3b82f6]" />Social Module</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-secondary/30 rounded-lg"><p className="text-xs text-muted-foreground">CSR Activities</p><p className="text-xl font-bold text-[#3b82f6]">{activities.length}</p></div>
                          <div className="p-3 bg-secondary/30 rounded-lg"><p className="text-xs text-muted-foreground">Participations</p><p className="text-xl font-bold text-[#3b82f6]">{filteredParticipations.length}</p></div>
                          <div className="p-3 bg-secondary/30 rounded-lg"><p className="text-xs text-muted-foreground">Approval Rate</p><p className="text-xl font-bold text-[#3b82f6]">{approvalRate}%</p></div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {modules.governance && (
                    <Card className="bg-card border-card-border border-[#f59e0b]/30">
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#f59e0b]" />Governance Module</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-secondary/30 rounded-lg"><p className="text-xs text-muted-foreground">Open Issues</p><p className="text-xl font-bold text-destructive">{openIssues}</p></div>
                          <div className="p-3 bg-secondary/30 rounded-lg"><p className="text-xs text-muted-foreground">Resolved</p><p className="text-xl font-bold text-[#00d4aa]">{resolvedIssues}</p></div>
                          <div className="p-3 bg-secondary/30 rounded-lg"><p className="text-xs text-muted-foreground">Policy Ack</p><p className="text-xl font-bold text-[#f59e0b]">{policyAck}%</p></div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {modules.gamification && (
                    <Card className="bg-card border-card-border border-[#f97316]/30">
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-[#f97316]" />Gamification Module</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-secondary/30 rounded-lg"><p className="text-xs text-muted-foreground">Active Challenges</p><p className="text-xl font-bold text-[#f97316]">{activeChallenges}</p></div>
                          <div className="p-3 bg-secondary/30 rounded-lg"><p className="text-xs text-muted-foreground">Participations</p><p className="text-xl font-bold text-[#f97316]">{challengeParticipations.length}</p></div>
                          <div className="p-3 bg-secondary/30 rounded-lg"><p className="text-xs text-muted-foreground">Approved</p><p className="text-xl font-bold text-[#f97316]">{approvedParticipations}</p></div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
