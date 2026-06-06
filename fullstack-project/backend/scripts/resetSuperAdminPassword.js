require("dotenv").config({ path: __dirname + "/../.env" });
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

(async () => {
  try {
    const email = "sachwani25harsh@gmail.com";
    const newPassword = "Harsh52#Sachwani";

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      `
      UPDATE users
      SET password = $1,
          status = 'active',
          is_verified = true
      WHERE email = $2
        AND role = 'super_admin'
      RETURNING id, email, role, status, is_verified
      `,
      [hashedPassword, email]
    );

    console.table(result.rows);
    console.log("Super Admin password reset successfully");
    console.log("Email:", email);
    console.log("Password:", newPassword);

    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();