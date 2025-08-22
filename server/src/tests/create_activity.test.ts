import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activitiesTable, projectsTable } from '../db/schema';
import { type CreateActivityInput } from '../schema';
import { createActivity } from '../handlers/create_activity';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testActivityInput: CreateActivityInput = {
  project_id: 1,
  name: 'Foundation Work',
  description: 'Pour concrete foundation for building',
  estimated_start_date: new Date('2024-01-15'),
  estimated_end_date: new Date('2024-01-30'),
  contractor: 'ABC Construction Co.',
  planned_budget_usd: 25000.50
};

// Test input with nullable fields as null
const minimalActivityInput: CreateActivityInput = {
  project_id: 1,
  name: 'Site Preparation',
  description: null,
  estimated_start_date: new Date('2024-01-01'),
  estimated_end_date: new Date('2024-01-14'),
  contractor: null,
  planned_budget_usd: 5000.00
};

describe('createActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test project
  const createTestProject = async () => {
    const result = await db.insert(projectsTable)
      .values({
        name: 'Test Construction Project',
        description: 'A project for testing activities',
        total_budget_usd: '100000.00',
        current_exchange_rate: '520.5000',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create an activity with all fields', async () => {
    // Create prerequisite project
    await createTestProject();

    const result = await createActivity(testActivityInput);

    // Basic field validation
    expect(result.project_id).toEqual(1);
    expect(result.name).toEqual('Foundation Work');
    expect(result.description).toEqual('Pour concrete foundation for building');
    expect(result.estimated_start_date).toEqual(new Date('2024-01-15'));
    expect(result.estimated_end_date).toEqual(new Date('2024-01-30'));
    expect(result.contractor).toEqual('ABC Construction Co.');
    expect(result.planned_budget_usd).toEqual(25000.50);
    expect(typeof result.planned_budget_usd).toEqual('number');
    expect(result.status).toEqual('planned');
    expect(result.actual_start_date).toBeNull();
    expect(result.actual_end_date).toBeNull();
    expect(result.actual_cost_crc).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an activity with minimal fields (nullables as null)', async () => {
    // Create prerequisite project
    await createTestProject();

    const result = await createActivity(minimalActivityInput);

    // Basic field validation
    expect(result.project_id).toEqual(1);
    expect(result.name).toEqual('Site Preparation');
    expect(result.description).toBeNull();
    expect(result.estimated_start_date).toEqual(new Date('2024-01-01'));
    expect(result.estimated_end_date).toEqual(new Date('2024-01-14'));
    expect(result.contractor).toBeNull();
    expect(result.planned_budget_usd).toEqual(5000.00);
    expect(typeof result.planned_budget_usd).toEqual('number');
    expect(result.status).toEqual('planned');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save activity to database correctly', async () => {
    // Create prerequisite project
    await createTestProject();

    const result = await createActivity(testActivityInput);

    // Query database to verify activity was saved
    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    const savedActivity = activities[0];
    
    expect(savedActivity.project_id).toEqual(1);
    expect(savedActivity.name).toEqual('Foundation Work');
    expect(savedActivity.description).toEqual('Pour concrete foundation for building');
    expect(new Date(savedActivity.estimated_start_date)).toEqual(new Date('2024-01-15'));
    expect(new Date(savedActivity.estimated_end_date)).toEqual(new Date('2024-01-30'));
    expect(savedActivity.contractor).toEqual('ABC Construction Co.');
    expect(parseFloat(savedActivity.planned_budget_usd)).toEqual(25000.50);
    expect(savedActivity.status).toEqual('planned');
    expect(savedActivity.actual_start_date).toBeNull();
    expect(savedActivity.actual_end_date).toBeNull();
    expect(savedActivity.actual_cost_crc).toBeNull();
    expect(savedActivity.created_at).toBeInstanceOf(Date);
    expect(savedActivity.updated_at).toBeInstanceOf(Date);
  });

  it('should handle numeric precision correctly', async () => {
    // Create prerequisite project
    await createTestProject();

    const precisionInput: CreateActivityInput = {
      ...testActivityInput,
      planned_budget_usd: 12345.67
    };

    const result = await createActivity(precisionInput);

    expect(result.planned_budget_usd).toEqual(12345.67);
    expect(typeof result.planned_budget_usd).toEqual('number');

    // Verify in database
    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.id, result.id))
      .execute();

    expect(parseFloat(activities[0].planned_budget_usd)).toEqual(12345.67);
  });

  it('should throw error when project does not exist', async () => {
    // Don't create any project - test foreign key validation

    await expect(createActivity(testActivityInput)).rejects.toThrow(/Project with id 1 not found/i);
  });

  it('should handle date conversion correctly', async () => {
    // Create prerequisite project
    await createTestProject();

    const dateInput: CreateActivityInput = {
      ...testActivityInput,
      estimated_start_date: new Date('2024-03-15T10:30:00Z'),
      estimated_end_date: new Date('2024-03-30T15:45:00Z')
    };

    const result = await createActivity(dateInput);

    // Should convert to proper Date objects, ignoring time component
    expect(result.estimated_start_date).toEqual(new Date('2024-03-15'));
    expect(result.estimated_end_date).toEqual(new Date('2024-03-30'));
    expect(result.estimated_start_date).toBeInstanceOf(Date);
    expect(result.estimated_end_date).toBeInstanceOf(Date);
  });

  it('should create multiple activities for the same project', async () => {
    // Create prerequisite project
    await createTestProject();

    const activity1 = await createActivity(testActivityInput);
    const activity2 = await createActivity({
      ...minimalActivityInput,
      name: 'Different Activity'
    });

    expect(activity1.id).not.toEqual(activity2.id);
    expect(activity1.project_id).toEqual(activity2.project_id);
    expect(activity1.name).toEqual('Foundation Work');
    expect(activity2.name).toEqual('Different Activity');

    // Verify both are in database
    const allActivities = await db.select()
      .from(activitiesTable)
      .execute();

    expect(allActivities).toHaveLength(2);
  });
});