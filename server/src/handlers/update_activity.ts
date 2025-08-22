import { db } from '../db';
import { activitiesTable, type NewActivity } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateActivityInput, type Activity } from '../schema';

export const updateActivity = async (input: UpdateActivityInput): Promise<Activity> => {
  try {
    // Build the update object with only provided fields
    const updateData: Partial<NewActivity> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.estimated_start_date !== undefined) updateData.estimated_start_date = input.estimated_start_date.toISOString().split('T')[0];
    if (input.estimated_end_date !== undefined) updateData.estimated_end_date = input.estimated_end_date.toISOString().split('T')[0];
    if (input.actual_start_date !== undefined) updateData.actual_start_date = input.actual_start_date ? input.actual_start_date.toISOString().split('T')[0] : null;
    if (input.actual_end_date !== undefined) updateData.actual_end_date = input.actual_end_date ? input.actual_end_date.toISOString().split('T')[0] : null;
    if (input.contractor !== undefined) updateData.contractor = input.contractor;
    if (input.planned_budget_usd !== undefined) updateData.planned_budget_usd = input.planned_budget_usd.toString();
    if (input.actual_cost_crc !== undefined) updateData.actual_cost_crc = input.actual_cost_crc?.toString() || null;
    if (input.status !== undefined) updateData.status = input.status;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the activity record
    const result = await db.update(activitiesTable)
      .set(updateData)
      .where(eq(activitiesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Activity with id ${input.id} not found`);
    }

    // Convert the database result to the expected Activity type
    const dbActivity = result[0];
    return {
      id: dbActivity.id,
      project_id: dbActivity.project_id,
      name: dbActivity.name,
      description: dbActivity.description,
      estimated_start_date: new Date(dbActivity.estimated_start_date),
      estimated_end_date: new Date(dbActivity.estimated_end_date),
      actual_start_date: dbActivity.actual_start_date ? new Date(dbActivity.actual_start_date) : null,
      actual_end_date: dbActivity.actual_end_date ? new Date(dbActivity.actual_end_date) : null,
      contractor: dbActivity.contractor,
      planned_budget_usd: parseFloat(dbActivity.planned_budget_usd),
      actual_cost_crc: dbActivity.actual_cost_crc ? parseFloat(dbActivity.actual_cost_crc) : null,
      status: dbActivity.status,
      created_at: dbActivity.created_at,
      updated_at: dbActivity.updated_at
    };
  } catch (error) {
    console.error('Activity update failed:', error);
    throw error;
  }
};