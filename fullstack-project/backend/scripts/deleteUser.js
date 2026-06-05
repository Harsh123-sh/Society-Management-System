require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    const userId = 8; // Change this

    await pool.query(
      `DELETE FROM users WHERE id = $1`,
      [userId]
    );

    console.log("User deleted:", userId);
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();