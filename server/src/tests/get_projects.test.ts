import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { getProjects } from '../handlers/get_projects';

describe('getProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no projects exist', async () => {
    const result = await getProjects();
    
    expect(result).toEqual([]);
  });

  it('should return a single project with correct field types', async () => {
    // Insert a test project directly into the database
    await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A test construction project',
        total_budget_usd: '50000.00', // String for numeric column
        current_exchange_rate: '520.5000', // String for numeric column
        start_date: '2024-01-01',
        end_date: '2024-06-30'
      })
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(1);
    
    const project = result[0];
    expect(project.name).toBe('Test Project');
    expect(project.description).toBe('A test construction project');
    expect(project.total_budget_usd).toBe(50000.00);
    expect(typeof project.total_budget_usd).toBe('number');
    expect(project.current_exchange_rate).toBe(520.5);
    expect(typeof project.current_exchange_rate).toBe('number');
    expect(project.start_date).toBeInstanceOf(Date);
    expect(project.end_date).toBeInstanceOf(Date);
    expect(project.created_at).toBeInstanceOf(Date);
    expect(project.updated_at).toBeInstanceOf(Date);
    expect(project.id).toBeDefined();
    expect(typeof project.id).toBe('number');
  });

  it('should return multiple projects in order', async () => {
    // Insert multiple test projects
    await db.insert(projectsTable)
      .values([
        {
          name: 'Project A',
          description: 'First project',
          total_budget_usd: '25000.00',
          current_exchange_rate: '520.0000',
          start_date: '2024-01-01',
          end_date: '2024-03-31'
        },
        {
          name: 'Project B',
          description: 'Second project',
          total_budget_usd: '75000.50',
          current_exchange_rate: '525.2500',
          start_date: '2024-04-01',
          end_date: '2024-09-30'
        },
        {
          name: 'Project C',
          description: null, // Test null description
          total_budget_usd: '100000.99',
          current_exchange_rate: '518.7500',
          start_date: '2024-07-01',
          end_date: '2024-12-31'
        }
      ])
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(3);
    
    // Verify first project
    expect(result[0].name).toBe('Project A');
    expect(result[0].description).toBe('First project');
    expect(result[0].total_budget_usd).toBe(25000.00);
    expect(result[0].current_exchange_rate).toBe(520.0);
    
    // Verify second project
    expect(result[1].name).toBe('Project B');
    expect(result[1].description).toBe('Second project');
    expect(result[1].total_budget_usd).toBe(75000.50);
    expect(result[1].current_exchange_rate).toBe(525.25);
    
    // Verify third project with null description
    expect(result[2].name).toBe('Project C');
    expect(result[2].description).toBeNull();
    expect(result[2].total_budget_usd).toBe(100000.99);
    expect(result[2].current_exchange_rate).toBe(518.75);
    
    // Verify all projects have required fields
    result.forEach(project => {
      expect(project.id).toBeDefined();
      expect(typeof project.id).toBe('number');
      expect(project.start_date).toBeInstanceOf(Date);
      expect(project.end_date).toBeInstanceOf(Date);
      expect(project.created_at).toBeInstanceOf(Date);
      expect(project.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle projects with decimal precision correctly', async () => {
    // Insert project with precise decimal values
    await db.insert(projectsTable)
      .values({
        name: 'Precision Test',
        description: 'Testing decimal precision',
        total_budget_usd: '123456.78', // Test 2 decimal places for budget
        current_exchange_rate: '520.1234', // Test 4 decimal places for rate
        start_date: '2024-01-15',
        end_date: '2024-08-15'
      })
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(1);
    expect(result[0].total_budget_usd).toBe(123456.78);
    expect(result[0].current_exchange_rate).toBe(520.1234);
  });

  it('should verify projects are saved to database correctly', async () => {
    // Use the handler to get projects (should be empty)
    const initialResult = await getProjects();
    expect(initialResult).toHaveLength(0);

    // Insert a project directly
    await db.insert(projectsTable)
      .values({
        name: 'Database Test Project',
        description: 'Testing database persistence',
        total_budget_usd: '40000.00',
        current_exchange_rate: '515.0000',
        start_date: '2024-02-01',
        end_date: '2024-07-31'
      })
      .execute();

    // Verify the project is returned by the handler
    const finalResult = await getProjects();
    expect(finalResult).toHaveLength(1);
    expect(finalResult[0].name).toBe('Database Test Project');
    expect(finalResult[0].total_budget_usd).toBe(40000.00);
  });
});