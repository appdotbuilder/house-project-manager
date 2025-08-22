import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateProjectInput = {
  name: 'Test Construction Project',
  description: 'A construction project for testing',
  total_budget_usd: 100000.50,
  current_exchange_rate: 520.75,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31')
};

describe('createProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a project with all fields', async () => {
    const result = await createProject(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Construction Project');
    expect(result.description).toEqual(testInput.description);
    expect(result.total_budget_usd).toEqual(100000.50);
    expect(typeof result.total_budget_usd).toEqual('number');
    expect(result.current_exchange_rate).toEqual(520.75);
    expect(typeof result.current_exchange_rate).toEqual('number');
    expect(result.start_date).toEqual(testInput.start_date);
    expect(result.end_date).toEqual(testInput.end_date);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save project to database correctly', async () => {
    const result = await createProject(testInput);

    // Query using proper drizzle syntax
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    const savedProject = projects[0];
    expect(savedProject.name).toEqual('Test Construction Project');
    expect(savedProject.description).toEqual(testInput.description);
    expect(parseFloat(savedProject.total_budget_usd)).toEqual(100000.50);
    expect(parseFloat(savedProject.current_exchange_rate)).toEqual(520.75);
    expect(new Date(savedProject.start_date)).toEqual(testInput.start_date);
    expect(new Date(savedProject.end_date)).toEqual(testInput.end_date);
    expect(savedProject.created_at).toBeInstanceOf(Date);
    expect(savedProject.updated_at).toBeInstanceOf(Date);
  });

  it('should create a project with null description', async () => {
    const inputWithNullDescription: CreateProjectInput = {
      ...testInput,
      description: null
    };

    const result = await createProject(inputWithNullDescription);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Test Construction Project');
    expect(result.total_budget_usd).toEqual(100000.50);

    // Verify in database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects[0].description).toBeNull();
  });

  it('should handle numeric precision correctly', async () => {
    const precisionTestInput: CreateProjectInput = {
      name: 'Precision Test Project',
      description: 'Testing numeric precision',
      total_budget_usd: 123456.78,
      current_exchange_rate: 567.1234,
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-11-30')
    };

    const result = await createProject(precisionTestInput);

    // Verify numeric precision is maintained
    expect(result.total_budget_usd).toEqual(123456.78);
    expect(result.current_exchange_rate).toEqual(567.1234);

    // Verify in database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(parseFloat(projects[0].total_budget_usd)).toEqual(123456.78);
    expect(parseFloat(projects[0].current_exchange_rate)).toEqual(567.1234);
  });

  it('should handle date fields properly', async () => {
    const startDate = new Date('2024-06-15');
    const endDate = new Date('2025-06-14');
    
    const dateTestInput: CreateProjectInput = {
      ...testInput,
      start_date: startDate,
      end_date: endDate
    };

    const result = await createProject(dateTestInput);

    expect(result.start_date).toEqual(startDate);
    expect(result.end_date).toEqual(endDate);

    // Verify dates are stored correctly in database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(new Date(projects[0].start_date)).toEqual(startDate);
    expect(new Date(projects[0].end_date)).toEqual(endDate);
  });

  it('should generate unique IDs for multiple projects', async () => {
    const project1 = await createProject({
      ...testInput,
      name: 'Project 1'
    });

    const project2 = await createProject({
      ...testInput,
      name: 'Project 2'
    });

    expect(project1.id).not.toEqual(project2.id);
    expect(project1.name).toEqual('Project 1');
    expect(project2.name).toEqual('Project 2');

    // Verify both projects exist in database
    const allProjects = await db.select()
      .from(projectsTable)
      .execute();

    expect(allProjects).toHaveLength(2);
  });
});