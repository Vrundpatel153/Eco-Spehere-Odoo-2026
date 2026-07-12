import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import {
  redis,
  getCachedLeaderboard,
  setCachedLeaderboard,
  invalidateLeaderboard,
  getCachedStats,
  setCachedStats,
  invalidateStats,
} from "./redis.js";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_ecosphere_jwt_token_2026_key";

app.use(cors());
app.use(express.json());

// Auth middleware
interface AuthRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
    department: string;
  };
}

const authenticateUser = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token." });
  }
};

// HELPER: Sync user XP/Points with the Employee model if applicable
async function syncUserToEmployee(userName: string, department: string, xpAmt: number, pointsAmt: number) {
  try {
    const emp = await prisma.employee.findFirst({
      where: { name: userName }
    });
    if (emp) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: {
          xp: { increment: xpAmt },
          points: { increment: pointsAmt }
        }
      });
    } else {
      // Create new employee entry for leaderboard
      await prisma.employee.create({
        data: {
          id: Math.random().toString(36).substring(2, 9),
          name: userName,
          department: department,
          xp: xpAmt,
          points: pointsAmt,
          badgesEarned: 0,
          challengesCompleted: 0
        }
      });
    }
    await invalidateLeaderboard();
  } catch (err) {
    console.error("Error syncing employee leaderboard details:", err);
  }
}

// ---------------- AUTH ROUTES ----------------

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role, department } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: "An account with this email already exists." });
      return;
    }
    const id = Math.random().toString(36).substring(2, 9);
    const user = await prisma.user.create({
      data: {
        id,
        name,
        email,
        password, // stored plain-text for demo login simplicity
        role: role || "employee",
        department: department || "Corporate HQ",
        xp: 0,
        points: 0,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, department: user.department },
      JWT_SECRET
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, xp: user.xp, points: user.points } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      res.status(400).json({ error: "Invalid email or password." });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, department: user.department },
      JWT_SECRET
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, xp: user.xp, points: user.points } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/me", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      xp: user.xp,
      points: user.points,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/auth/profile", authenticateUser, async (req: AuthRequest, res) => {
  const { name, email, department } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.user?.id },
      data: { name, email, department },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/auth/password", authenticateUser, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!user || user.password !== currentPassword) {
      res.status(400).json({ error: "Incorrect current password." });
      return;
    }
    await prisma.user.update({
      where: { id: req.user?.id },
      data: { password: newPassword },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DEPARTMENT & CONFIG ----------------

app.get("/api/esg_departments", async (req, res) => {
  try {
    const depts = await prisma.department.findMany();
    res.json(depts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_departments", async (req, res) => {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const dept = await prisma.department.create({
      data: { id, ...req.body },
    });
    res.json(dept);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_departments/:id", async (req, res) => {
  try {
    const updated = await prisma.department.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/esg_departments/:id", async (req, res) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/esg_config", async (req, res) => {
  try {
    let conf = await prisma.globalConfig.findUnique({ where: { id: "main" } });
    if (!conf) {
      conf = await prisma.globalConfig.create({ data: { id: "main" } });
    }
    res.json(conf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_config", async (req, res) => {
  try {
    const updated = await prisma.globalConfig.update({
      where: { id: "main" },
      data: req.body,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/esg_categories", async (req, res) => {
  try {
    const cats = await prisma.category.findMany();
    res.json(cats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CARBON & PRODUCTS ----------------

app.get("/api/esg_emission_factors", async (req, res) => {
  try {
    const factors = await prisma.emissionFactor.findMany();
    res.json(factors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/esg_products", async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_products", async (req, res) => {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const prod = await prisma.product.create({
      data: { id, ...req.body, recyclability: Number(req.body.recyclability), carbonFootprint: Number(req.body.carbonFootprint) },
    });
    res.json(prod);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_products/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.recyclability !== undefined) data.recyclability = Number(data.recyclability);
    if (data.carbonFootprint !== undefined) data.carbonFootprint = Number(data.carbonFootprint);
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/esg_products/:id", async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/esg_goals", async (req, res) => {
  try {
    const goals = await prisma.goal.findMany();
    res.json(goals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_goals", async (req, res) => {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const goal = await prisma.goal.create({
      data: { id, ...req.body, target: Number(req.body.target), current: Number(req.body.current) },
    });
    res.json(goal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_goals/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.target !== undefined) data.target = Number(data.target);
    if (data.current !== undefined) data.current = Number(data.current);
    const updated = await prisma.goal.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/esg_goals/:id", async (req, res) => {
  try {
    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Carbon Transactions (caches aggregate footprint)
app.get("/api/esg_carbon_transactions", async (req, res) => {
  try {
    const txs = await prisma.carbonTransaction.findMany({
      orderBy: { date: "desc" }
    });
    res.json(txs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_carbon_transactions", async (req, res) => {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const tx = await prisma.carbonTransaction.create({
      data: { id, ...req.body, emissions: Number(req.body.emissions) },
    });
    await invalidateStats();
    res.json(tx);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_carbon_transactions/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.emissions !== undefined) data.emissions = Number(data.emissions);
    const updated = await prisma.carbonTransaction.update({
      where: { id: req.params.id },
      data,
    });
    await invalidateStats();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/esg_carbon_transactions/:id", async (req, res) => {
  try {
    await prisma.carbonTransaction.delete({ where: { id: req.params.id } });
    await invalidateStats();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ESG Aggregate stats cache endpoint
app.get("/api/esg_stats", async (req, res) => {
  try {
    const cached = await getCachedStats("emissions");
    if (cached) {
      res.json(cached);
      return;
    }

    const txs = await prisma.carbonTransaction.findMany();
    const totalEmissions = txs.reduce((acc, t) => acc + t.emissions, 0);

    const goals = await prisma.goal.findMany();
    const activeGoals = goals.filter(g => g.status !== "achieved").length;
    const completedGoals = goals.filter(g => g.status === "achieved").length;

    const stats = { totalEmissions, activeGoals, completedGoals };
    await setCachedStats("emissions", stats);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SOCIAL & CSR ACTIVITIES ----------------

app.get("/api/esg_csr_activities", async (req, res) => {
  try {
    const activities = await prisma.cSRActivity.findMany();
    res.json(activities);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_csr_activities", async (req, res) => {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const act = await prisma.cSRActivity.create({
      data: { id, ...req.body, participantCount: 0 },
    });
    res.json(act);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_csr_activities/:id", async (req, res) => {
  try {
    const updated = await prisma.cSRActivity.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/esg_csr_activities/:id", async (req, res) => {
  try {
    await prisma.cSRActivity.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Employee CSR Participations
app.get("/api/esg_employee_participations", async (req, res) => {
  try {
    const parts = await prisma.employeeParticipation.findMany();
    res.json(parts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_employee_participations", async (req, res) => {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const p = await prisma.employeeParticipation.create({
      data: { id, ...req.body },
    });
    res.json(p);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_employee_participations/:id", async (req, res) => {
  try {
    const existing = await prisma.employeeParticipation.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "Participation entry not found" });
      return;
    }
    const updated = await prisma.employeeParticipation.update({
      where: { id: req.params.id },
      data: req.body,
    });

    // Transactional logic: If approved, award XP and points
    if (req.body.approvalStatus === "approved" && existing.approvalStatus !== "approved") {
      const user = await prisma.user.findFirst({ where: { name: existing.employeeName } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            xp: { increment: 200 },
            points: { increment: 500 }
          }
        });
        await syncUserToEmployee(user.name, user.department, 200, 500);
      }
      // Update CSR activity participant count
      await prisma.cSRActivity.update({
        where: { id: existing.activityId },
        data: { participantCount: { increment: 1 } }
      });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/esg_employee_participations/:id", async (req, res) => {
  try {
    await prisma.employeeParticipation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- POLICIES & ACKNOWLEDGEMENT ----------------

app.get("/api/esg_policies", async (req, res) => {
  try {
    const policies = await prisma.policy.findMany();
    res.json(policies);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_policies", async (req, res) => {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const policy = await prisma.policy.create({
      data: { id, ...req.body },
    });
    res.json(policy);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_policies/:id", async (req, res) => {
  try {
    const updated = await prisma.policy.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/esg_policies/:id", async (req, res) => {
  try {
    await prisma.policy.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Policy acknowledgement lists
app.get("/api/esg_user_policy_acks", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const acks = await prisma.policyAcknowledgement.findMany({
      where: { userId: req.user?.id }
    });
    res.json(acks.map(a => a.policyId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_policies/:id/acknowledge", authenticateUser, async (req: AuthRequest, res) => {
  const policyId = req.params.id;
  const userId = req.user?.id!;
  try {
    const existingAck = await prisma.policyAcknowledgement.findUnique({
      where: {
        userId_policyId: { userId, policyId }
      }
    });
    if (existingAck) {
      res.status(400).json({ error: "Already acknowledged." });
      return;
    }

    const policy = await prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) {
      res.status(404).json({ error: "Policy not found" });
      return;
    }

    await prisma.policyAcknowledgement.create({
      data: {
        id: Math.random().toString(36).substring(2, 9),
        userId,
        policyId
      }
    });

    const newAckCount = Math.min(policy.totalEmployees, policy.acknowledgementCount + 1);
    await prisma.policy.update({
      where: { id: policyId },
      data: { acknowledgementCount: newAckCount }
    });

    // Award +50 XP/Points to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: 50 },
        points: { increment: 50 }
      }
    });
    await syncUserToEmployee(req.user?.name!, req.user?.department!, 50, 50);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- AUDITS & COMPLIANCE ISSUES ----------------

app.get("/api/esg_audits", async (req, res) => {
  try {
    const audits = await prisma.audit.findMany();
    res.json(audits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_audits", async (req, res) => {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const audit = await prisma.audit.create({
      data: { id, ...req.body },
    });
    res.json(audit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_audits/:id", async (req, res) => {
  try {
    const updated = await prisma.audit.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/esg_audits/:id", async (req, res) => {
  try {
    await prisma.audit.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/esg_compliance_issues", async (req, res) => {
  try {
    const issues = await prisma.complianceIssue.findMany();
    res.json(issues);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_compliance_issues", async (req, res) => {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const issue = await prisma.complianceIssue.create({
      data: { id, ...req.body },
    });
    res.json(issue);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_compliance_issues/:id", async (req, res) => {
  try {
    const updated = await prisma.complianceIssue.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/esg_compliance_issues/:id", async (req, res) => {
  try {
    await prisma.complianceIssue.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- GAMIFICATION ----------------

app.get("/api/esg_challenges", async (req, res) => {
  try {
    const challenges = await prisma.challenge.findMany();
    res.json(challenges);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_challenges", async (req, res) => {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const challenge = await prisma.challenge.create({
      data: { id, ...req.body, xp: Number(req.body.xp) },
    });
    res.json(challenge);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_challenges/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.xp !== undefined) data.xp = Number(data.xp);
    const updated = await prisma.challenge.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/esg_challenges/:id", async (req, res) => {
  try {
    await prisma.challenge.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Challenge participations
app.get("/api/esg_challenge_participations", async (req, res) => {
  try {
    const participations = await prisma.challengeParticipation.findMany();
    res.json(participations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_challenge_participations", async (req, res) => {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const p = await prisma.challengeParticipation.create({
      data: { id, ...req.body, progress: Number(req.body.progress || 0) },
    });
    res.json(p);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_challenge_participations/:id", async (req, res) => {
  try {
    const existing = await prisma.challengeParticipation.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "Participation not found" });
      return;
    }
    const data = { ...req.body };
    if (data.progress !== undefined) data.progress = Number(data.progress);
    const updated = await prisma.challengeParticipation.update({
      where: { id: req.params.id },
      data,
    });

    // Transactional logic: If approved, award XP and points
    if (data.approvalStatus === "approved" && existing.approvalStatus !== "approved") {
      const challenge = await prisma.challenge.findUnique({ where: { id: existing.challengeId } });
      const xpAmt = challenge?.xp || 500;

      const user = await prisma.user.findFirst({ where: { name: existing.employeeName } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            xp: { increment: xpAmt },
            points: { increment: xpAmt },
          }
        });
        await syncUserToEmployee(user.name, user.department, xpAmt, xpAmt);
      }
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/esg_challenge_participations/:id", async (req, res) => {
  try {
    await prisma.challengeParticipation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/esg_badges", async (req, res) => {
  try {
    const badges = await prisma.badge.findMany();
    res.json(badges);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/esg_rewards", async (req, res) => {
  try {
    const rewards = await prisma.reward.findMany();
    res.json(rewards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_rewards/:id", async (req, res) => {
  try {
    const updated = await prisma.reward.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Leaderboard / Employees with Redis Caching
app.get("/api/esg_employees", async (req, res) => {
  try {
    const cached = await getCachedLeaderboard();
    if (cached) {
      res.json(cached);
      return;
    }

    const employeesList = await prisma.employee.findMany({
      orderBy: { xp: "desc" }
    });

    await setCachedLeaderboard(employeesList);
    res.json(employeesList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- NOTIFICATIONS ----------------

app.get("/api/esg_notifications", async (req, res) => {
  try {
    const notifs = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(notifs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esg_notifications", async (req, res) => {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    const notif = await prisma.notification.create({
      data: { id, ...req.body },
    });
    res.json(notif);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/esg_notifications/:id", async (req, res) => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/esg_notifications/:id", async (req, res) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running dynamically on port ${PORT}`);
});
