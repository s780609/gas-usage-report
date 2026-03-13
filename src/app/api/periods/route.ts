import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { periods } from "@/db/schema";
import { desc } from "drizzle-orm";

// GET /api/periods — 取得所有期別（新到舊）
export async function GET() {
  const rows = await db
    .select()
    .from(periods)
    .orderBy(desc(periods.id));

  return NextResponse.json(rows);
}

// POST /api/periods  body: { label, readingDate }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { label, readingDate } = body as {
    label: string;
    readingDate: string;
  };

  if (!label || !readingDate) {
    return NextResponse.json(
      { error: "label and readingDate are required" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(readingDate)) {
    return NextResponse.json({ error: "invalid date format" }, { status: 400 });
  }

  const [row] = await db
    .insert(periods)
    .values({ label, readingDate })
    .returning();

  return NextResponse.json(row);
}
