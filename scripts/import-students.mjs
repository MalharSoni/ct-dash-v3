import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const sql = neon(process.env.DATABASE_URL);

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n") {
        row.push(cur);
        if (row.some((c) => c.trim())) rows.push(row);
        row = [];
        cur = "";
      } else if (ch !== "\r") cur += ch;
    }
  }
  if (cur || row.length) {
    row.push(cur);
    if (row.some((c) => c.trim())) rows.push(row);
  }
  return rows;
}

function clean(v) {
  if (v == null) return null;
  const t = v.trim();
  if (!t || t === "--") return null;
  return t;
}

// "Last, First" -> { firstName: "First", lastName: "Last" }
function splitName(raw) {
  const v = clean(raw);
  if (!v) return null;
  const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 1) {
    const words = parts[0].split(/\s+/);
    if (words.length === 1) return { firstName: words[0], lastName: "" };
    return { firstName: words[0], lastName: words.slice(1).join(" ") };
  }
  return { firstName: parts[1], lastName: parts[0] };
}

// Title-case a name like "WANG, JOVAN" → "Jovan Wang"
function tc(s) {
  if (!s) return s;
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function normalizePhone(p) {
  const v = clean(p);
  if (!v) return null;
  return v.replace(/\s+/g, " ").trim();
}

const csv = readFileSync(process.argv[2], "utf8");
const rows = parseCSV(csv);
const header = rows[0].map((h) => h.trim());
const data = rows.slice(1);

const col = (name) => header.indexOf(name);
const cStudent = col("Student");
const cG1 = col("Guardian 1");
const cG2 = col("Guardian 2");
const cEmail = col("E-Mail");
const cP1 = col("Phone 1");
const cP2 = col("Phone 2");
const cCity = col("City");
const cStreet = col("Street 1");

let created = 0;
let skipped = 0;
const skippedNames = [];

for (const r of data) {
  const sName = splitName(r[cStudent]);
  if (!sName?.firstName || !sName?.lastName) {
    skipped++;
    skippedNames.push(r[cStudent]);
    continue;
  }
  const firstName = tc(sName.firstName);
  const lastName = tc(sName.lastName);

  // Idempotency: skip if a student with same first+last already exists.
  const existing = await sql`
    SELECT id FROM "Student"
    WHERE "firstName" = ${firstName} AND "lastName" = ${lastName}
    LIMIT 1
  `;
  if (existing.length > 0) {
    skipped++;
    skippedNames.push(`${firstName} ${lastName} (already exists)`);
    continue;
  }

  const g1 = splitName(r[cG1]);
  const g2 = splitName(r[cG2]);
  const parentName =
    [g1, g2]
      .filter(Boolean)
      .map((p) => `${tc(p.firstName)} ${tc(p.lastName)}`.trim())
      .filter(Boolean)
      .join(" / ") || null;

  const parentEmail = clean(r[cEmail]);
  const parentPhone = normalizePhone(r[cP1]);
  const parentPhone2 = normalizePhone(r[cP2]);
  const finalParentPhone = [parentPhone, parentPhone2].filter(Boolean).join(" / ") || null;

  const street = clean(r[cStreet]);
  const city = clean(r[cCity]);
  const notes =
    [street, city].filter(Boolean).join(", ") || null;

  const id = randomUUID();
  await sql`
    INSERT INTO "Student" (
      id, "firstName", "lastName", "parentName", "parentEmail", "parentPhone",
      track, active, "joinedAt", "createdAt", "updatedAt", notes
    ) VALUES (
      ${id}, ${firstName}, ${lastName}, ${parentName}, ${parentEmail}, ${finalParentPhone},
      'PROJECTS'::"StudentTrack", true, NOW(), NOW(), NOW(), ${notes}
    )
  `;
  created++;
}

console.log(`Imported: ${created}`);
console.log(`Skipped: ${skipped}`);
if (skippedNames.length) {
  for (const n of skippedNames) console.log("  -", n);
}
