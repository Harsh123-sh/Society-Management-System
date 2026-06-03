/**
 * Demo Data Seeder for AI Smart Society Management SaaS Platform
 * Creates 5 complete demo societies with all related data
 * 
 * Run with: node scripts/seedDemoSocieties.js
 */

const db = require("../config/db");
const bcrypt = require("bcryptjs");

// =====================================================
// DEMO SOCIETY DATA
// =====================================================
const DEMO_SOCIETIES = [
  {
    code: "GVR",
    slug: "green-valley",
    subdomain: "greenvalley",
    name: "Green Valley Residency",
    description: "Premium eco-friendly residential community",
    theme: {
      primary: "#059669",
      secondary: "#ffffff", 
      accent: "#10b981",
      background: "#f0fdf4",
      card: "#ecfdf5",
      mode: "light",
      gradient_style: "emerald-to-white",
      sidebar_style: "colored",
      button_style: "rounded",
      font_family: "Inter",
      accent_radius: "rounded-lg",
      preset: "eco"
    },
    logo_url: null,
    wings: [
      { name: "Wing A", code: "A", structureType: "wing", totalFloors: 10, unitsPerFloor: 4 },
      { name: "Wing B", code: "B", structureType: "wing", totalFloors: 10, unitsPerFloor: 4 },
      { name: "Wing C", code: "C", structureType: "wing", totalFloors: 10, unitsPerFloor: 4 }
    ]
  },
  {
    code: "RH",
    slug: "royal-heights",
    subdomain: "royalheights",
    name: "Royal Heights",
    description: "Luxury residential tower complex",
    theme: {
      primary: "#1f2937",
      secondary: "#fbbf24",
      accent: "#fcd34d",
      background: "#111827",
      card: "#1f2937",
      mode: "dark",
      gradient_style: "gold-to-black",
      sidebar_style: "dark",
      button_style: "square",
      font_family: "Playfair Display",
      accent_radius: "rounded-none",
      preset: "luxury"
    },
    logo_url: null,
    wings: [
      { name: "Tower Alpha", code: "ALPHA", structureType: "tower", totalFloors: 15, unitsPerFloor: 3 },
      { name: "Tower Beta", code: "BETA", structureType: "tower", totalFloors: 15, unitsPerFloor: 3 }
    ]
  },
  {
    code: "SKY",
    slug: "skyline-enclave",
    subdomain: "skylineenclave",
    name: "Skyline Enclave",
    description: "Corporate-style residential community",
    theme: {
      primary: "#0284c7",
      secondary: "#e2e8f0",
      accent: "#0ea5e9",
      background: "#f8fafc",
      card: "#f1f5f9",
      mode: "light",
      gradient_style: "blue-to-silver",
      sidebar_style: "light",
      button_style: "rounded",
      font_family: "Inter",
      accent_radius: "rounded-md",
      preset: "corporate"
    },
    logo_url: null,
    wings: [
      { name: "Tower 1", code: "T1", structureType: "tower", totalFloors: 12, unitsPerFloor: 4 },
      { name: "Tower 2", code: "T2", structureType: "tower", totalFloors: 12, unitsPerFloor: 4 },
      { name: "Tower 3", code: "T3", structureType: "tower", totalFloors: 12, unitsPerFloor: 4 }
    ]
  },
  {
    code: "LV",
    slug: "lakeview-homes",
    subdomain: "lakeviewhomes",
    name: "Lakeview Homes",
    description: "Waterfront residential community",
    theme: {
      primary: "#0891b2",
      secondary: "#001f3f",
      accent: "#06b6d4",
      background: "#ecf0f1",
      card: "#ffffff",
      mode: "light",
      gradient_style: "cyan-to-navy",
      sidebar_style: "colored",
      button_style: "pill",
      font_family: "Segoe UI",
      accent_radius: "rounded-full",
      preset: "aqua"
    },
    logo_url: null,
    wings: [
      { name: "Block A", code: "BLK-A", structureType: "block", totalFloors: 8, unitsPerFloor: 5 },
      { name: "Block B", code: "BLK-B", structureType: "block", totalFloors: 8, unitsPerFloor: 5 },
      { name: "Block C", code: "BLK-C", structureType: "block", totalFloors: 8, unitsPerFloor: 5 },
      { name: "Block D", code: "BLK-D", structureType: "block", totalFloors: 8, unitsPerFloor: 5 }
    ]
  },
  {
    code: "SR",
    slug: "sunrise-residency",
    subdomain: "sunriseresidency",
    name: "Sunrise Residency",
    description: "Premium commercial-residential community",
    theme: {
      primary: "#ea580c",
      secondary: "#7c3aed",
      accent: "#f97316",
      background: "#fef3c7",
      card: "#fff7ed",
      mode: "light",
      gradient_style: "orange-to-purple",
      sidebar_style: "colored",
      button_style: "rounded",
      font_family: "Poppins",
      accent_radius: "rounded-xl",
      preset: "premium"
    },
    logo_url: null,
    wings: [
      { name: "Wing East", code: "E", structureType: "wing", totalFloors: 14, unitsPerFloor: 5 },
      { name: "Wing West", code: "W", structureType: "wing", totalFloors: 14, unitsPerFloor: 5 }
    ]
  }
];

// =====================================================
// DEMO USERS TEMPLATE
// =====================================================
function generateDemoUsers(societyName, societyId) {
  const societyCode = societyName.split(" ")[0].toLowerCase();
  
  return [
    // Secretary / Admin
    {
      name: `${societyName} Secretary`,
      email: `secretary@${societyCode}.demo.local`,
      phone: `+91${Math.random().toString().slice(2, 12)}`,
      password: "Secretary@123",
      role: "secretary",
      resident_type: null,
      status: "active",
      approval_status: "approved",
      is_verified: 1,
      society_id: societyId,
      flat_id: null,
      flat_number: null
    },
    
    // 5 Owners
    ...Array.from({ length: 5 }, (_, i) => ({
      name: `Owner ${i + 1} ${societyName}`,
      email: `owner${i + 1}@${societyCode}.demo.local`,
      phone: `+91${Math.random().toString().slice(2, 12)}`,
      password: "Owner@123",
      role: "resident",
      resident_type: "owner",
      status: "active",
      approval_status: "approved",
      is_verified: 1,
      society_id: societyId,
      flat_id: null,
      flat_number: `${101 + i}`
    })),
    
    // 2 Tenants
    ...Array.from({ length: 2 }, (_, i) => ({
      name: `Tenant ${i + 1} ${societyName}`,
      email: `tenant${i + 1}@${societyCode}.demo.local`,
      phone: `+91${Math.random().toString().slice(2, 12)}`,
      password: "Tenant@123",
      role: "resident",
      resident_type: "tenant",
      status: "active",
      approval_status: "approved",
      is_verified: 1,
      society_id: societyId,
      flat_id: null,
      flat_number: `${201 + i}`
    })),
    
    // 2 Staff
    ...Array.from({ length: 2 }, (_, i) => ({
      name: `Staff Member ${i + 1}`,
      email: `staff${i + 1}@${societyCode}.demo.local`,
      phone: `+91${Math.random().toString().slice(2, 12)}`,
      password: "Staff@123",
      role: "staff",
      resident_type: null,
      status: "active",
      approval_status: "approved",
      is_verified: 1,
      society_id: societyId,
      flat_id: null,
      flat_number: null
    })),
    
    // 5 Security Guards
    ...Array.from({ length: 5 }, (_, i) => ({
      name: `Security Guard ${i + 1}`,
      email: `security${i + 1}@${societyCode}.demo.local`,
      phone: `+91${Math.random().toString().slice(2, 12)}`,
      password: "Security@123",
      role: "security",
      resident_type: null,
      status: "active",
      approval_status: "approved",
      is_verified: 1,
      society_id: societyId,
      flat_id: null,
      flat_number: null
    }))
  ];
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function createSociety(societyData) {
  try {
    const { rows: result } = await db.query(
      `INSERT INTO societies (
        code, slug, subdomain, name, 
        theme_primary, theme_secondary, theme_accent, theme_background, 
        theme_card, theme_mode, theme_gradient_style, sidebar_style, 
        button_style, font_family, accent_radius, theme_preset
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        societyData.code,
        societyData.slug,
        societyData.subdomain,
        societyData.name,
        societyData.theme.primary,
        societyData.theme.secondary,
        societyData.theme.accent,
        societyData.theme.background,
        societyData.theme.card,
        societyData.theme.mode,
        societyData.theme.gradient_style,
        societyData.theme.sidebar_style,
        societyData.theme.button_style,
        societyData.theme.font_family,
        societyData.theme.accent_radius,
        societyData.theme.preset
      ]
    );
    
    return result.insertId;
  } catch (error) {
    console.error("Error creating society:", error);
    throw error;
  }
}

async function createWings(societyId, wingTemplates, createdBy) {
  const wings = [];
  
  for (const wing of wingTemplates) {
    const { rows: result } = await db.query(
      `INSERT INTO wings (
        society_id, name, code, structure_type, total_floors, 
        units_per_floor, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        societyId,
        wing.name,
        wing.code,
        wing.structureType,
        wing.totalFloors,
        wing.unitsPerFloor,
        createdBy
      ]
    );
    
    wings.push({ id: result.insertId, ...wing });
  }
  
  return wings;
}

async function createFlats(societyId, wings, createdBy) {
  const flats = [];
  
  for (const wing of wings) {
    for (let floor = 1; floor <= wing.totalFloors; floor++) {
      for (let unit = 1; unit <= wing.unitsPerFloor; unit++) {
        const flatNumber = `${floor}0${unit}`;
        
        try {
          const { rows: result } = await db.query(
            `INSERT INTO flats (
              society_id, wing_id, building_name, flat_number, floor, flat_type, 
              status, approval_status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, 'vacant', 'approved', ?)`,
            [
              societyId,
              wing.id,
              wing.name,
              `${wing.code}-${flatNumber}`,
              `${floor}`,
              unit === 1 ? "1BHK" : unit === 2 ? "2BHK" : "3BHK",
              createdBy
            ]
          );
          
          flats.push(result.insertId);
        } catch (error) {
          console.error(`Error creating flat ${flatNumber} in ${wing.name}:`, error);
        }
      }
    }
  }
  
  return flats;
}

async function createUsers(societyId, userTemplates, demoUserId) {
  const users = [];
  
  for (const userTemplate of userTemplates) {
    try {
      const hashedPassword = await hashPassword(userTemplate.password);
      
      const { rows: result } = await db.query(
        `INSERT INTO users (
          name, email, phone, password, role, resident_type, status, 
          approval_status, is_verified, society_id, flat_id, flat_number, 
          approved_by, approved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          userTemplate.name,
          userTemplate.email,
          userTemplate.phone,
          hashedPassword,
          userTemplate.role,
          userTemplate.resident_type,
          userTemplate.status,
          userTemplate.approval_status,
          userTemplate.is_verified,
          userTemplate.society_id,
          userTemplate.flat_id,
          userTemplate.flat_number,
          demoUserId
        ]
      );
      
      users.push({ id: result.insertId, email: userTemplate.email });
    } catch (error) {
      console.error(`Error creating user ${userTemplate.email}:`, error);
    }
  }
  
  return users;
}

async function markAsDemo(entityType, entityId, societyId) {
  try {
    await db.query(
      `INSERT INTO demo_data_markers (entity_type, entity_id, society_id, is_demo) 
      VALUES (?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE is_demo = 1`,
      [entityType, entityId, societyId]
    );
  } catch (error) {
    // Ignore errors if table doesn't exist yet
  }
}

// =====================================================
// MAIN SEEDER FUNCTION
// =====================================================
async function seedDemoSocieties() {
  try {
    console.log("\n=== Starting Demo Societies Seed ===\n");
    
    // Get or create super admin
    let [superAdminRows] = await db.query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      ["superadmin@demo.local"]
    );
    
    let superAdminId = null;
    
    if (superAdminRows.length === 0) {
      const hashedPassword = await hashPassword("SuperAdmin@123");
      const { rows: result } = await db.query(
        `INSERT INTO users (
          name, email, phone, password, role, status, approval_status, is_verified
        ) VALUES (?, ?, ?, ?, 'super_admin', 'active', 'approved', 1)`,
        ["Demo Super Admin", "superadmin@demo.local", "+91-DEMO-001", hashedPassword]
      );
      superAdminId = result.insertId;
      console.log("✓ Created Super Admin user");
    } else {
      superAdminId = superAdminRows[0].id;
      console.log("✓ Super Admin user already exists");
    }
    
    // Create each demo society
    for (const societyData of DEMO_SOCIETIES) {
      console.log(`\n→ Creating society: ${societyData.name}`);
      
      // Create society
      const societyId = await createSociety(societyData);
      await markAsDemo("society", societyId, societyId);
      console.log(`  ✓ Society created (ID: ${societyId})`);
      
      // Create wings/towers
      const wings = await createWings(societyId, societyData.wings, superAdminId);
      for (const wing of wings) {
        await markAsDemo("wing", wing.id, societyId);
      }
      console.log(`  ✓ Created ${wings.length} wings/towers`);
      
      // Create flats
      const flats = await createFlats(societyId, wings, superAdminId);
      for (const flatId of flats) {
        await markAsDemo("flat", flatId, societyId);
      }
      console.log(`  ✓ Created ${flats.length} flats`);
      
      // Create users
      const userTemplates = generateDemoUsers(societyData.name, societyId);
      const users = await createUsers(societyId, userTemplates, superAdminId);
      for (const user of users) {
        await markAsDemo("user", user.id, societyId);
      }
      console.log(`  ✓ Created ${users.length} users`);
      
      // Update society with primary admin (secretary)
      const secretaryUser = users.find(u => u.email.includes("secretary"));
      if (secretaryUser) {
        await db.query(
          `UPDATE societies SET primary_admin_user_id = ? WHERE id = ?`,
          [secretaryUser.id, societyId]
        );
      }
    }
    
    console.log("\n=== Demo Societies Seed Completed Successfully ===\n");
    console.log("Demo Societies Created:");
    DEMO_SOCIETIES.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.name} (${s.code})`);
    });
    
    console.log("\nSuper Admin Credentials:");
    console.log("  Email: superadmin@demo.local");
    console.log("  Password: SuperAdmin@123");
    
    console.log("\nSample User Credentials:");
    console.log("  Secretary: secretary@greenvalley.demo.local / Secretary@123");
    console.log("  Owner: owner1@greenvalley.demo.local / Owner@123");
    console.log("  Tenant: tenant1@greenvalley.demo.local / Tenant@123");
    console.log("  Staff: staff1@greenvalley.demo.local / Staff@123");
    console.log("  Security: security1@greenvalley.demo.local / Security@123");
    
  } catch (error) {
    console.error("\n✗ Error seeding demo societies:", error);
    process.exit(1);
  }
}

// =====================================================
// RESET FUNCTION (DELETE ALL DEMO DATA)
// =====================================================
async function resetDemoSocieties() {
  try {
    console.log("\n=== Starting Demo Data Reset ===\n");
    
    // Get all demo societies
    const { rows: demoMarkers } = await db.query(
      `SELECT DISTINCT society_id FROM demo_data_markers WHERE is_demo = 1`
    );
    
    console.log(`Found ${demoMarkers.length} demo societies to delete`);
    
    for (const marker of demoMarkers) {
      const societyId = marker.society_id;
      
      // Delete in order of dependencies
      await db.query(`DELETE FROM demo_data_markers WHERE society_id = ?`, [societyId]);
      await db.query(`DELETE FROM chat_messages WHERE thread_id IN (
        SELECT id FROM chat_threads WHERE society_id = ?
      )`, [societyId]);
      await db.query(`DELETE FROM chat_thread_members WHERE thread_id IN (
        SELECT id FROM chat_threads WHERE society_id = ?
      )`, [societyId]);
      await db.query(`DELETE FROM chat_threads WHERE society_id = ?`, [societyId]);
      await db.query(`DELETE FROM ai_chats WHERE society_id = ?`, [societyId]);
      await db.query(`DELETE FROM user_approvals WHERE society_id = ?`, [societyId]);
      await db.query(`DELETE FROM flats WHERE society_id = ?`, [societyId]);
      await db.query(`DELETE FROM wings WHERE society_id = ?`, [societyId]);
      await db.query(`DELETE FROM users WHERE society_id = ?`, [societyId]);
      await db.query(`DELETE FROM societies WHERE id = ?`, [societyId]);
      
      console.log(`  ✓ Deleted society ${societyId}`);
    }
    
    console.log("\n=== Demo Data Reset Completed ===\n");
    
  } catch (error) {
    console.error("\n✗ Error resetting demo data:", error);
    process.exit(1);
  }
}

// =====================================================
// CLI INTERFACE
// =====================================================
const command = process.argv[2];

if (command === "reset") {
  resetDemoSocieties().then(() => process.exit(0));
} else {
  seedDemoSocieties().then(() => process.exit(0));
}

module.exports = { seedDemoSocieties, resetDemoSocieties };
