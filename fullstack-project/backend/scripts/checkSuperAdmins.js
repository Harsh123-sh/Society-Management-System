require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");
const bcrypt = require("bcryptjs");

(async () => {
  try {
    const email = "sachwani25harsh@gmail.com ";
    const password = "Harsh52#Sachwani";

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `
      INSERT INTO users
      (name, email, password, role, status, is_verified)
      VALUES
      ($1, $2, $3, $4, $5, $6)
      `,
      [
        "Super Admin",
        email,
        hashedPassword,
        "super_admin",
        "active",
        true
      ]
    );

    console.log("✅ Super Admin Created");
    console.log("Email:", email);
    console.log("Password:", password);

    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();