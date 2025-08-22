import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type CreateProjectInput, type Project } from '../schema';

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  try {
    // Insert project record
    const result = await db.insert(projectsTable)
      .values({
        name: input.name,
        description: input.description,
        total_budget_usd: input.total_budget_usd.toString(), // Convert number to string for numeric column
        current_exchange_rate: input.current_exchange_rate.toString(), // Convert number to string for numeric column
        start_date: input.start_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        end_date: input.end_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
      })
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const project = result[0];
    return {
      ...project,
      total_budget_usd: parseFloat(project.total_budget_usd), // Convert string back to number
      current_exchange_rate: parseFloat(project.current_exchange_rate), // Convert string back to number
      start_date: new Date(project.start_date), // Convert string back to Date
      end_date: new Date(project.end_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Project creation failed:', error);
    throw error;
  }
};