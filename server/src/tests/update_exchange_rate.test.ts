import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, exchangeRateHistoryTable } from '../db/schema';
import { type UpdateExchangeRateInput, type CreateProjectInput } from '../schema';
import { updateExchangeRate } from '../handlers/update_exchange_rate';
import { eq, desc } from 'drizzle-orm';

// Test project data
const testProject: CreateProjectInput = {
  name: 'Test Project',
  description: 'A project for testing exchange rate updates',
  total_budget_usd: 50000,
  current_exchange_rate: 500.0, // Initial rate
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31')
};

describe('updateExchangeRate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update exchange rate and create history record', async () => {
    // Create a test project first
    const projectResult = await db.insert(projectsTable)
      .values({
        name: testProject.name,
        description: testProject.description,
        total_budget_usd: testProject.total_budget_usd.toString(),
        current_exchange_rate: testProject.current_exchange_rate.toString(),
        start_date: testProject.start_date.toISOString().split('T')[0],
        end_date: testProject.end_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const project = projectResult[0];
    
    const updateInput: UpdateExchangeRateInput = {
      project_id: project.id,
      usd_to_crc_rate: 525.75
    };

    const result = await updateExchangeRate(updateInput);

    // Verify the returned history record
    expect(result.project_id).toEqual(project.id);
    expect(result.usd_to_crc_rate).toEqual(525.75);
    expect(typeof result.usd_to_crc_rate).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.effective_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update current exchange rate in projects table', async () => {
    // Create a test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: testProject.name,
        description: testProject.description,
        total_budget_usd: testProject.total_budget_usd.toString(),
        current_exchange_rate: testProject.current_exchange_rate.toString(),
        start_date: testProject.start_date.toISOString().split('T')[0],
        end_date: testProject.end_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const project = projectResult[0];

    const updateInput: UpdateExchangeRateInput = {
      project_id: project.id,
      usd_to_crc_rate: 550.25
    };

    await updateExchangeRate(updateInput);

    // Verify the project's current exchange rate was updated
    const updatedProjects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, project.id))
      .execute();

    expect(updatedProjects).toHaveLength(1);
    expect(parseFloat(updatedProjects[0].current_exchange_rate)).toEqual(550.25);
    expect(updatedProjects[0].updated_at).toBeInstanceOf(Date);
    expect(updatedProjects[0].updated_at > project.updated_at).toBe(true);
  });

  it('should save exchange rate history to database', async () => {
    // Create a test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: testProject.name,
        description: testProject.description,
        total_budget_usd: testProject.total_budget_usd.toString(),
        current_exchange_rate: testProject.current_exchange_rate.toString(),
        start_date: testProject.start_date.toISOString().split('T')[0],
        end_date: testProject.end_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const project = projectResult[0];

    const updateInput: UpdateExchangeRateInput = {
      project_id: project.id,
      usd_to_crc_rate: 575.0
    };

    const result = await updateExchangeRate(updateInput);

    // Query the history table directly
    const historyRecords = await db.select()
      .from(exchangeRateHistoryTable)
      .where(eq(exchangeRateHistoryTable.id, result.id))
      .execute();

    expect(historyRecords).toHaveLength(1);
    expect(historyRecords[0].project_id).toEqual(project.id);
    expect(parseFloat(historyRecords[0].usd_to_crc_rate)).toEqual(575.0);
    expect(historyRecords[0].effective_date).toBeInstanceOf(Date);
    expect(historyRecords[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple exchange rate updates for same project', async () => {
    // Create a test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: testProject.name,
        description: testProject.description,
        total_budget_usd: testProject.total_budget_usd.toString(),
        current_exchange_rate: testProject.current_exchange_rate.toString(),
        start_date: testProject.start_date.toISOString().split('T')[0],
        end_date: testProject.end_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const project = projectResult[0];

    // First update
    const firstUpdate: UpdateExchangeRateInput = {
      project_id: project.id,
      usd_to_crc_rate: 520.0
    };

    await updateExchangeRate(firstUpdate);

    // Second update
    const secondUpdate: UpdateExchangeRateInput = {
      project_id: project.id,
      usd_to_crc_rate: 530.0
    };

    await updateExchangeRate(secondUpdate);

    // Verify project has the latest rate
    const updatedProjects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, project.id))
      .execute();

    expect(parseFloat(updatedProjects[0].current_exchange_rate)).toEqual(530.0);

    // Verify both history records exist
    const allHistoryRecords = await db.select()
      .from(exchangeRateHistoryTable)
      .where(eq(exchangeRateHistoryTable.project_id, project.id))
      .orderBy(desc(exchangeRateHistoryTable.created_at))
      .execute();

    expect(allHistoryRecords).toHaveLength(2);
    expect(parseFloat(allHistoryRecords[0].usd_to_crc_rate)).toEqual(530.0); // Latest first
    expect(parseFloat(allHistoryRecords[1].usd_to_crc_rate)).toEqual(520.0); // Previous second
  });

  it('should throw error for non-existent project', async () => {
    const updateInput: UpdateExchangeRateInput = {
      project_id: 99999, // Non-existent project ID
      usd_to_crc_rate: 500.0
    };

    await expect(updateExchangeRate(updateInput)).rejects.toThrow(/project.*not found/i);
  });

  it('should handle decimal precision correctly', async () => {
    // Create a test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: testProject.name,
        description: testProject.description,
        total_budget_usd: testProject.total_budget_usd.toString(),
        current_exchange_rate: testProject.current_exchange_rate.toString(),
        start_date: testProject.start_date.toISOString().split('T')[0],
        end_date: testProject.end_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const project = projectResult[0];

    const updateInput: UpdateExchangeRateInput = {
      project_id: project.id,
      usd_to_crc_rate: 523.4567 // High precision rate
    };

    const result = await updateExchangeRate(updateInput);

    // Verify precision is maintained
    expect(result.usd_to_crc_rate).toEqual(523.4567);
    expect(typeof result.usd_to_crc_rate).toBe('number');

    // Verify it's stored correctly in the database
    const storedHistory = await db.select()
      .from(exchangeRateHistoryTable)
      .where(eq(exchangeRateHistoryTable.id, result.id))
      .execute();

    expect(parseFloat(storedHistory[0].usd_to_crc_rate)).toEqual(523.4567);
  });
});