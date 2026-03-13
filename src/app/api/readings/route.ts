import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { readings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/readings?date=2026-03-13
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(readings)
    .where(eq(readings.date, date));

  // Convert rows to a map: { "17_15-1": "1234", ... }
  const data: Record<string, string> = {};
  for (const row of rows) {
    data[`${row.floor}_${row.unit}`] = row.value;
  }

  return NextResponse.json(data);
}

// POST /api/readings  body: { date, records: { "17_15-1": "1234", ... } }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, records } = body as {
    date: string;
    records: Record<string, string>;
  };

  if (!date || !records) {
    return NextResponse.json(
      { error: "date and records are required" },
      { status: 400 }
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date format" }, { status: 400 });
  }

  const entries = Object.entries(records).filter(([, v]) => v !== "");
  
  // Delete existing records for this date, then insert new ones
  await db.delete(readings).where(eq(readings.date, date));

  if (entries.length > 0) {
    const rows = entries.map(([key, value]) => {
      const [floorStr, unit] = key.split("_");
      const floor = parseInt(floorStr, 10);
      // Validate: floor 2-17, unit 15-1 to 15-6, value up to 4 digits
      if (floor < 2 || floor > 17 || !/^15-[1-6]$/.test(unit) || !/^\d{1,4}$/.test(value)) {
        throw new Error(`invalid entry: ${key}=${value}`);
      }
      return { date, floor, unit, value };
    });

    await db.insert(readings).values(rows);
  }

  return NextResponse.json({ success: true, count: entries.length });
}
