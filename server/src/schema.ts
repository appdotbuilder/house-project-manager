import { z } from 'zod';

// Project schema
export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  total_budget_usd: z.number(),
  current_exchange_rate: z.number(), // USD to CRC exchange rate
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Project = z.infer<typeof projectSchema>;

// Activity schema
export const activitySchema = z.object({
  id: z.number(),
  project_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  estimated_start_date: z.coerce.date(),
  estimated_end_date: z.coerce.date(),
  actual_start_date: z.coerce.date().nullable(),
  actual_end_date: z.coerce.date().nullable(),
  contractor: z.string().nullable(),
  planned_budget_usd: z.number(),
  actual_cost_crc: z.number().nullable(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Activity = z.infer<typeof activitySchema>;

// Exchange rate history schema
export const exchangeRateHistorySchema = z.object({
  id: z.number(),
  project_id: z.number(),
  usd_to_crc_rate: z.number(),
  effective_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type ExchangeRateHistory = z.infer<typeof exchangeRateHistorySchema>;

// Input schemas for creating projects
export const createProjectInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  total_budget_usd: z.number().positive(),
  current_exchange_rate: z.number().positive(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

// Input schemas for updating projects
export const updateProjectInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  total_budget_usd: z.number().positive().optional(),
  current_exchange_rate: z.number().positive().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional()
});

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

// Input schemas for creating activities
export const createActivityInputSchema = z.object({
  project_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  estimated_start_date: z.coerce.date(),
  estimated_end_date: z.coerce.date(),
  contractor: z.string().nullable(),
  planned_budget_usd: z.number().positive()
});

export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;

// Input schemas for updating activities
export const updateActivityInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  estimated_start_date: z.coerce.date().optional(),
  estimated_end_date: z.coerce.date().optional(),
  actual_start_date: z.coerce.date().nullable().optional(),
  actual_end_date: z.coerce.date().nullable().optional(),
  contractor: z.string().nullable().optional(),
  planned_budget_usd: z.number().positive().optional(),
  actual_cost_crc: z.number().nullable().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional()
});

export type UpdateActivityInput = z.infer<typeof updateActivityInputSchema>;

// Input schema for updating exchange rate
export const updateExchangeRateInputSchema = z.object({
  project_id: z.number(),
  usd_to_crc_rate: z.number().positive()
});

export type UpdateExchangeRateInput = z.infer<typeof updateExchangeRateInputSchema>;

// Budget analysis response schema
export const budgetAnalysisSchema = z.object({
  project_id: z.number(),
  total_budget_usd: z.number(),
  total_planned_budget_usd: z.number(),
  total_actual_cost_usd: z.number(), // Converted from CRC
  remaining_budget_usd: z.number(),
  budget_utilization_percentage: z.number(),
  projected_total_cost_usd: z.number(),
  projected_over_budget_usd: z.number(), // 0 if not over budget
  is_over_budget_risk: z.boolean(),
  completed_activities_count: z.number(),
  total_activities_count: z.number(),
  project_completion_percentage: z.number()
});

export type BudgetAnalysis = z.infer<typeof budgetAnalysisSchema>;