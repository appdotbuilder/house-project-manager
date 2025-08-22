import { db } from '../db';
import { activitiesTable, projectsTable } from '../db/schema';
import { type CreateActivityInput, type Activity } from '../schema';
import { eq } from 'drizzle-orm';

export const createActivity = async (input: CreateActivityInput): Promise<Activity> => {
  try {
    // Verify that the project exists before creating the activity
    const existingProject = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (existingProject.length === 0) {
      throw new Error(`Project with id ${input.project_id} not found`);
    }

    // Insert activity record
    const result = await db.insert(activitiesTable)
      .values({
        project_id: input.project_id,
        name: input.name,
        description: input.description,
        estimated_start_date: input.estimated_start_date.toISOString().split('T')[0], // Convert Date to string
        estimated_end_date: input.estimated_end_date.toISOString().split('T')[0], // Convert Date to string
        contractor: input.contractor,
        planned_budget_usd: input.planned_budget_usd.toString(), // Convert number to string for numeric column
        status: 'planned'
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and dates back to Date objects before returning
    const activity = result[0];
    return {
      ...activity,
      estimated_start_date: new Date(activity.estimated_start_date),
      estimated_end_date: new Date(activity.estimated_end_date),
      actual_start_date: activity.actual_start_date ? new Date(activity.actual_start_date) : null,
      actual_end_date: activity.actual_end_date ? new Date(activity.actual_end_date) : null,
      planned_budget_usd: parseFloat(activity.planned_budget_usd), // Convert string back to number
      actual_cost_crc: activity.actual_cost_crc ? parseFloat(activity.actual_cost_crc) : null
    };
  } catch (error) {
    console.error('Activity creation failed:', error);
    throw error;
  }
};