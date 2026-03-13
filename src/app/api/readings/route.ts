import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { periods, readings } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/readings?periodId=1
export async function GET(request: NextRequest) {
  const periodId = request.nextUrl.searchParams.get("periodId");
  if (!periodId) {
    return NextResponse.json({ error: "periodId is required" }, { status: 400 });
  }

  const id = parseInt(periodId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "invalid periodId" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(readings)
    .where(eq(readings.periodId, id));

  const data: Record<string, string> = {};
  for (const row of rows) {
    data[`${row.floor}_${row.unit}`] = row.value;
  }

  return NextResponse.json(data);
}

// POST /api/readings  body: { periodId, records: { "17_15-1": "1234", ... } }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { periodId, records } = body as {
    periodId: number;
    records: Record<string, string>;
  };

  if (!periodId || !records) {
    return NextResponse.json(
      { error: "periodId and records are required" },
      { status: 400 }
    );
  }

  // Verify period exists
  const [period] = await db.select().from(periods).where(eq(periods.id, periodId));
  if (!period) {
    return NextResponse.json({ error: "period not found" }, { status: 404 });
  }

  const entries = Object.entries(records).filter(([, v]) => v !== "");

  // Delete existing records for this period, then insert new ones
  await db.delete(readings).where(eq(readings.periodId, periodId));

  if (entries.length > 0) {
    const rows = entries.map(([key, value]) => {
      const [floorStr, unit] = key.split("_");
      const floor = parseInt(floorStr, 10);
      if (floor < 2 || floor > 17 || !/^15-[1-6]$/.test(unit) || !/^\d{1,4}$/.test(value)) {
        throw new Error(`invalid entry: ${key}=${value}`);
      }
      return { periodId, floor, unit, value };
    });

    await db.insert(readings).values(rows);
  }

  return NextResponse.json({ success: true, count: entries.length });
}
