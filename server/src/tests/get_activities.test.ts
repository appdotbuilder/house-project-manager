import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, activitiesTable } from '../db/schema';
import { getActivities } from '../handlers/get_activities';
import { eq } from 'drizzle-orm';

describe('getActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return activities for a project ordered by estimated start date', async () => {
    // Create a test project first
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test project',
        total_budget_usd: '100000.00',
        current_exchange_rate: '500.0000',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create test activities with different start dates
    await db.insert(activitiesTable)
      .values([
        {
          project_id: projectId,
          name: 'Second Activity',
          description: 'This should come second',
          estimated_start_date: '2024-02-01',
          estimated_end_date: '2024-03-01',
          actual_start_date: null,
          actual_end_date: null,
          contractor: 'Contractor B',
          planned_budget_usd: '20000.00',
          actual_cost_crc: null,
          status: 'planned'
        },
        {
          project_id: projectId,
          name: 'First Activity',
          description: 'This should come first',
          estimated_start_date: '2024-01-15',
          estimated_end_date: '2024-02-15',
          actual_start_date: '2024-01-15',
          actual_end_date: '2024-02-10',
          contractor: 'Contractor A',
          planned_budget_usd: '15000.50',
          actual_cost_crc: '7500000.00', // 15000 USD * 500 CRC/USD
          status: 'completed'
        },
        {
          project_id: projectId,
          name: 'Third Activity',
          description: 'This should come third',
          estimated_start_date: '2024-03-01',
          estimated_end_date: '2024-04-01',
          actual_start_date: '2024-03-01',
          actual_end_date: null,
          contractor: 'Contractor C',
          planned_budget_usd: '30000.25',
          actual_cost_crc: '12500000.50',
          status: 'in_progress'
        }
      ])
      .execute();

    // Fetch activities
    const activities = await getActivities(projectId);

    // Verify ordering by estimated start date
    expect(activities).toHaveLength(3);
    expect(activities[0].name).toBe('First Activity');
    expect(activities[1].name).toBe('Second Activity');
    expect(activities[2].name).toBe('Third Activity');

    // Verify numeric fields are properly converted
    expect(typeof activities[0].planned_budget_usd).toBe('number');
    expect(activities[0].planned_budget_usd).toBe(15000.50);
    expect(typeof activities[0].actual_cost_crc).toBe('number');
    expect(activities[0].actual_cost_crc).toBe(7500000.00);

    expect(typeof activities[1].planned_budget_usd).toBe('number');
    expect(activities[1].planned_budget_usd).toBe(20000.00);
    expect(activities[1].actual_cost_crc).toBeNull();

    expect(typeof activities[2].planned_budget_usd).toBe('number');
    expect(activities[2].planned_budget_usd).toBe(30000.25);
    expect(typeof activities[2].actual_cost_crc).toBe('number');
    expect(activities[2].actual_cost_crc).toBe(12500000.50);
  });

  it('should return empty array for project with no activities', async () => {
    // Create a test project first
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Empty Project',
        description: 'A project with no activities',
        total_budget_usd: '50000.00',
        current_exchange_rate: '500.0000',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const activities = await getActivities(projectId);

    expect(activities).toHaveLength(0);
    expect(activities).toEqual([]);
  });

  it('should return empty array for non-existent project', async () => {
    const nonExistentProjectId = 99999;

    const activities = await getActivities(nonExistentProjectId);

    expect(activities).toHaveLength(0);
    expect(activities).toEqual([]);
  });

  it('should only return activities for the specified project', async () => {
    // Create two test projects
    const project1Result = await db.insert(projectsTable)
      .values({
        name: 'Project 1',
        description: 'First project',
        total_budget_usd: '50000.00',
        current_exchange_rate: '500.0000',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const project2Result = await db.insert(projectsTable)
      .values({
        name: 'Project 2',
        description: 'Second project',
        total_budget_usd: '75000.00',
        current_exchange_rate: '500.0000',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const project1Id = project1Result[0].id;
    const project2Id = project2Result[0].id;

    // Create activities for both projects
    await db.insert(activitiesTable)
      .values([
        {
          project_id: project1Id,
          name: 'Project 1 Activity',
          description: 'Activity for project 1',
          estimated_start_date: '2024-01-15',
          estimated_end_date: '2024-02-15',
          actual_start_date: null,
          actual_end_date: null,
          contractor: 'Contractor A',
          planned_budget_usd: '10000.00',
          actual_cost_crc: null,
          status: 'planned'
        },
        {
          project_id: project2Id,
          name: 'Project 2 Activity',
          description: 'Activity for project 2',
          estimated_start_date: '2024-02-01',
          estimated_end_date: '2024-03-01',
          actual_start_date: null,
          actual_end_date: null,
          contractor: 'Contractor B',
          planned_budget_usd: '15000.00',
          actual_cost_crc: null,
          status: 'planned'
        }
      ])
      .execute();

    // Fetch activities for project 1 only
    const project1Activities = await getActivities(project1Id);

    expect(project1Activities).toHaveLength(1);
    expect(project1Activities[0].name).toBe('Project 1 Activity');
    expect(project1Activities[0].project_id).toBe(project1Id);

    // Verify no activities from project 2 are included
    const foundProject2Activity = project1Activities.find(
      activity => activity.project_id === project2Id
    );
    expect(foundProject2Activity).toBeUndefined();
  });

  it('should handle activities with all status types', async () => {
    // Create a test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Status Test Project',
        description: 'Testing all status types',
        total_budget_usd: '100000.00',
        current_exchange_rate: '500.0000',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create activities with different statuses
    await db.insert(activitiesTable)
      .values([
        {
          project_id: projectId,
          name: 'Planned Activity',
          description: 'Still in planning',
          estimated_start_date: '2024-01-15',
          estimated_end_date: '2024-02-15',
          actual_start_date: null,
          actual_end_date: null,
          contractor: null,
          planned_budget_usd: '10000.00',
          actual_cost_crc: null,
          status: 'planned'
        },
        {
          project_id: projectId,
          name: 'In Progress Activity',
          description: 'Currently executing',
          estimated_start_date: '2024-02-01',
          estimated_end_date: '2024-03-01',
          actual_start_date: '2024-02-01',
          actual_end_date: null,
          contractor: 'Active Contractor',
          planned_budget_usd: '20000.00',
          actual_cost_crc: '8000000.00',
          status: 'in_progress'
        },
        {
          project_id: projectId,
          name: 'Completed Activity',
          description: 'Finished work',
          estimated_start_date: '2024-03-01',
          estimated_end_date: '2024-04-01',
          actual_start_date: '2024-03-01',
          actual_end_date: '2024-03-25',
          contractor: 'Completed Contractor',
          planned_budget_usd: '15000.00',
          actual_cost_crc: '7250000.00',
          status: 'completed'
        },
        {
          project_id: projectId,
          name: 'Cancelled Activity',
          description: 'Work was cancelled',
          estimated_start_date: '2024-04-01',
          estimated_end_date: '2024-05-01',
          actual_start_date: null,
          actual_end_date: null,
          contractor: 'Former Contractor',
          planned_budget_usd: '25000.00',
          actual_cost_crc: null,
          status: 'cancelled'
        }
      ])
      .execute();

    const activities = await getActivities(projectId);

    expect(activities).toHaveLength(4);

    // Verify all status types are represented
    const statuses = activities.map(activity => activity.status);
    expect(statuses).toContain('planned');
    expect(statuses).toContain('in_progress');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('cancelled');

    // Verify data integrity for each status type
    const plannedActivity = activities.find(a => a.status === 'planned');
    expect(plannedActivity?.actual_start_date).toBeNull();
    expect(plannedActivity?.actual_cost_crc).toBeNull();

    const inProgressActivity = activities.find(a => a.status === 'in_progress');
    expect(inProgressActivity?.actual_start_date).toBeInstanceOf(Date);
    expect(inProgressActivity?.actual_end_date).toBeNull();
    expect(typeof inProgressActivity?.actual_cost_crc).toBe('number');

    const completedActivity = activities.find(a => a.status === 'completed');
    expect(completedActivity?.actual_start_date).toBeInstanceOf(Date);
    expect(completedActivity?.actual_end_date).toBeInstanceOf(Date);
    expect(typeof completedActivity?.actual_cost_crc).toBe('number');
  });
});