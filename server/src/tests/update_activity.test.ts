import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, activitiesTable, type NewProject, type NewActivity } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateActivityInput } from '../schema';
import { updateActivity } from '../handlers/update_activity';

// Helper function to create a test project
const createTestProject = async (): Promise<number> => {
  const projectData: NewProject = {
    name: 'Test Project',
    description: 'A test project',
    total_budget_usd: '100000.00',
    current_exchange_rate: '500.0000',
    start_date: '2024-01-01',
    end_date: '2024-12-31'
  };

  const result = await db.insert(projectsTable)
    .values(projectData)
    .returning()
    .execute();

  return result[0].id;
};

// Helper function to create a test activity
const createTestActivity = async (projectId: number): Promise<number> => {
  const activityData: NewActivity = {
    project_id: projectId,
    name: 'Test Activity',
    description: 'A test activity',
    estimated_start_date: '2024-02-01',
    estimated_end_date: '2024-03-01',
    contractor: 'Test Contractor',
    planned_budget_usd: '5000.00'
  };

  const result = await db.insert(activitiesTable)
    .values(activityData)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update activity with all fields', async () => {
    const projectId = await createTestProject();
    const activityId = await createTestActivity(projectId);

    const updateInput: UpdateActivityInput = {
      id: activityId,
      name: 'Updated Activity Name',
      description: 'Updated description',
      estimated_start_date: new Date('2024-03-01'),
      estimated_end_date: new Date('2024-04-01'),
      actual_start_date: new Date('2024-03-15'),
      actual_end_date: new Date('2024-04-15'),
      contractor: 'Updated Contractor',
      planned_budget_usd: 7500,
      actual_cost_crc: 3750000, // 7500 USD * 500 CRC exchange rate
      status: 'completed'
    };

    const result = await updateActivity(updateInput);

    expect(result.id).toEqual(activityId);
    expect(result.name).toEqual('Updated Activity Name');
    expect(result.description).toEqual('Updated description');
    expect(result.estimated_start_date).toEqual(new Date('2024-03-01'));
    expect(result.estimated_end_date).toEqual(new Date('2024-04-01'));
    expect(result.actual_start_date).toEqual(new Date('2024-03-15'));
    expect(result.actual_end_date).toEqual(new Date('2024-04-15'));
    expect(result.contractor).toEqual('Updated Contractor');
    expect(result.planned_budget_usd).toEqual(7500);
    expect(typeof result.planned_budget_usd).toBe('number');
    expect(result.actual_cost_crc).toEqual(3750000);
    expect(typeof result.actual_cost_crc).toBe('number');
    expect(result.status).toEqual('completed');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const projectId = await createTestProject();
    const activityId = await createTestActivity(projectId);

    // Get original activity
    const originalActivity = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, activityId))
      .execute();

    const updateInput: UpdateActivityInput = {
      id: activityId,
      name: 'Partially Updated Name',
      status: 'in_progress'
    };

    const result = await updateActivity(updateInput);

    // Updated fields should be changed
    expect(result.name).toEqual('Partially Updated Name');
    expect(result.status).toEqual('in_progress');

    // Other fields should remain unchanged
    expect(result.description).toEqual(originalActivity[0].description);
    expect(result.contractor).toEqual(originalActivity[0].contractor);
    expect(result.planned_budget_usd).toEqual(parseFloat(originalActivity[0].planned_budget_usd));
  });

  it('should persist changes to database', async () => {
    const projectId = await createTestProject();
    const activityId = await createTestActivity(projectId);

    const updateInput: UpdateActivityInput = {
      id: activityId,
      name: 'Database Test Activity',
      planned_budget_usd: 10000,
      actual_cost_crc: 5000000,
      status: 'in_progress'
    };

    await updateActivity(updateInput);

    // Verify changes are persisted in database
    const updatedActivity = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, activityId))
      .execute();

    expect(updatedActivity).toHaveLength(1);
    expect(updatedActivity[0].name).toEqual('Database Test Activity');
    expect(parseFloat(updatedActivity[0].planned_budget_usd)).toEqual(10000);
    expect(parseFloat(updatedActivity[0].actual_cost_crc!)).toEqual(5000000);
    expect(updatedActivity[0].status).toEqual('in_progress');
    expect(updatedActivity[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    const projectId = await createTestProject();
    const activityId = await createTestActivity(projectId);

    const updateInput: UpdateActivityInput = {
      id: activityId,
      description: null,
      actual_start_date: null,
      actual_end_date: null,
      contractor: null,
      actual_cost_crc: null
    };

    const result = await updateActivity(updateInput);

    expect(result.description).toBeNull();
    expect(result.actual_start_date).toBeNull();
    expect(result.actual_end_date).toBeNull();
    expect(result.contractor).toBeNull();
    expect(result.actual_cost_crc).toBeNull();
  });

  it('should update status transitions correctly', async () => {
    const projectId = await createTestProject();
    const activityId = await createTestActivity(projectId);

    // Test each status transition
    const statuses = ['planned', 'in_progress', 'completed', 'cancelled'] as const;

    for (const status of statuses) {
      const updateInput: UpdateActivityInput = {
        id: activityId,
        status: status
      };

      const result = await updateActivity(updateInput);
      expect(result.status).toEqual(status);
    }
  });

  it('should handle date updates correctly', async () => {
    const projectId = await createTestProject();
    const activityId = await createTestActivity(projectId);

    const newStartDate = new Date('2024-06-01');
    const newEndDate = new Date('2024-07-01');
    const actualStartDate = new Date('2024-06-15');
    const actualEndDate = new Date('2024-07-15');

    const updateInput: UpdateActivityInput = {
      id: activityId,
      estimated_start_date: newStartDate,
      estimated_end_date: newEndDate,
      actual_start_date: actualStartDate,
      actual_end_date: actualEndDate
    };

    const result = await updateActivity(updateInput);

    expect(result.estimated_start_date).toEqual(newStartDate);
    expect(result.estimated_end_date).toEqual(newEndDate);
    expect(result.actual_start_date).toEqual(actualStartDate);
    expect(result.actual_end_date).toEqual(actualEndDate);
  });

  it('should throw error for non-existent activity', async () => {
    const updateInput: UpdateActivityInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Activity'
    };

    await expect(updateActivity(updateInput)).rejects.toThrow(/Activity with id 99999 not found/i);
  });

  it('should handle numeric conversions correctly', async () => {
    const projectId = await createTestProject();
    const activityId = await createTestActivity(projectId);

    const updateInput: UpdateActivityInput = {
      id: activityId,
      planned_budget_usd: 12345.67,
      actual_cost_crc: 9876543.21
    };

    const result = await updateActivity(updateInput);

    // Verify numeric types are returned as numbers
    expect(typeof result.planned_budget_usd).toBe('number');
    expect(result.planned_budget_usd).toEqual(12345.67);
    expect(typeof result.actual_cost_crc).toBe('number');
    expect(result.actual_cost_crc).toEqual(9876543.21);

    // Verify database stores as strings but converts back correctly
    const dbActivity = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, activityId))
      .execute();

    expect(typeof dbActivity[0].planned_budget_usd).toBe('string');
    expect(parseFloat(dbActivity[0].planned_budget_usd)).toEqual(12345.67);
    expect(typeof dbActivity[0].actual_cost_crc).toBe('string');
    expect(parseFloat(dbActivity[0].actual_cost_crc!)).toEqual(9876543.21);
  });
});