import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/store/AuthContext";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Home, Leaf, Users, ShieldCheck, Trophy, BarChart2,
  Settings, UserCog, ArrowRight, Layers, Database, GitBranch,
} from "lucide-react";

const ROLE_PILL: Record<string, string> = {
  Admin: "bg-primary/20 text-primary border-primary/30",
  Manager: "bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30",
  Employee: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30",
};

const modules = [
  {
    icon: Home,
    name: "Dashboard",
    path: "/",
    color: "text-primary",
    headerBg: "bg-primary/10 border-primary/20",
    accent: "border-primary/40",
    desc: "Role-adaptive home page. Admin sees global KPIs & quick actions, Manager sees department metrics & approval queue, Employee sees personal XP, points, and challenges.",
    tabs: ["Admin View — Global KPIs, emissions chart, dept rankings", "Manager View — Dept score, pending approvals, leaderboard", "Employee View — My XP, my challenges, quick actions"],
    roles: ["Admin", "Manager", "Employee"],
  },
  {
    icon: Leaf,
    name: "Environmental",
    path: "/environmental",
    color: "text-[#00d4aa]",
    headerBg: "bg-[#00d4aa]/10 border-[#00d4aa]/20",
    accent: "border-[#00d4aa]/40",
    desc: "Full carbon accounting module. Track Scope 1, 2 & 3 emissions, manage product carbon footprints, set and monitor reduction goals.",
    tabs: ["Dashboard — Emissions charts, goal tracker", "Emission Factors — CRUD factor library", "Product Profiles — Carbon footprint per product", "Carbon Transactions — All emission events", "Goals — Reduction targets with deadlines"],
    roles: ["Admin", "Manager"],
  },
  {
    icon: Users,
    name: "Social",
    path: "/social",
    color: "text-[#3b82f6]",
    headerBg: "bg-[#3b82f6]/10 border-[#3b82f6]/20",
    accent: "border-[#3b82f6]/40",
    desc: "CSR activity management, employee participation approvals, diversity analytics, and policy acknowledgement for all staff.",
    tabs: ["Dashboard — Participation & CSR KPIs", "CSR Activities — Create & track programs", "Participation — Approve/reject submissions", "Diversity — Representation pie charts", "Policy Acknowledgement — All roles"],
    roles: ["Admin", "Manager", "Employee"],
  },
  {
    icon: ShieldCheck,
    name: "Governance",
    path: "/governance",
    color: "text-[#f59e0b]",
    headerBg: "bg-[#f59e0b]/10 border-[#f59e0b]/20",
    accent: "border-[#f59e0b]/40",
    desc: "Compliance issue tracking with severity and deadline management, audit scheduling, and corporate policy version control.",
    tabs: ["Dashboard — Open issues table, KPIs", "Policies — Version control, acknowledgements", "Audits — Schedule and track audit events", "Compliance Issues — Severity, owner, due date"],
    roles: ["Admin", "Manager"],
  },
  {
    icon: Trophy,
    name: "Gamification",
    path: "/gamification",
    color: "text-[#f97316]",
    headerBg: "bg-[#f97316]/10 border-[#f97316]/20",
    accent: "border-[#f97316]/40",
    desc: "Employee engagement through challenges, XP, badges, and redeemable rewards. Includes a live company-wide leaderboard.",
    tabs: ["Challenges — Browse & join active challenges", "My Progress — Track joined challenges, submit proof", "Badges — Earn by completing challenges", "Rewards — Redeem points for perks", "Leaderboard — Company-wide XP ranking"],
    roles: ["Admin", "Manager", "Employee"],
  },
  {
    icon: BarChart2,
    name: "Reports",
    path: "/reports",
    color: "text-[#8b5cf6]",
    headerBg: "bg-[#8b5cf6]/10 border-[#8b5cf6]/20",
    accent: "border-[#8b5cf6]/40",
    desc: "Generate ESG reports for each pillar and build custom exports with module selection, department filters, and date ranges.",
    tabs: ["Report Library — Environmental, Social, Governance, Executive", "Custom Builder — Pick modules, dept, date range"],
    roles: ["Admin", "Manager"],
  },
  {
    icon: Settings,
    name: "Settings",
    path: "/settings",
    color: "text-muted-foreground",
    headerBg: "bg-secondary border-border",
    accent: "border-border",
    desc: "Platform configuration: tune ESG score weights, manage notification preferences, add departments, and configure activity categories.",
    tabs: ["ESG Configuration — Score weights, system behaviors", "Notifications — Per-event email preferences", "Departments — Manage org structure", "Categories — CSR & challenge categories"],
    roles: ["Admin"],
  },
  {
    icon: UserCog,
    name: "User Management",
    path: "/admin/users",
    color: "text-destructive",
    headerBg: "bg-destructive/10 border-destructive/20",
    accent: "border-destructive/40",
    desc: "Admin-only portal to view all registered users, change roles (admin/manager/employee), and delete accounts.",
    tabs: ["All Users — Table with XP, points, role badge", "Role Management — Promote/demote any user"],
    roles: ["Admin"],
  },
];

const dataFlowSteps = [
  {
    icon: Users,
    title: "Employee Actions",
    color: "text-[#f59e0b]",
    border: "border-[#f59e0b]/30",
    bg: "bg-[#f59e0b]/5",
    items: ["Joins challenges", "Submits proof", "Participates in CSR activities", "Acknowledges policies", "Redeems reward points"],
  },
  {
    icon: ShieldCheck,
    title: "Manager Approvals",
    color: "text-[#3b82f6]",
    border: "border-[#3b82f6]/30",
    bg: "bg-[#3b82f6]/5",
    items: ["Reviews participation requests", "Approves / rejects submissions", "Monitors dept ESG score", "Schedules CSR programs", "Views team leaderboard"],
  },
  {
    icon: BarChart2,
    title: "Admin Reporting",
    color: "text-primary",
    border: "border-primary/30",
    bg: "bg-primary/5",
    items: ["Global ESG dashboard", "Generates compliance reports", "Adjusts score weights", "Manages all users & roles", "Configures the platform"],
  },
];

export default function LayoutOverview() {
  const { user } = useAuthContext();
  const [, navigate] = useLocation();

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Architecture</h1>
            <p className="text-muted-foreground text-sm">
              How EcoSphere is organized — all modules, pages, and data flows at a glance.
            </p>
          </div>
        </div>

        {/* Role Legend */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Accessible by:</span>
          {Object.entries(ROLE_PILL).map(([role, cls]) => (
            <Badge key={role} variant="outline" className={`text-xs ${cls}`}>{role}</Badge>
          ))}
          <span className="text-xs text-muted-foreground ml-2">· Your role: <span className="font-semibold text-foreground capitalize">{user?.role || "—"}</span></span>
        </div>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
        {modules.map((mod, i) => {
          const Icon = mod.icon;
          const canAccess = mod.roles.some(r => r.toLowerCase() === user?.role) || !user?.role;
          return (
            <motion.div key={mod.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className={`bg-card h-full flex flex-col border ${mod.accent} ${!canAccess ? "opacity-60" : ""}`}>
                {/* Header bar */}
                <div className={`px-4 py-3 border-b ${mod.headerBg} rounded-t-lg flex items-center gap-3`}>
                  <div className="w-8 h-8 rounded-lg bg-background/40 flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${mod.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground">{mod.name}</h3>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {mod.roles.map(r => (
                      <Badge key={r} variant="outline" className={`text-[9px] h-4 px-1.5 ${ROLE_PILL[r]}`}>{r[0]}</Badge>
                    ))}
                  </div>
                </div>

                <CardContent className="flex-1 flex flex-col p-4 gap-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{mod.desc}</p>

                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                      <Database className="w-3 h-3" /> Tabs / Sections
                    </p>
                    {mod.tabs.map((tab) => {
                      const [name, ...rest] = tab.split(" — ");
                      return (
                        <div key={tab} className="flex items-start gap-2 text-xs">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${mod.color}`} />
                          <span>
                            <span className="font-medium text-foreground">{name}</span>
                            {rest.length > 0 && <span className="text-muted-foreground"> — {rest.join(" — ")}</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-auto pt-3">
                    {canAccess ? (
                      <Button size="sm" variant="outline" className="w-full gap-2 text-xs" onClick={() => navigate(mod.path)}>
                        Open {mod.name} <ArrowRight className="w-3 h-3" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full gap-2 text-xs opacity-50" disabled>
                        Admin/Manager Only
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Data Flow Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Platform Data Flow</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">How data moves from employees through managers to admin reporting.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {dataFlowSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative">
                <Card className={`bg-card border ${step.border} ${step.bg} h-full`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${step.color}`} />
                      <span className={step.color}>{step.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {step.items.map(item => (
                        <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${step.color.replace("text-", "bg-")}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                {i < dataFlowSteps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-2.5 z-10 -translate-y-1/2 w-5 h-5 items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
