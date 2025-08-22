import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { getProjectById } from '../handlers/get_project_by_id';

const testProject = {
  name: 'Test Construction Project',
  description: 'A test project for construction management',
  total_budget_usd: '150000.50',
  current_exchange_rate: '525.75',
  start_date: '2024-01-15',
  end_date: '2024-12-15'
};

describe('getProjectById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return project when ID exists', async () => {
    // Create a test project
    const insertResults = await db.insert(projectsTable)
      .values(testProject)
      .returning()
      .execute();

    const createdProject = insertResults[0];
    
    // Fetch the project by ID
    const result = await getProjectById(createdProject.id);

    // Verify all fields are returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdProject.id);
    expect(result!.name).toEqual('Test Construction Project');
    expect(result!.description).toEqual('A test project for construction management');
    expect(result!.total_budget_usd).toEqual(150000.50);
    expect(result!.current_exchange_rate).toEqual(525.75);
    expect(result!.start_date).toBeInstanceOf(Date);
    expect(result!.end_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify numeric types are properly converted
    expect(typeof result!.total_budget_usd).toBe('number');
    expect(typeof result!.current_exchange_rate).toBe('number');
  });

  it('should return null when project ID does not exist', async () => {
    const result = await getProjectById(999);
    expect(result).toBeNull();
  });

  it('should handle project with null description', async () => {
    // Create project with null description
    const projectWithNullDesc = {
      ...testProject,
      description: null
    };

    const insertResults = await db.insert(projectsTable)
      .values(projectWithNullDesc)
      .returning()
      .execute();

    const createdProject = insertResults[0];
    const result = await getProjectById(createdProject.id);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.name).toEqual('Test Construction Project');
    expect(result!.total_budget_usd).toEqual(150000.50);
  });

  it('should handle large numeric values correctly', async () => {
    // Test with very large budget and precise exchange rate
    const largeProject = {
      ...testProject,
      total_budget_usd: '9999999999.99',
      current_exchange_rate: '1234.5678'
    };

    const insertResults = await db.insert(projectsTable)
      .values(largeProject)
      .returning()
      .execute();

    const createdProject = insertResults[0];
    const result = await getProjectById(createdProject.id);

    expect(result).not.toBeNull();
    expect(result!.total_budget_usd).toEqual(9999999999.99);
    expect(result!.current_exchange_rate).toEqual(1234.5678);
    expect(typeof result!.total_budget_usd).toBe('number');
    expect(typeof result!.current_exchange_rate).toBe('number');
  });

  it('should handle zero ID', async () => {
    const result = await getProjectById(0);
    expect(result).toBeNull();
  });

  it('should handle negative ID', async () => {
    const result = await getProjectById(-1);
    expect(result).toBeNull();
  });
});