import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.policyAcknowledgement.deleteMany({});
  await prisma.employeeParticipation.deleteMany({});
  await prisma.challengeParticipation.deleteMany({});
  await prisma.complianceIssue.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.emissionFactor.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.carbonTransaction.deleteMany({});
  await prisma.cSRActivity.deleteMany({});
  await prisma.policy.deleteMany({});
  await prisma.audit.deleteMany({});
  await prisma.challenge.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.reward.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.globalConfig.deleteMany({});

  // Seed Users
  await prisma.user.createMany({
    data: [
      {
        id: "admin-1",
        name: "Alex Morgan",
        email: "admin@ecosphere.com",
        password: "Admin@123", // For simplicity, keep plain text as in original logic or handle it.
        role: "admin",
        department: "Corporate HQ",
        createdAt: new Date(2024, 0, 1),
        xp: 4800,
        points: 3200,
      },
      {
        id: "manager-1",
        name: "Jordan Lee",
        email: "manager@ecosphere.com",
        password: "Manager@123",
        role: "manager",
        department: "Global Manufacturing",
        createdAt: new Date(2024, 0, 15),
        xp: 2400,
        points: 1800,
      },
      {
        id: "employee-1",
        name: "Sam Rivera",
        email: "employee@ecosphere.com",
        password: "Employee@123",
        role: "employee",
        department: "R&D",
        createdAt: new Date(2024, 1, 1),
        xp: 950,
        points: 620,
      },
    ],
  });

  // Seed Departments
  await prisma.department.createMany({
    data: [
      { id: "1", name: "Global Manufacturing", code: "MFG", head: "Sarah Connor", parentId: null, employeeCount: 1200, status: "active", envScore: 68, socialScore: 82, govScore: 90 },
      { id: "2", name: "Logistics & Supply", code: "LOG", head: "James Holden", parentId: null, employeeCount: 450, status: "active", envScore: 55, socialScore: 78, govScore: 85 },
      { id: "3", name: "R&D", code: "RND", head: "Miles Dyson", parentId: null, employeeCount: 120, status: "active", envScore: 88, socialScore: 92, govScore: 95 },
      { id: "4", name: "Corporate HQ", code: "HQ", head: "John Smith", parentId: null, employeeCount: 300, status: "active", envScore: 95, socialScore: 88, govScore: 98 },
      { id: "5", name: "European Operations", code: "EU-OPS", head: "Ellen Ripley", parentId: null, employeeCount: 800, status: "active", envScore: 75, socialScore: 85, govScore: 88 }
    ]
  });

  // Seed Categories
  await prisma.category.createMany({
    data: [
      { id: "1", name: "Community Outreach", type: "csr_activity", status: "active" },
      { id: "2", name: "Environmental Cleanup", type: "csr_activity", status: "active" },
      { id: "3", name: "Commuting", type: "challenge", status: "active" },
      { id: "4", name: "Energy Saving", type: "challenge", status: "active" }
    ]
  });

  // Seed Emission Factors
  await prisma.emissionFactor.createMany({
    data: [
      { id: "1", name: "Grid Electricity (US)", factor: 0.385, unit: "kgCO2e/kWh", category: "Energy", status: "active" },
      { id: "2", name: "Diesel Fuel", factor: 2.68, unit: "kgCO2e/L", category: "Fuel", status: "active" },
      { id: "3", name: "Commercial Flight (Short)", factor: 0.15, unit: "kgCO2e/km", category: "Travel", status: "active" },
      { id: "4", name: "Natural Gas", factor: 2.02, unit: "kgCO2e/m3", category: "Energy", status: "active" },
      { id: "5", name: "Grid Electricity (EU)", factor: 0.212, unit: "kgCO2e/kWh", category: "Energy", status: "active" }
    ]
  });

  // Seed Products
  await prisma.product.createMany({
    data: [
      { id: "1", name: "EcoWidget Pro", department: "R&D", carbonFootprint: 12.5, energyRating: "A+", recyclability: 95, status: "active" },
      { id: "2", name: "Standard Widget", department: "Global Manufacturing", carbonFootprint: 45.2, energyRating: "C", recyclability: 40, status: "active" },
      { id: "3", name: "Solar Array V2", department: "Global Manufacturing", carbonFootprint: 8.4, energyRating: "A++", recyclability: 88, status: "active" },
      { id: "4", name: "Industrial Controller", department: "Global Manufacturing", carbonFootprint: 112.0, energyRating: "D", recyclability: 15, status: "active" }
    ]
  });

  // Seed Goals
  await prisma.goal.createMany({
    data: [
      { id: "1", title: "Net Zero HQ 2025", department: "Corporate HQ", target: 0, current: 450, unit: "tCO2e", deadline: "2025-12-31", status: "on_track" },
      { id: "2", title: "Reduce Fleet Emissions by 30%", department: "Logistics & Supply", target: 3000, current: 3800, unit: "tCO2e", deadline: "2024-12-31", status: "at_risk" },
      { id: "3", title: "100% Renewable Energy - EU", department: "European Operations", target: 100, current: 100, unit: "%", deadline: "2023-12-31", status: "achieved" },
      { id: "4", title: "Zero Waste to Landfill", department: "Global Manufacturing", target: 0, current: 12, unit: "% waste", deadline: "2026-06-30", status: "on_track" }
    ]
  });

  // Seed Carbon Transactions
  await prisma.carbonTransaction.createMany({
    data: [
      { id: "1", date: "2023-10-01", department: "Global Manufacturing", source: "manufacturing", emissions: 1250.4, unit: "tCO2e", description: "Monthly plant operations" },
      { id: "2", date: "2023-10-05", department: "Logistics & Supply", source: "fleet", emissions: 450.2, unit: "tCO2e", description: "Q3 European transport fleet" },
      { id: "3", date: "2023-10-12", department: "Corporate HQ", source: "expense", emissions: 12.5, unit: "tCO2e", description: "Executive travel - Q3" },
      { id: "4", date: "2023-10-18", department: "R&D", source: "purchase", emissions: 55.0, unit: "tCO2e", description: "Lab equipment procurement" },
      { id: "5", date: "2023-10-25", department: "European Operations", source: "manufacturing", emissions: 890.1, unit: "tCO2e", description: "Monthly plant operations" }
    ]
  });

  // Seed CSR Activities
  await prisma.cSRActivity.createMany({
    data: [
      { id: "1", title: "Beach Cleanup Drive", categoryId: "2", date: "2023-11-15", location: "Santa Monica, CA", description: "Annual coastal cleanup event", status: "planned", participantCount: 45 },
      { id: "2", title: "Code for Good Hackathon", categoryId: "1", date: "2023-09-20", location: "HQ / Remote", description: "Building apps for local non-profits", status: "completed", participantCount: 120 },
      { id: "3", title: "Tree Planting", categoryId: "2", date: "2023-10-05", location: "Black Forest, Germany", description: "Reforestation initiative", status: "completed", participantCount: 85 },
      { id: "4", title: "Food Bank Volunteering", categoryId: "1", date: "2023-10-28", location: "London, UK", description: "Sorting and packing food boxes", status: "active", participantCount: 30 }
    ]
  });

  // Seed Employee Participations
  await prisma.employeeParticipation.createMany({
    data: [
      { id: "1", employeeName: "Alice Chen", activityId: "2", proofAttached: true, approvalStatus: "approved", pointsEarned: 500, completionDate: "2023-09-20" },
      { id: "2", employeeName: "Bob Smith", activityId: "3", proofAttached: true, approvalStatus: "approved", pointsEarned: 300, completionDate: "2023-10-05" },
      { id: "3", employeeName: "Charlie Davis", activityId: "4", proofAttached: false, approvalStatus: "pending", pointsEarned: 0, completionDate: null },
      { id: "4", employeeName: "Diana Prince", activityId: "1", proofAttached: true, approvalStatus: "rejected", pointsEarned: 0, completionDate: null }
    ]
  });

  // Seed Policies
  await prisma.policy.createMany({
    data: [
      { id: "1", name: "Global Anti-Bribery Policy", category: "Ethics", version: "2.1", status: "active", acknowledgementCount: 2450, totalEmployees: 2870 },
      { id: "2", name: "Supplier Code of Conduct", category: "Supply Chain", version: "1.4", status: "active", acknowledgementCount: 400, totalEmployees: 450 },
      { id: "3", name: "AI Ethics & Data Privacy", category: "Technology", version: "1.0", status: "draft", acknowledgementCount: 0, totalEmployees: 2870 },
      { id: "4", name: "Diversity & Inclusion Charter", category: "HR", version: "3.0", status: "active", acknowledgementCount: 2800, totalEmployees: 2870 }
    ]
  });

  // Seed Audits
  await prisma.audit.createMany({
    data: [
      { id: "1", title: "ISO 14001 Environmental Audit", department: "Global Manufacturing", auditor: "SGS Certification", scheduledDate: "2023-11-10", status: "planned" },
      { id: "2", title: "Q3 Supply Chain Labor Audit", department: "Logistics & Supply", auditor: "Internal Audit Team", scheduledDate: "2023-09-15", status: "completed" },
      { id: "3", title: "Data Privacy Compliance Check", department: "Corporate HQ", auditor: "Deloitte", scheduledDate: "2023-10-20", status: "in_progress" },
      { id: "4", title: "Factory Health & Safety Audit", department: "European Operations", auditor: "TUV Rheinland", scheduledDate: "2023-08-05", status: "completed" }
    ]
  });

  // Seed Compliance Issues
  await prisma.complianceIssue.createMany({
    data: [
      { id: "1", auditId: "4", severity: "high", description: "Missing safety guards on assembly line 3", owner: "Plant Manager", dueDate: "2023-08-20", status: "resolved" },
      { id: "2", auditId: "2", severity: "critical", description: "Tier 2 supplier working hour violations", owner: "VP Supply Chain", dueDate: "2023-10-01", status: "open" },
      { id: "3", auditId: "3", severity: "medium", description: "Incomplete consent records for EU users", owner: "DPO", dueDate: "2023-11-15", status: "in_progress" },
      { id: "4", auditId: "4", severity: "low", description: "Outdated emergency exit signage", owner: "Facilities", dueDate: "2023-09-30", status: "resolved" }
    ]
  });

  // Seed Challenges
  await prisma.challenge.createMany({
    data: [
      { id: "1", title: "Bike to Work Month", categoryId: "3", description: "Commute by bicycle for at least 15 days this month.", xp: 1000, difficulty: "medium", evidenceRequired: true, deadline: "2023-11-30", status: "active" },
      { id: "2", title: "Meatless Mondays", categoryId: "4", description: "Eat vegetarian meals every Monday for a month.", xp: 500, difficulty: "easy", evidenceRequired: false, deadline: "2023-12-31", status: "active" },
      { id: "3", title: "Zero Waste Desk", categoryId: "4", description: "Eliminate all single-use plastics from your workspace.", xp: 750, difficulty: "hard", evidenceRequired: true, deadline: "2023-11-15", status: "under_review" },
      { id: "4", title: "Public Transport Pioneer", categoryId: "3", description: "Use public transport for 30 consecutive days.", xp: 1500, difficulty: "hard", evidenceRequired: true, deadline: "2024-01-31", status: "draft" }
    ]
  });

  // Seed Challenge Participations
  await prisma.challengeParticipation.createMany({
    data: [
      { id: "1", challengeId: "1", employeeName: "Alice Chen", progress: 100, proofSubmitted: true, approvalStatus: "approved", xpAwarded: 1000 },
      { id: "2", challengeId: "1", employeeName: "Bob Smith", progress: 60, proofSubmitted: false, approvalStatus: "pending", xpAwarded: 0 },
      { id: "3", challengeId: "2", employeeName: "Charlie Davis", progress: 100, proofSubmitted: false, approvalStatus: "approved", xpAwarded: 500 },
      { id: "4", challengeId: "3", employeeName: "Diana Prince", progress: 100, proofSubmitted: true, approvalStatus: "pending", xpAwarded: 0 }
    ]
  });

  // Seed Badges
  await prisma.badge.createMany({
    data: [
      { id: "1", name: "Eco Warrior", description: "Completed 5 environmental challenges", unlockRule: "challenges_env >= 5", icon: "Leaf", earnedCount: 145 },
      { id: "2", name: "Community Pillar", description: "Participated in 3 CSR activities", unlockRule: "csr_count >= 3", icon: "Users", earnedCount: 312 },
      { id: "3", name: "Zero Carbon Commuter", description: "Logged 500km of green commutes", unlockRule: "green_commute_km >= 500", icon: "Bike", earnedCount: 89 },
      { id: "4", name: "Compliance Champion", description: "Acknowledged all policies within 24h", unlockRule: "policy_fast_ack >= 10", icon: "ShieldCheck", earnedCount: 567 }
    ]
  });

  // Seed Rewards
  await prisma.reward.createMany({
    data: [
      { id: "1", name: "Extra Vacation Day", description: "Redeem points for 1 additional PTO day", pointsRequired: 5000, stock: 50, status: "active" },
      { id: "2", name: "Sustainable Coffee Mug", description: "Branded reusable bamboo coffee cup", pointsRequired: 500, stock: 200, status: "active" },
      { id: "3", name: "$50 Charity Donation", description: "We donate $50 to a charity of your choice", pointsRequired: 1000, stock: 999, status: "active" },
      { id: "4", name: "E-Bike Subvention", description: "$500 voucher towards an e-bike purchase", pointsRequired: 15000, stock: 5, status: "active" }
    ]
  });

  // Seed Employees
  await prisma.employee.createMany({
    data: [
      { id: "1", name: "Alice Chen", department: "Corporate HQ", xp: 4500, points: 2500, badgesEarned: 3, challengesCompleted: 5 },
      { id: "2", name: "Bob Smith", department: "Global Manufacturing", xp: 1200, points: 500, badgesEarned: 1, challengesCompleted: 1 },
      { id: "3", name: "Charlie Davis", department: "R&D", xp: 8500, points: 150, badgesEarned: 6, challengesCompleted: 12 },
      { id: "4", name: "Diana Prince", department: "Logistics & Supply", xp: 3200, points: 1200, badgesEarned: 2, challengesCompleted: 3 }
    ]
  });

  // Seed Notifications
  await prisma.notification.createMany({
    data: [
      { id: "1", type: "compliance", message: "Overdue compliance issue: Tier 2 supplier working hour violations", read: false, createdAt: new Date("2023-10-02T08:00:00Z") },
      { id: "2", type: "approval", message: "3 new challenge proofs waiting for your approval", read: true, createdAt: new Date("2023-10-15T14:30:00Z") },
      { id: "3", type: "system", message: "Q3 Emissions data auto-calculated successfully", read: false, createdAt: new Date("2023-10-01T00:05:00Z") }
    ]
  });

  // Seed Config
  await prisma.globalConfig.create({
    data: {
      id: "main",
      autoEmissionCalc: true,
      evidenceRequired: true,
      badgeAutoAward: true,
      envWeight: 40,
      socialWeight: 30,
      govWeight: 30,
      notifyComplianceIssue: true,
      notifyApprovalDecision: true,
      notifyPolicyReminder: true,
      notifyBadgeUnlock: false
    }
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
