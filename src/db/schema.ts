import { pgTable, serial, integer, varchar, date, unique } from "drizzle-orm/pg-core";

export const readings = pgTable(
  "readings",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    floor: integer("floor").notNull(),
    unit: varchar("unit", { length: 10 }).notNull(),
    value: varchar("value", { length: 4 }).notNull(),
  },
  (t) => [unique().on(t.date, t.floor, t.unit)]
);
