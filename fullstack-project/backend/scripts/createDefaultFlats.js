require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    const societyId = 6; // Change if needed

    const wings = ["A", "B", "C", "D", "E", "F"];

    for (const wing of wings) {
      for (let floor = 1; floor <= 5; floor++) {
        for (let flat = 1; flat <= 4; flat++) {
          const flatNumber = `${floor}0${flat}`;

          await pool.query(
            `
            INSERT INTO flats
            (
              society_id,
              wing,
              floor,
              flat_number,
              status,
              occupancy_status,
              approval_status,
              created_at
            )
            VALUES
            (
              $1,$2,$3,$4,
              'vacant',
              'vacant',
              'approved',
              NOW()
            )
            ON CONFLICT DO NOTHING
          `,
            [societyId, wing, floor.toString(), flatNumber]
          );
        }
      }
    }

    console.log("120 flats created successfully");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();