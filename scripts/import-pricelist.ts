/**
 * Import the Tele Express (or any) products & services price list into the
 * Product catalog.
 *
 * Usage:
 *   npm run import:pricelist -- ./path/to/pricelist.csv
 *   npm run import:pricelist -- ./path/to/pricelist.xlsx
 *
 * The script auto-detects columns by common header names. If your file uses
 * different headers, pass overrides:
 *   npm run import:pricelist -- ./list.xlsx --code=SKU --name=Description --mrc="Monthly" --nrc="One Time" --category=Type
 *
 * Recognised (case-insensitive) header aliases:
 *   code:        code, sku, item, item #, part, part number, product code
 *   name:        name, description, product, service, item name
 *   description: long description, details, notes
 *   category:    category, type, group, department
 *   mrc:         mrc, monthly, monthly recurring, monthly charge, recurring
 *   nrc:         nrc, one time, one-time, non recurring, setup, install
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { PrismaClient, ChargeType } from "@prisma/client";

const prisma = new PrismaClient();

type Args = { file?: string; [k: string]: string | undefined };

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, ...rest] = a.slice(2).split("=");
      args[k.toLowerCase()] = rest.join("=");
    } else if (!args.file) {
      args.file = a;
    }
  }
  return args;
}

const ALIASES: Record<string, string[]> = {
  code: ["code", "sku", "item", "item #", "item#", "part", "part number", "product code", "id"],
  name: ["name", "description", "product", "service", "item name", "product/service", "product name"],
  description: ["long description", "details", "notes", "comments"],
  category: ["category", "type", "group", "department", "class"],
  mrc: ["mrc", "monthly", "monthly recurring", "monthly charge", "recurring", "monthly rate", "mrc rate"],
  nrc: ["nrc", "one time", "one-time", "onetime", "non recurring", "non-recurring", "setup", "install", "nrc rate", "one time charge"],
};

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function detectColumn(headers: string[], field: string, override?: string): string | null {
  if (override) {
    const found = headers.find((h) => normalize(h) === normalize(override));
    if (found) return found;
    console.warn(`⚠ Override for "${field}" ("${override}") not found in headers.`);
  }
  const wanted = ALIASES[field] || [];
  // exact match first
  for (const h of headers) {
    if (wanted.includes(normalize(h))) return h;
  }
  // partial match
  for (const h of headers) {
    if (wanted.some((w) => normalize(h).includes(w))) return h;
  }
  return null;
}

function toNumber(v: unknown): number {
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function readRows(file: string): Record<string, any>[] {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".csv" || ext === ".tsv" || ext === ".txt") {
    const raw = fs.readFileSync(file, "utf8");
    return parse(raw, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });
  }
  // xlsx / xls
  const wb = XLSX.readFile(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    console.error("Usage: npm run import:pricelist -- ./pricelist.csv|.xlsx [--code=Col --name=Col --mrc=Col --nrc=Col --category=Col]");
    process.exit(1);
  }
  const file = path.resolve(args.file);
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }

  const rows = readRows(file);
  if (rows.length === 0) {
    console.error("No rows found in file.");
    process.exit(1);
  }
  const headers = Object.keys(rows[0]);
  console.log(`Detected ${rows.length} rows. Headers: ${headers.join(", ")}`);

  const cols = {
    code: detectColumn(headers, "code", args.code),
    name: detectColumn(headers, "name", args.name),
    description: detectColumn(headers, "description", args.description),
    category: detectColumn(headers, "category", args.category),
    mrc: detectColumn(headers, "mrc", args.mrc),
    nrc: detectColumn(headers, "nrc", args.nrc),
  };
  console.log("Column mapping:", cols);

  if (!cols.name) {
    console.error("Could not find a name/description column. Pass --name=YourColumnName");
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let index = 0;

  for (const row of rows) {
    index++;
    const name = cols.name ? String(row[cols.name] ?? "").trim() : "";
    if (!name) {
      skipped++;
      continue;
    }
    const mrc = cols.mrc ? toNumber(row[cols.mrc]) : 0;
    const nrc = cols.nrc ? toNumber(row[cols.nrc]) : 0;
    let chargeType: ChargeType = "NRC";
    if (mrc > 0 && nrc > 0) chargeType = "BOTH";
    else if (mrc > 0) chargeType = "MRC";

    // Build a stable, unique code.
    let code = cols.code ? String(row[cols.code] ?? "").trim() : "";
    if (!code) code = `PL-${String(index).padStart(5, "0")}`;

    const data = {
      code,
      name,
      description: cols.description ? String(row[cols.description] ?? "").trim() || null : null,
      category: cols.category ? String(row[cols.category] ?? "").trim() || null : null,
      chargeType,
      mrc,
      nrc,
      active: true,
    };

    try {
      const existing = await prisma.product.findUnique({ where: { code } });
      if (existing) {
        await prisma.product.update({ where: { code }, data });
        updated++;
      } else {
        await prisma.product.create({ data });
        created++;
      }
    } catch (e) {
      console.warn(`Row ${index} (${code}) failed:`, (e as Error).message);
      skipped++;
    }
  }

  console.log(`\n✔ Import complete. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
