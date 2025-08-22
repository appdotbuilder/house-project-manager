import { db } from '../db';
import { projectsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Project } from '../schema';

export const getProjectById = async (id: number): Promise<Project | null> => {
  try {
    const results = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const project = results[0];
    
    // Convert numeric and date fields for the response
    return {
      ...project,
      total_budget_usd: parseFloat(project.total_budget_usd),
      current_exchange_rate: parseFloat(project.current_exchange_rate),
      start_date: new Date(project.start_date),
      end_date: new Date(project.end_date)
    };
  } catch (error) {
    console.error('Failed to get project by ID:', error);
    throw error;
  }
};