import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type UpdateProjectInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProject = async (input: UpdateProjectInput): Promise<Project> => {
  try {
    // Build the update values object, only including fields that are provided
    const updateValues: Partial<typeof projectsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateValues.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateValues.description = input.description;
    }
    
    if (input.total_budget_usd !== undefined) {
      updateValues.total_budget_usd = input.total_budget_usd.toString();
    }
    
    if (input.current_exchange_rate !== undefined) {
      updateValues.current_exchange_rate = input.current_exchange_rate.toString();
    }
    
    if (input.start_date !== undefined) {
      updateValues.start_date = input.start_date.toISOString().split('T')[0];
    }
    
    if (input.end_date !== undefined) {
      updateValues.end_date = input.end_date.toISOString().split('T')[0];
    }

    // Always update the updated_at timestamp
    updateValues.updated_at = new Date();

    // Update the project record
    const result = await db.update(projectsTable)
      .set(updateValues)
      .where(eq(projectsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Project with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers and handle date conversion
    const project = result[0];
    return {
      ...project,
      total_budget_usd: parseFloat(project.total_budget_usd),
      current_exchange_rate: parseFloat(project.current_exchange_rate),
      start_date: new Date(project.start_date),
      end_date: new Date(project.end_date)
    };
  } catch (error) {
    console.error('Project update failed:', error);
    throw error;
  }
};