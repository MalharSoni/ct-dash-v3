// One-time schema bump for the trial acceptance email feature.
// Adds email-template defaults to OrgSettings and email-tracking columns to
// TrialAssessment. Idempotent — safe to re-run.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(url);

async function run() {
  // OrgSettings — email-template fields with sensible defaults baked in.
  await sql`
    ALTER TABLE "OrgSettings"
    ADD COLUMN IF NOT EXISTS "senderName"             TEXT NOT NULL DEFAULT 'Ingrid Huang',
    ADD COLUMN IF NOT EXISTS "senderCompany"          TEXT NOT NULL DEFAULT 'STEM SPACE 4K EDUCATION GROUP INC.',
    ADD COLUMN IF NOT EXISTS "programName"            TEXT NOT NULL DEFAULT 'High School Program',
    ADD COLUMN IF NOT EXISTS "programAddress"         TEXT NOT NULL DEFAULT '205 Riviera Drive, Unit 2, Markham ON L3R 5J6',
    ADD COLUMN IF NOT EXISTS "whatsappNumber"         TEXT NOT NULL DEFAULT '(647) 456-7788',
    ADD COLUMN IF NOT EXISTS "registrationUrl"        TEXT NOT NULL DEFAULT 'https://portal.iclasspro.com/cautiontape/class-details/87',
    ADD COLUMN IF NOT EXISTS "aiProgramUrl"           TEXT NOT NULL DEFAULT 'https://portfolio.ct839.com/en/',
    ADD COLUMN IF NOT EXISTS "materialPaymentEmail"   TEXT NOT NULL DEFAULT 'vrcparts@cautiontape.ca',
    ADD COLUMN IF NOT EXISTS "monthlyFeeLabel"        TEXT NOT NULL DEFAULT '$475 + tax',
    ADD COLUMN IF NOT EXISTS "materialDepositLabel"   TEXT NOT NULL DEFAULT '$200',
    ADD COLUMN IF NOT EXISTS "materialBalanceLabel"   TEXT NOT NULL DEFAULT '$800',
    ADD COLUMN IF NOT EXISTS "materialRefreshLabel"   TEXT NOT NULL DEFAULT '$1,000',
    ADD COLUMN IF NOT EXISTS "foundationDurationLabel" TEXT NOT NULL DEFAULT '4-month',
    ADD COLUMN IF NOT EXISTS "emailCcList"            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
  `;

  // TrialAssessment — track who marked the parent email as sent and when.
  await sql`
    ALTER TABLE "TrialAssessment"
    ADD COLUMN IF NOT EXISTS "emailSentAt"   TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "emailSentById" TEXT
  `;

  console.log("OrgSettings + TrialAssessment columns added.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
