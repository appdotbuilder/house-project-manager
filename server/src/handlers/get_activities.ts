import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { type Activity } from '../schema';

export const getActivities = async (projectId: number): Promise<Activity[]> => {
  try {
    // Fetch all activities for the specified project, ordered by estimated start date
    const results = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.project_id, projectId))
      .orderBy(asc(activitiesTable.estimated_start_date))
      .execute();

    // Convert numeric and date fields to proper types
    return results.map(activity => ({
      ...activity,
      planned_budget_usd: parseFloat(activity.planned_budget_usd),
      actual_cost_crc: activity.actual_cost_crc ? parseFloat(activity.actual_cost_crc) : null,
      estimated_start_date: new Date(activity.estimated_start_date),
      estimated_end_date: new Date(activity.estimated_end_date),
      actual_start_date: activity.actual_start_date ? new Date(activity.actual_start_date) : null,
      actual_end_date: activity.actual_end_date ? new Date(activity.actual_end_date) : null
    }));
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    throw error;
  }
};