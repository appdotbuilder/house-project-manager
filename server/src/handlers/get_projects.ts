import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type Project } from '../schema';

export const getProjects = async (): Promise<Project[]> => {
  try {
    // Fetch all projects from the database
    const results = await db.select()
      .from(projectsTable)
      .execute();

    // Convert numeric and date fields to proper types before returning
    return results.map(project => ({
      ...project,
      total_budget_usd: parseFloat(project.total_budget_usd),
      current_exchange_rate: parseFloat(project.current_exchange_rate),
      start_date: new Date(project.start_date),
      end_date: new Date(project.end_date)
    }));
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    throw error;
  }
};