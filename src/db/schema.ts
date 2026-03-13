import { pgTable, serial, integer, varchar, date, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 每一期抄表紀錄
export const periods = pgTable("periods", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 50 }).notNull(),        // e.g. "2026年3月"
  readingDate: date("reading_date").notNull(),               // 抄表日期
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 每戶度數
export const readings = pgTable(
  "readings",
  {
    id: serial("id").primaryKey(),
    periodId: integer("period_id").notNull().references(() => periods.id, { onDelete: "cascade" }),
    floor: integer("floor").notNull(),                       // 2~17
    unit: varchar("unit", { length: 10 }).notNull(),         // "15-1" ~ "15-6"
    value: varchar("value", { length: 4 }).notNull(),        // 4碼度數
  },
  (t) => [unique().on(t.periodId, t.floor, t.unit)]
);

// Relations
export const periodsRelations = relations(periods, ({ many }) => ({
  readings: many(readings),
}));

export const readingsRelations = relations(readings, ({ one }) => ({
  period: one(periods, { fields: [readings.periodId], references: [periods.id] }),
}));
