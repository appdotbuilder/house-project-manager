import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, activitiesTable } from '../db/schema';
import { getBudgetAnalysis } from '../handlers/get_budget_analysis';

describe('getBudgetAnalysis', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should throw error for non-existent project', async () => {
    expect(getBudgetAnalysis(999)).rejects.toThrow(/Project with id 999 not found/i);
  });

  it('should calculate budget analysis for project with no activities', async () => {
    // Create test project
    const projects = await db.insert(projectsTable)
      .values({
        name: 'Empty Project',
        description: 'Project with no activities',
        total_budget_usd: '100000.00',
        current_exchange_rate: '500.0000',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const projectId = projects[0].id;
    const result = await getBudgetAnalysis(projectId);

    expect(result.project_id).toBe(projectId);
    expect(result.total_budget_usd).toBe(100000);
    expect(result.total_planned_budget_usd).toBe(0);
    expect(result.total_actual_cost_usd).toBe(0);
    expect(result.remaining_budget_usd).toBe(100000);
    expect(result.budget_utilization_percentage).toBe(0);
    expect(result.projected_total_cost_usd).toBe(0);
    expect(result.projected_over_budget_usd).toBe(0);
    expect(result.is_over_budget_risk).toBe(false);
    expect(result.completed_activities_count).toBe(0);
    expect(result.total_activities_count).toBe(0);
    expect(result.project_completion_percentage).toBe(0);
  });

  it('should calculate budget analysis with planned activities only', async () => {
    // Create test project
    const projects = await db.insert(projectsTable)
      .values({
        name: 'Planned Project',
        description: 'Project with planned activities',
        total_budget_usd: '50000.00',
        current_exchange_rate: '600.0000',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const projectId = projects[0].id;

    // Create planned activities
    await db.insert(activitiesTable)
      .values([
        {
          project_id: projectId,
          name: 'Planning Phase',
          description: 'Initial planning',
          estimated_start_date: '2024-01-01',
          estimated_end_date: '2024-02-01',
          planned_budget_usd: '10000.00',
          status: 'planned'
        },
        {
          project_id: projectId,
          name: 'Design Phase',
          description: 'Design work',
          estimated_start_date: '2024-02-01',
          estimated_end_date: '2024-03-01',
          planned_budget_usd: '15000.00',
          status: 'planned'
        }
      ])
      .execute();

    const result = await getBudgetAnalysis(projectId);

    expect(result.project_id).toBe(projectId);
    expect(result.total_budget_usd).toBe(50000);
    expect(result.total_planned_budget_usd).toBe(25000);
    expect(result.total_actual_cost_usd).toBe(0);
    expect(result.remaining_budget_usd).toBe(50000);
    expect(result.budget_utilization_percentage).toBe(0);
    expect(result.projected_total_cost_usd).toBe(25000); // Fallback to planned budget
    expect(result.projected_over_budget_usd).toBe(0);
    expect(result.is_over_budget_risk).toBe(false);
    expect(result.completed_activities_count).toBe(0);
    expect(result.total_activities_count).toBe(2);
    expect(result.project_completion_percentage).toBe(0);
  });

  it('should calculate budget analysis with mixed activity statuses', async () => {
    // Create test project
    const projects = await db.insert(projectsTable)
      .values({
        name: 'Mixed Project',
        description: 'Project with various activity statuses',
        total_budget_usd: '80000.00',
        current_exchange_rate: '500.0000', // 500 CRC = 1 USD
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const projectId = projects[0].id;

    // Create activities with different statuses
    await db.insert(activitiesTable)
      .values([
        {
          project_id: projectId,
          name: 'Completed Activity 1',
          description: 'First completed task',
          estimated_start_date: '2024-01-01',
          estimated_end_date: '2024-02-01',
          actual_start_date: '2024-01-01',
          actual_end_date: '2024-01-30',
          planned_budget_usd: '20000.00',
          actual_cost_crc: '12000000.00', // 12M CRC = 24,000 USD at 500 rate
          status: 'completed'
        },
        {
          project_id: projectId,
          name: 'Completed Activity 2',
          description: 'Second completed task',
          estimated_start_date: '2024-02-01',
          estimated_end_date: '2024-03-01',
          actual_start_date: '2024-02-01',
          actual_end_date: '2024-02-28',
          planned_budget_usd: '15000.00',
          actual_cost_crc: '7000000.00', // 7M CRC = 14,000 USD at 500 rate
          status: 'completed'
        },
        {
          project_id: projectId,
          name: 'In Progress Activity',
          description: 'Currently running task',
          estimated_start_date: '2024-03-01',
          estimated_end_date: '2024-04-01',
          actual_start_date: '2024-03-01',
          planned_budget_usd: '25000.00',
          actual_cost_crc: '5000000.00', // 5M CRC = 10,000 USD at 500 rate
          status: 'in_progress'
        },
        {
          project_id: projectId,
          name: 'Planned Activity',
          description: 'Future task',
          estimated_start_date: '2024-04-01',
          estimated_end_date: '2024-05-01',
          planned_budget_usd: '20000.00',
          status: 'planned'
        }
      ])
      .execute();

    const result = await getBudgetAnalysis(projectId);

    expect(result.project_id).toBe(projectId);
    expect(result.total_budget_usd).toBe(80000);
    expect(result.total_planned_budget_usd).toBe(80000); // 20+15+25+20
    expect(result.total_actual_cost_usd).toBe(48000); // 24+14+10 USD
    expect(result.remaining_budget_usd).toBe(32000); // 80-48
    expect(result.budget_utilization_percentage).toBe(60); // 48/80 * 100
    expect(result.completed_activities_count).toBe(2);
    expect(result.total_activities_count).toBe(4);
    expect(result.project_completion_percentage).toBe(50); // 2/4 * 100

    // Projected cost: 48000 (actual) / 50% (completion) * 100% = 96000
    expect(result.projected_total_cost_usd).toBe(96000);
    expect(result.projected_over_budget_usd).toBe(16000); // 96000 - 80000
    expect(result.is_over_budget_risk).toBe(true); // Over budget projected
  });

  it('should identify budget risk when utilization is high but completion is low', async () => {
    // Create test project
    const projects = await db.insert(projectsTable)
      .values({
        name: 'Risk Project',
        description: 'Project at risk of going over budget',
        total_budget_usd: '30000.00',
        current_exchange_rate: '550.0000',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const projectId = projects[0].id;

    // Create activities with high cost but low completion
    await db.insert(activitiesTable)
      .values([
        {
          project_id: projectId,
          name: 'Expensive Activity',
          description: 'High cost, still in progress',
          estimated_start_date: '2024-01-01',
          estimated_end_date: '2024-06-01',
          actual_start_date: '2024-01-01',
          planned_budget_usd: '15000.00',
          actual_cost_crc: '13750000.00', // 13.75M CRC = 25,000 USD at 550 rate
          status: 'in_progress'
        },
        {
          project_id: projectId,
          name: 'Future Activity 1',
          description: 'Not started yet',
          estimated_start_date: '2024-06-01',
          estimated_end_date: '2024-09-01',
          planned_budget_usd: '10000.00',
          status: 'planned'
        },
        {
          project_id: projectId,
          name: 'Future Activity 2',
          description: 'Also not started',
          estimated_start_date: '2024-09-01',
          estimated_end_date: '2024-12-01',
          planned_budget_usd: '5000.00',
          status: 'planned'
        }
      ])
      .execute();

    const result = await getBudgetAnalysis(projectId);

    expect(result.total_budget_usd).toBe(30000);
    expect(result.total_actual_cost_usd).toBe(25000); // High actual cost
    expect(result.budget_utilization_percentage).toBeCloseTo(83.33, 1); // 25000/30000 * 100
    expect(result.completed_activities_count).toBe(0);
    expect(result.project_completion_percentage).toBe(0); // No completed activities
    
    // Should be at risk: utilization > 80% but completion < 80%
    expect(result.is_over_budget_risk).toBe(true);
  });

  it('should handle projects with cancelled activities', async () => {
    // Create test project
    const projects = await db.insert(projectsTable)
      .values({
        name: 'Cancelled Project',
        description: 'Project with cancelled activities',
        total_budget_usd: '60000.00',
        current_exchange_rate: '520.0000',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const projectId = projects[0].id;

    await db.insert(activitiesTable)
      .values([
        {
          project_id: projectId,
          name: 'Completed Activity',
          description: 'Successfully completed',
          estimated_start_date: '2024-01-01',
          estimated_end_date: '2024-02-01',
          actual_start_date: '2024-01-01',
          actual_end_date: '2024-01-31',
          planned_budget_usd: '20000.00',
          actual_cost_crc: '10400000.00', // 20,000 USD at 520 rate
          status: 'completed'
        },
        {
          project_id: projectId,
          name: 'Cancelled Activity',
          description: 'Was cancelled',
          estimated_start_date: '2024-02-01',
          estimated_end_date: '2024-03-01',
          planned_budget_usd: '25000.00',
          actual_cost_crc: '2600000.00', // Some sunk costs: 5,000 USD
          status: 'cancelled'
        },
        {
          project_id: projectId,
          name: 'Planned Activity',
          description: 'Still to do',
          estimated_start_date: '2024-03-01',
          estimated_end_date: '2024-04-01',
          planned_budget_usd: '15000.00',
          status: 'planned'
        }
      ])
      .execute();

    const result = await getBudgetAnalysis(projectId);

    expect(result.total_budget_usd).toBe(60000);
    expect(result.total_planned_budget_usd).toBe(60000); // All planned budgets count
    expect(result.total_actual_cost_usd).toBe(25000); // 20000 + 5000 actual costs
    expect(result.completed_activities_count).toBe(1); // Only completed count toward completion
    expect(result.total_activities_count).toBe(3);
    expect(result.project_completion_percentage).toBeCloseTo(33.33, 1); // 1/3 * 100
  });

  it('should handle edge case of zero completion percentage', async () => {
    // Create test project
    const projects = await db.insert(projectsTable)
      .values({
        name: 'Zero Completion Project',
        description: 'No activities completed yet',
        total_budget_usd: '40000.00',
        current_exchange_rate: '580.0000',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .returning()
      .execute();

    const projectId = projects[0].id;

    await db.insert(activitiesTable)
      .values([
        {
          project_id: projectId,
          name: 'In Progress Activity',
          description: 'Started but not finished',
          estimated_start_date: '2024-01-01',
          estimated_end_date: '2024-03-01',
          actual_start_date: '2024-01-01',
          planned_budget_usd: '20000.00',
          actual_cost_crc: '11600000.00', // 20,000 USD at 580 rate
          status: 'in_progress'
        }
      ])
      .execute();

    const result = await getBudgetAnalysis(projectId);

    expect(result.project_completion_percentage).toBe(0);
    expect(result.total_actual_cost_usd).toBe(20000);
    // Should fall back to planned budget since completion is 0
    expect(result.projected_total_cost_usd).toBe(20000);
  });
});