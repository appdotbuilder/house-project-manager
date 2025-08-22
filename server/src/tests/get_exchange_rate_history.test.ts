import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, exchangeRateHistoryTable, type NewProject, type NewExchangeRateHistory } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { getExchangeRateHistory } from '../handlers/get_exchange_rate_history';
import { eq } from 'drizzle-orm';

// Test project data
const testProject: CreateProjectInput = {
  name: 'Test Project',
  description: 'A project for testing',
  total_budget_usd: 50000,
  current_exchange_rate: 550.75,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31')
};

describe('getExchangeRateHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for project with no exchange rate history', async () => {
    // Create project
    const projectData: NewProject = {
      name: testProject.name,
      description: testProject.description,
      total_budget_usd: testProject.total_budget_usd.toString(),
      current_exchange_rate: testProject.current_exchange_rate.toString(),
      start_date: testProject.start_date.toISOString().split('T')[0],
      end_date: testProject.end_date.toISOString().split('T')[0]
    };
    
    const projectResult = await db.insert(projectsTable)
      .values(projectData)
      .returning();

    const projectId = projectResult[0].id;

    const result = await getExchangeRateHistory(projectId);

    expect(result).toEqual([]);
  });

  it('should return exchange rate history for a project ordered by effective date descending', async () => {
    // Create project
    const projectData: NewProject = {
      name: testProject.name,
      description: testProject.description,
      total_budget_usd: testProject.total_budget_usd.toString(),
      current_exchange_rate: testProject.current_exchange_rate.toString(),
      start_date: testProject.start_date.toISOString().split('T')[0],
      end_date: testProject.end_date.toISOString().split('T')[0]
    };
    
    const projectResult = await db.insert(projectsTable)
      .values(projectData)
      .returning();

    const projectId = projectResult[0].id;

    // Create exchange rate history entries with different dates
    const rateEntries: NewExchangeRateHistory[] = [
      {
        project_id: projectId,
        usd_to_crc_rate: '550.25',
        effective_date: new Date('2024-01-01T10:00:00Z')
      },
      {
        project_id: projectId,
        usd_to_crc_rate: '552.75',
        effective_date: new Date('2024-02-15T14:30:00Z')
      },
      {
        project_id: projectId,
        usd_to_crc_rate: '548.90',
        effective_date: new Date('2024-03-01T09:15:00Z')
      }
    ];

    await db.insert(exchangeRateHistoryTable)
      .values(rateEntries);

    const result = await getExchangeRateHistory(projectId);

    expect(result).toHaveLength(3);

    // Verify results are ordered by effective_date descending (most recent first)
    expect(result[0].effective_date.getTime()).toBeGreaterThan(result[1].effective_date.getTime());
    expect(result[1].effective_date.getTime()).toBeGreaterThan(result[2].effective_date.getTime());

    // Verify specific order and data
    expect(result[0].usd_to_crc_rate).toEqual(548.90); // March 1st
    expect(result[1].usd_to_crc_rate).toEqual(552.75); // February 15th
    expect(result[2].usd_to_crc_rate).toEqual(550.25); // January 1st

    // Verify all fields are present and correctly typed
    result.forEach(rate => {
      expect(rate.id).toBeDefined();
      expect(rate.project_id).toEqual(projectId);
      expect(typeof rate.usd_to_crc_rate).toBe('number');
      expect(rate.effective_date).toBeInstanceOf(Date);
      expect(rate.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return only exchange rates for the specified project', async () => {
    // Create two projects
    const project1Data: NewProject = {
      name: 'Project 1',
      description: 'First project',
      total_budget_usd: testProject.total_budget_usd.toString(),
      current_exchange_rate: testProject.current_exchange_rate.toString(),
      start_date: testProject.start_date.toISOString().split('T')[0],
      end_date: testProject.end_date.toISOString().split('T')[0]
    };

    const project2Data: NewProject = {
      name: 'Project 2',
      description: 'Second project',
      total_budget_usd: '30000',
      current_exchange_rate: '555.00',
      start_date: testProject.start_date.toISOString().split('T')[0],
      end_date: testProject.end_date.toISOString().split('T')[0]
    };

    const project1Result = await db.insert(projectsTable)
      .values(project1Data)
      .returning();

    const project2Result = await db.insert(projectsTable)
      .values(project2Data)
      .returning();

    const project1Id = project1Result[0].id;
    const project2Id = project2Result[0].id;

    // Create exchange rate history for both projects
    const rateEntries: NewExchangeRateHistory[] = [
      {
        project_id: project1Id,
        usd_to_crc_rate: '550.25',
        effective_date: new Date('2024-01-01T10:00:00Z')
      },
      {
        project_id: project1Id,
        usd_to_crc_rate: '552.75',
        effective_date: new Date('2024-02-01T10:00:00Z')
      },
      {
        project_id: project2Id,
        usd_to_crc_rate: '555.50',
        effective_date: new Date('2024-01-15T10:00:00Z')
      }
    ];

    await db.insert(exchangeRateHistoryTable)
      .values(rateEntries);

    // Get history for project 1 only
    const result = await getExchangeRateHistory(project1Id);

    expect(result).toHaveLength(2);
    result.forEach(rate => {
      expect(rate.project_id).toEqual(project1Id);
    });

    // Verify the correct rates are returned
    expect(result[0].usd_to_crc_rate).toEqual(552.75); // February (most recent)
    expect(result[1].usd_to_crc_rate).toEqual(550.25); // January
  });

  it('should handle numeric conversion correctly', async () => {
    // Create project
    const projectData: NewProject = {
      name: testProject.name,
      description: testProject.description,
      total_budget_usd: testProject.total_budget_usd.toString(),
      current_exchange_rate: testProject.current_exchange_rate.toString(),
      start_date: testProject.start_date.toISOString().split('T')[0],
      end_date: testProject.end_date.toISOString().split('T')[0]
    };
    
    const projectResult = await db.insert(projectsTable)
      .values(projectData)
      .returning();

    const projectId = projectResult[0].id;

    // Create exchange rate with precise decimal value
    const rateData: NewExchangeRateHistory = {
      project_id: projectId,
      usd_to_crc_rate: '550.1234',
      effective_date: new Date('2024-01-01T10:00:00Z')
    };

    await db.insert(exchangeRateHistoryTable)
      .values(rateData);

    const result = await getExchangeRateHistory(projectId);

    expect(result).toHaveLength(1);
    expect(typeof result[0].usd_to_crc_rate).toBe('number');
    expect(result[0].usd_to_crc_rate).toEqual(550.1234);
  });

  it('should return empty array for non-existent project', async () => {
    const nonExistentProjectId = 99999;
    
    const result = await getExchangeRateHistory(nonExistentProjectId);

    expect(result).toEqual([]);
  });
});