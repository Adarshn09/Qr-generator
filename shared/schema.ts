import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const qrCodes = pgTable("qr_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // url, text, email, phone, sms, wifi, vcard
  content: text("content").notNull(),
  shortCode: varchar("short_code").notNull().unique(),
  clickCount: integer("click_count").default(0),
  
  // Customization options
  foregroundColor: text("foreground_color").default("#000000"),
  backgroundColor: text("background_color").default("#ffffff"),
  size: integer("size").default(400),
  logoUrl: text("logo_url"),
  style: text("style").default("square"), // square, rounded, dots
  errorCorrection: text("error_correction").default("M"), // L, M, Q, H
  margin: integer("margin").default(2),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQrCodeSchema = createInsertSchema(qrCodes).omit({
  id: true,
  shortCode: true,
  clickCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;
export type QrCode = typeof qrCodes.$inferSelect;
