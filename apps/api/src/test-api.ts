const API_URL = "http://localhost:5000";

async function runTests() {
  console.log("🚀 Starting EcoSphere Backend Integration Tests...\n");
  let token = "";
  let testTxId = "";

  // Helper assertions
  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
    } else {
      console.error(`❌ [FAIL] ${message}`);
      process.exit(1);
    }
  };

  // Test 1: User Login
  try {
    console.log("🔑 Running Auth Test: Login...");
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@ecosphere.com",
        password: "Admin@123",
      }),
    });
    const data = await res.json() as any;
    assert(res.ok && data.token && data.user, "Login with seeded admin credentials succeeded.");
    token = data.token;
  } catch (err: any) {
    console.error("❌ Auth test failed to connect:", err.message);
    process.exit(1);
  }

  // Test 2: Authenticated /me endpoint
  try {
    console.log("👤 Running Auth Test: Fetch user profile (/api/auth/me)...");
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as any;
    assert(res.ok && data.email === "admin@ecosphere.com", "Decoded token fetches matching email.");
  } catch (err: any) {
    console.error("❌ Profile check failed:", err.message);
    process.exit(1);
  }

  // Test 3: ESG Aggregate Stats Cache
  try {
    console.log("📊 Running Stats Test: GET /api/esg_stats...");
    const res = await fetch(`${API_URL}/api/esg_stats`);
    const data = await res.json() as any;
    assert(res.ok && typeof data.totalEmissions === "number" && typeof data.activeGoals === "number", "Aggregate stats calculated or returned from cache.");
  } catch (err: any) {
    console.error("❌ Stats fetch failed:", err.message);
    process.exit(1);
  }

  // Test 4: CSR Activities Fetch
  try {
    console.log("🌱 Running Social CSR Test: GET /api/esg_csr_activities...");
    const res = await fetch(`${API_URL}/api/esg_csr_activities`);
    const data = await res.json() as any;
    assert(res.ok && Array.isArray(data), "CSR activities fetched as array.");
  } catch (err: any) {
    console.error("❌ CSR fetch failed:", err.message);
    process.exit(1);
  }

  // Test 5: Post Carbon Transaction & Stats Invalidation
  try {
    console.log("🌳 Running Environmental Test: Create carbon transaction...");
    const res = await fetch(`${API_URL}/api/esg_carbon_transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        department: "Corporate HQ",
        source: "Business Travel",
        description: "CLI Integration Test Flight",
        emissions: 2.5,
        date: new Date().toISOString(),
      })
    });
    const data = await res.json() as any;
    assert(res.ok && data.id && data.emissions === 2.5, "Carbon transaction created successfully.");
    testTxId = data.id;
  } catch (err: any) {
    console.error("❌ Carbon transaction post failed:", err.message);
    process.exit(1);
  }

  // Test 6: Verify Transaction List
  try {
    console.log("📋 Running Environmental Test: GET /api/esg_carbon_transactions...");
    const res = await fetch(`${API_URL}/api/esg_carbon_transactions`);
    const data = await res.json() as any;
    const exists = data.some((t: any) => t.id === testTxId);
    assert(res.ok && exists, "Created transaction exists in transaction ledger.");
  } catch (err: any) {
    console.error("❌ Carbon transactions fetch failed:", err.message);
    process.exit(1);
  }

  // Test 7: Governance Audits Retrieve
  try {
    console.log("⚖️ Running Governance Test: GET /api/esg_audits...");
    const res = await fetch(`${API_URL}/api/esg_audits`);
    const data = await res.json() as any;
    assert(res.ok && Array.isArray(data), "Compliance audits fetched successfully.");
  } catch (err: any) {
    console.error("❌ Audits fetch failed:", err.message);
    process.exit(1);
  }

  // Clean Up Test Transaction
  try {
    console.log("🧹 Running Clean Up: DELETE test transaction...");
    const res = await fetch(`${API_URL}/api/esg_carbon_transactions/${testTxId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(res.ok, "Test transaction cleaned up successfully.");
  } catch (err: any) {
    console.error("❌ Clean up failed:", err.message);
    process.exit(1);
  }

  console.log("\n🎉 All EcoSphere backend integration tests PASSED successfully!");
}

runTests();
