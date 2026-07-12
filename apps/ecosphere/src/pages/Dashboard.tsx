import { useStore } from "@/store/useStore";
import { useAuthContext } from "@/store/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Leaf, Users, ShieldCheck, AlertTriangle, Trophy, Zap, Target, Coins, Award, ChevronRight, MapPin, BarChart3 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

/* ─────────────────── Admin Dashboard ─────────────────── */
function AdminDashboard({ user }: { user: any }) {
  const { data: depts } = useStore<any>("esg_departments");
  const { data: emissions } = useStore<any>("esg_carbon_transactions");
  const { data: issues } = useStore<any>("esg_compliance_issues");
  const { data: challenges } = useStore<any>("esg_challenges");
  const { data: notifications } = useStore<any>("esg_notifications");
  const [, navigate] = useLocation();

  const n = depts.length || 1;
  const avgEnv = Math.round(depts.reduce((a: number, d: any) => a + (d.envScore || 0), 0) / n);
  const avgSoc = Math.round(depts.reduce((a: number, d: any) => a + (d.socialScore || 0), 0) / n);
  const avgGov = Math.round(depts.reduce((a: number, d: any) => a + (d.govScore || 0), 0) / n);
  const overall = Math.round(avgEnv * 0.4 + avgSoc * 0.3 + avgGov * 0.3);
  const openIssues = issues.filter((i: any) => i.status !== "resolved").length;
  const activeChallenges = challenges.filter((c: any) => c.status === "active").length;
  const totalUsers = JSON.parse(localStorage.getItem("esg_users") || "[]").length;

  const emissionsByDate = emissions.reduce((acc: any, e: any) => {
    const d = e.date.substring(5, 10);
    acc[d] = (acc[d] || 0) + e.emissions;
    return acc;
  }, {});
  const lineData = Object.entries(emissionsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

  const barData = depts
    .map((d: any) => ({ name: d.code, score: Math.round((d.envScore || 0) * 0.4 + (d.socialScore || 0) * 0.3 + (d.govScore || 0) * 0.3) }))
    .sort((a: any, b: any) => b.score - a.score);

  const recentNotifs = [...notifications]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const quickActions = [
    { label: "User Management", desc: "Manage accounts & roles", path: "/admin/users", color: "text-primary", bg: "bg-primary/10" },
    { label: "Settings", desc: "ESG weights & config", path: "/settings", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
    { label: "Reports", desc: "Generate ESG reports", path: "/reports", color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10" },
    { label: "Governance", desc: "Compliance & audits", path: "/governance", color: "text-[#f97316]", bg: "bg-[#f97316]/10" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-card-border overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-16 h-16 text-primary" /></div>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overall ESG Score</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{overall}<span className="text-xl text-muted-foreground">/100</span></div>
            <p className="text-xs text-primary mt-1">E:{avgEnv} · S:{avgSoc} · G:{avgGov}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /> Open Issues</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{openIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">Compliance items</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4 text-[#3b82f6]" /> Total Users</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#3b82f6]">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Trophy className="w-4 h-4 text-[#f97316]" /> Active Challenges</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#f97316]">{activeChallenges}</div>
            <p className="text-xs text-muted-foreground mt-1">Running this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-card-border">
          <CardHeader><CardTitle className="text-base font-semibold">Emissions Trend</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="value" stroke="hsl(var(--env))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--env))" }} />
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}t`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader><CardTitle className="text-base font-semibold">Department ESG Rankings</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-card-border">
          <CardHeader><CardTitle className="text-base font-semibold">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <button key={a.label} onClick={() => navigate(a.path)}
                className="flex flex-col items-start p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 hover:bg-secondary transition-all text-left group">
                <div className={`w-8 h-8 rounded-md ${a.bg} flex items-center justify-center mb-2`}>
                  <ChevronRight className={`w-4 h-4 ${a.color}`} />
                </div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{a.label}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{a.desc}</span>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Notifications</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/notifications")} className="text-xs text-primary h-7">View all</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotifs.map((n: any) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-muted-foreground" : "bg-primary"}`} />
                <div className="min-w-0">
                  <Badge variant="outline" className="text-[10px] mb-1 capitalize">{n.type}</Badge>
                  <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                </div>
              </div>
            ))}
            {recentNotifs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

/* ─────────────────── Manager Dashboard ─────────────────── */
function ManagerDashboard({ user }: { user: any }) {
  const { data: depts } = useStore<any>("esg_departments");
  const { data: participations, update: updateParticipation } = useStore<any>("esg_employee_participations");
  const { data: activities } = useStore<any>("esg_csr_activities");
  const { data: employees } = useStore<any>("esg_employees");
  const { data: emissions } = useStore<any>("esg_carbon_transactions");
  const [, navigate] = useLocation();

  const myDept = depts.find((d: any) => d.name === user?.department || d.code === user?.department);
  const myDeptScore = myDept ? Math.round((myDept.envScore || 0) * 0.4 + (myDept.socialScore || 0) * 0.3 + (myDept.govScore || 0) * 0.3) : 0;
  const pending = participations.filter((p: any) => p.approvalStatus === "pending");
  const activeActivities = activities.filter((a: any) => a.status === "active").length;

  const deptEmissionsTotal = emissions.filter((e: any) => e.department === user?.department).reduce((s: number, e: any) => s + e.emissions, 0);
  const totalEmissions = emissions.reduce((s: number, e: any) => s + e.emissions, 0);
  const avgPerDept = depts.length > 0 ? totalEmissions / depts.length : 0;

  const comparisonData = [
    { name: user?.department?.substring(0, 8) || "My Dept", value: Math.round(deptEmissionsTotal) },
    { name: "Avg/Dept", value: Math.round(avgPerDept) },
  ];

  const topEmployees = [...employees].sort((a: any, b: any) => b.xp - a.xp).slice(0, 5);

  const handleApprove = async (id: string) => {
    const p = participations.find((item: any) => item.id === id);
    if (p) {
      await updateParticipation(id, { approvalStatus: "approved", pointsEarned: 500 });
      window.dispatchEvent(new CustomEvent("esg_store_update", { detail: { key: "esg_employees" } }));
      window.dispatchEvent(new Event("esg_auth_update"));
      toast({ title: "Approved ✓", description: "Participation approved and 500 points/200 XP awarded!" });
    } else {
      await updateParticipation(id, { approvalStatus: "approved" });
      toast({ title: "Approved", description: "Participation approved." });
    }
  };
  const handleReject = (id: string) => {
    updateParticipation(id, { approvalStatus: "rejected" });
    toast({ title: "Rejected", variant: "destructive" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-card-border relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><BarChart3 className="w-16 h-16 text-primary" /></div>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Dept ESG Score</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{myDeptScore}<span className="text-lg text-muted-foreground">/100</span></div>
            <p className="text-xs text-muted-foreground mt-1">{user?.department}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#f97316]" /> Pending Approvals</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#f97316]">{pending.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting your review</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4 text-[#3b82f6]" /> Team Members</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#3b82f6]">{employees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In the system</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Leaf className="w-4 h-4 text-[#00d4aa]" /> Active CSR</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#00d4aa]">{activeActivities}</div>
            <p className="text-xs text-muted-foreground mt-1">Ongoing programs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-card-border">
          <CardHeader><CardTitle className="text-base font-semibold">Dept Emissions vs Company Avg</CardTitle></CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}t`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--env))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader><CardTitle className="text-base font-semibold">Company Leaderboard (Top 5)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topEmployees.map((emp: any, i: number) => (
              <div key={emp.id} className="flex items-center gap-3">
                <span className="text-sm font-bold w-5 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {emp.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{emp.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.department}</p>
                </div>
                <span className="text-sm font-bold text-[#f97316] shrink-0">{emp.xp} XP</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {pending.length > 0 && (
        <Card className="bg-card border-card-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Pending Approvals</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/social")} className="text-xs text-primary h-7">View all →</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pending.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.employeeName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activities.find((a: any) => a.id === p.activityId)?.title || "CSR Activity"}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="border-destructive text-destructive h-7 text-xs hover:bg-destructive/10" onClick={() => handleReject(p.id)}>Reject</Button>
                    <Button size="sm" className="bg-[#3b82f6] hover:bg-[#3b82f6]/90 h-7 text-xs text-white" onClick={() => handleApprove(p.id)}>Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

/* ─────────────────── Employee Dashboard ─────────────────── */
function EmployeeDashboard({ user }: { user: any }) {
  const { data: challenges } = useStore<any>("esg_challenges");
  const { data: challengeParticipations } = useStore<any>("esg_challenge_participations");
  const { data: badges } = useStore<any>("esg_badges");
  const [, navigate] = useLocation();

  const myParticipations = challengeParticipations.filter((cp: any) => cp.employeeName === user?.name);
  const myApproved = myParticipations.filter((cp: any) => cp.approvalStatus === "approved").length;
  const activeChallenges = challenges.filter((c: any) => c.status === "active").slice(0, 3);

  const diffColor = (d: string) => d === "easy" ? "text-[#00d4aa]" : d === "medium" ? "text-[#f59e0b]" : "text-destructive";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-card-border relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> My XP</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{user?.xp || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Experience points</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Coins className="w-4 h-4 text-[#f97316]" /> My Points</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#f97316]">{user?.points || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Redeemable points</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Target className="w-4 h-4 text-[#3b82f6]" /> Challenges Joined</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#3b82f6]">{myParticipations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total joined</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Award className="w-4 h-4 text-[#f59e0b]" /> Completed</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#f59e0b]">{myApproved}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved challenges</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-card-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Active Challenges</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/gamification")} className="text-xs text-[#f97316] h-7">View all →</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeChallenges.map((c: any) => {
              const joined = myParticipations.some((p: any) => p.challengeId === c.id);
              return (
                <div key={c.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium">{c.title}</p>
                    <Badge variant="outline" className="bg-[#f97316]/10 text-[#f97316] border-[#f97316]/20 text-[10px]">+{c.xp} XP</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium capitalize ${diffColor(c.difficulty)}`}>{c.difficulty}</span>
                    {joined
                      ? <Badge variant="outline" className="bg-[#00d4aa]/10 text-[#00d4aa] border-[#00d4aa]/20 text-[10px]">✓ Joined</Badge>
                      : <Button size="sm" className="h-6 text-xs bg-[#f97316] hover:bg-[#f97316]/90 text-white" onClick={() => navigate("/gamification")}>Join</Button>}
                  </div>
                </div>
              );
            })}
            {activeChallenges.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active challenges right now.</p>}
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader><CardTitle className="text-base font-semibold">Available Badges</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {badges.slice(0, 4).map((badge: any) => (
                <div key={badge.id} className="flex flex-col items-center p-3 rounded-lg bg-secondary/30 border border-border text-center">
                  <div className="w-10 h-10 rounded-full bg-[#f59e0b]/20 flex items-center justify-center mb-2">
                    <Award className="w-5 h-5 text-[#f59e0b]" />
                  </div>
                  <p className="text-xs font-medium leading-tight">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{badge.earnedCount} earned</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-card-border">
        <CardHeader><CardTitle className="text-base font-semibold">Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Join a Challenge", path: "/gamification", color: "text-[#f97316]", bg: "bg-[#f97316]/10" },
              { label: "Redeem Rewards", path: "/gamification", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
              { label: "Acknowledge Policies", path: "/social", color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10" },
              { label: "CSR Activities", path: "/social", color: "text-primary", bg: "bg-primary/10" },
              { label: "My Profile", path: "/profile", color: "text-muted-foreground", bg: "bg-secondary" },
              { label: "Platform Overview", path: "/layout-overview", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
            ].map((a) => (
              <button key={a.label} onClick={() => navigate(a.path)}
                className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 hover:bg-secondary transition-all text-left group">
                <div className={`w-6 h-6 rounded ${a.bg} flex items-center justify-center shrink-0`}>
                  <ChevronRight className={`w-3 h-3 ${a.color}`} />
                </div>
                <span className="text-xs font-medium group-hover:text-primary transition-colors">{a.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─────────────────── Main Export ─────────────────── */
export default function Dashboard() {
  const { user } = useAuthContext();

  const subtitle = user?.role === "admin"
    ? "Global ESG overview and platform administration."
    : user?.role === "manager"
    ? `Department metrics for ${user?.department}.`
    : `Welcome back, ${user?.name?.split(" ")[0]}! Track your ESG contributions.`;

  const title = user?.role === "admin" ? "Admin Dashboard" : user?.role === "manager" ? "Manager Dashboard" : "My Dashboard";

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>
      {(!user?.role || user.role === "admin") && <AdminDashboard user={user} />}
      {user?.role === "manager" && <ManagerDashboard user={user} />}
      {user?.role === "employee" && <EmployeeDashboard user={user} />}
    </Layout>
  );
}
