require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    const userId = 10; // change this ID

    await pool.query(
      `
      UPDATE users
      SET status = 'active',
          is_verified = true
      WHERE id = $1
      `,
      [userId]
    );

    await pool.query(
      `
      UPDATE user_approvals
      SET status = 'approved',
          approved_at = NOW()
      WHERE user_id = $1
      `,
      [userId]
    );

    console.log("User approved successfully:", userId);
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();