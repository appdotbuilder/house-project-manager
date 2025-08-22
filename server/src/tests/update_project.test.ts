import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type UpdateProjectInput } from '../schema';
import { updateProject } from '../handlers/update_project';
import { eq } from 'drizzle-orm';

// Helper function to create a test project
const createTestProject = async (): Promise<number> => {
  const result = await db.insert(projectsTable)
    .values({
      name: 'Original Project',
      description: 'Original description',
      total_budget_usd: '50000',
      current_exchange_rate: '500',
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all project fields', async () => {
    const projectId = await createTestProject();

    const updateInput: UpdateProjectInput = {
      id: projectId,
      name: 'Updated Project Name',
      description: 'Updated description',
      total_budget_usd: 75000,
      current_exchange_rate: 550,
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-11-30')
    };

    const result = await updateProject(updateInput);

    // Verify returned values
    expect(result.id).toEqual(projectId);
    expect(result.name).toEqual('Updated Project Name');
    expect(result.description).toEqual('Updated description');
    expect(result.total_budget_usd).toEqual(75000);
    expect(result.current_exchange_rate).toEqual(550);
    expect(result.start_date).toEqual(new Date('2024-02-01'));
    expect(result.end_date).toEqual(new Date('2024-11-30'));
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric type conversion
    expect(typeof result.total_budget_usd).toBe('number');
    expect(typeof result.current_exchange_rate).toBe('number');
  });

  it('should update only provided fields', async () => {
    const projectId = await createTestProject();

    const partialUpdate: UpdateProjectInput = {
      id: projectId,
      name: 'Partially Updated Project',
      total_budget_usd: 60000
    };

    const result = await updateProject(partialUpdate);

    // Verify updated fields
    expect(result.name).toEqual('Partially Updated Project');
    expect(result.total_budget_usd).toEqual(60000);

    // Verify unchanged fields remain the same
    expect(result.description).toEqual('Original description');
    expect(result.current_exchange_rate).toEqual(500);
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.end_date).toEqual(new Date('2024-12-31'));
  });

  it('should handle null description update', async () => {
    const projectId = await createTestProject();

    const updateInput: UpdateProjectInput = {
      id: projectId,
      description: null
    };

    const result = await updateProject(updateInput);

    expect(result.description).toBeNull();
  });

  it('should update database record correctly', async () => {
    const projectId = await createTestProject();

    const updateInput: UpdateProjectInput = {
      id: projectId,
      name: 'Database Updated Project',
      total_budget_usd: 80000,
      current_exchange_rate: 600
    };

    await updateProject(updateInput);

    // Query the database directly to verify changes
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    expect(projects).toHaveLength(1);
    const dbProject = projects[0];

    expect(dbProject.name).toEqual('Database Updated Project');
    expect(parseFloat(dbProject.total_budget_usd)).toEqual(80000);
    expect(parseFloat(dbProject.current_exchange_rate)).toEqual(600);
    expect(dbProject.updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    const projectId = await createTestProject();

    // Get original timestamp
    const originalProject = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    const originalUpdatedAt = originalProject[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateProjectInput = {
      id: projectId,
      name: 'Timestamp Test Project'
    };

    const result = await updateProject(updateInput);

    // Verify updated_at timestamp was changed
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error for non-existent project', async () => {
    const nonExistentId = 99999;

    const updateInput: UpdateProjectInput = {
      id: nonExistentId,
      name: 'Non-existent Project'
    };

    await expect(updateProject(updateInput)).rejects.toThrow(/Project with id 99999 not found/i);
  });

  it('should handle date updates correctly', async () => {
    const projectId = await createTestProject();

    const newStartDate = new Date('2024-03-15');
    const newEndDate = new Date('2024-10-15');

    const updateInput: UpdateProjectInput = {
      id: projectId,
      start_date: newStartDate,
      end_date: newEndDate
    };

    const result = await updateProject(updateInput);

    expect(result.start_date).toEqual(newStartDate);
    expect(result.end_date).toEqual(newEndDate);

    // Verify dates are stored correctly in database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    expect(projects[0].start_date).toEqual('2024-03-15');
    expect(projects[0].end_date).toEqual('2024-10-15');
  });

  it('should handle decimal values correctly', async () => {
    const projectId = await createTestProject();

    const updateInput: UpdateProjectInput = {
      id: projectId,
      total_budget_usd: 12345.67,
      current_exchange_rate: 543.21
    };

    const result = await updateProject(updateInput);

    // Verify decimal precision is maintained
    expect(result.total_budget_usd).toEqual(12345.67);
    expect(result.current_exchange_rate).toEqual(543.21);

    // Verify in database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    expect(parseFloat(projects[0].total_budget_usd)).toEqual(12345.67);
    expect(parseFloat(projects[0].current_exchange_rate)).toEqual(543.21);
  });
});