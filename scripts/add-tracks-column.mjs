// One-time schema bump: add Student.tracks (StudentTrack[]) and backfill from track.
// Runs through @neondatabase/serverless so it works without direct TCP.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(url);

async function run() {
  // 1. Add the column with a default of an empty array. We'll backfill next.
  await sql`
    ALTER TABLE "Student"
    ADD COLUMN IF NOT EXISTS "tracks" "StudentTrack"[] NOT NULL DEFAULT ARRAY[]::"StudentTrack"[]
  `;

  // 2. Backfill: for any student whose tracks is empty, seed it with [track].
  const result = await sql`
    UPDATE "Student"
    SET "tracks" = ARRAY["track"]::"StudentTrack"[]
    WHERE cardinality("tracks") = 0
    RETURNING id
  `;

  console.log(`Added Student.tracks; backfilled ${result.length} rows.`);

  // 3. Set a sensible default for new rows going forward.
  await sql`
    ALTER TABLE "Student"
    ALTER COLUMN "tracks" SET DEFAULT ARRAY['FOUNDATION']::"StudentTrack"[]
  `;

  console.log("Default for tracks set to ['FOUNDATION'].");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
