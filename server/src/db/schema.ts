import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  date,
  pgEnum 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define activity status enum
export const activityStatusEnum = pgEnum('activity_status', [
  'planned', 
  'in_progress', 
  'completed', 
  'cancelled'
]);

// Projects table
export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  total_budget_usd: numeric('total_budget_usd', { precision: 12, scale: 2 }).notNull(),
  current_exchange_rate: numeric('current_exchange_rate', { precision: 8, scale: 4 }).notNull(), // USD to CRC rate
  start_date: date('start_date').notNull(),
  end_date: date('end_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Activities table
export const activitiesTable = pgTable('activities', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').references(() => projectsTable.id).notNull(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  estimated_start_date: date('estimated_start_date').notNull(),
  estimated_end_date: date('estimated_end_date').notNull(),
  actual_start_date: date('actual_start_date'), // Nullable
  actual_end_date: date('actual_end_date'), // Nullable
  contractor: text('contractor'), // Nullable
  planned_budget_usd: numeric('planned_budget_usd', { precision: 10, scale: 2 }).notNull(),
  actual_cost_crc: numeric('actual_cost_crc', { precision: 12, scale: 2 }), // Nullable, stored in CRC
  status: activityStatusEnum('status').notNull().default('planned'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Exchange rate history table
export const exchangeRateHistoryTable = pgTable('exchange_rate_history', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').references(() => projectsTable.id).notNull(),
  usd_to_crc_rate: numeric('usd_to_crc_rate', { precision: 8, scale: 4 }).notNull(),
  effective_date: timestamp('effective_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Define relations
export const projectsRelations = relations(projectsTable, ({ many }) => ({
  activities: many(activitiesTable),
  exchangeRateHistory: many(exchangeRateHistoryTable),
}));

export const activitiesRelations = relations(activitiesTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [activitiesTable.project_id],
    references: [projectsTable.id],
  }),
}));

export const exchangeRateHistoryRelations = relations(exchangeRateHistoryTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [exchangeRateHistoryTable.project_id],
    references: [projectsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Project = typeof projectsTable.$inferSelect;
export type NewProject = typeof projectsTable.$inferInsert;

export type Activity = typeof activitiesTable.$inferSelect;
export type NewActivity = typeof activitiesTable.$inferInsert;

export type ExchangeRateHistory = typeof exchangeRateHistoryTable.$inferSelect;
export type NewExchangeRateHistory = typeof exchangeRateHistoryTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  projects: projectsTable, 
  activities: activitiesTable,
  exchangeRateHistory: exchangeRateHistoryTable
};