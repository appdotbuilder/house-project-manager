import { db } from '../db';
import { projectsTable, activitiesTable } from '../db/schema';
import { type BudgetAnalysis } from '../schema';
import { eq, and, isNotNull, sum, count } from 'drizzle-orm';

export const getBudgetAnalysis = async (projectId: number): Promise<BudgetAnalysis> => {
  try {
    // Get project details
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    if (projects.length === 0) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    const project = projects[0];
    const totalBudgetUsd = parseFloat(project.total_budget_usd);
    const currentExchangeRate = parseFloat(project.current_exchange_rate);

    // Get all activities for the project
    const activities = await db.select()
      .from(activitiesTable)
      .where(eq(activitiesTable.project_id, projectId))
      .execute();

    const totalActivitiesCount = activities.length;

    // Calculate totals
    let totalPlannedBudgetUsd = 0;
    let totalActualCostUsd = 0;
    let completedActivitiesCount = 0;

    for (const activity of activities) {
      // Sum planned budgets
      totalPlannedBudgetUsd += parseFloat(activity.planned_budget_usd);

      // Count completed activities
      if (activity.status === 'completed') {
        completedActivitiesCount++;
      }

      // Convert actual costs from CRC to USD
      if (activity.actual_cost_crc !== null) {
        const actualCostCrc = parseFloat(activity.actual_cost_crc);
        totalActualCostUsd += actualCostCrc / currentExchangeRate;
      }
    }

    // Calculate remaining budget
    const remainingBudgetUsd = totalBudgetUsd - totalActualCostUsd;

    // Calculate budget utilization percentage
    const budgetUtilizationPercentage = totalBudgetUsd > 0 
      ? (totalActualCostUsd / totalBudgetUsd) * 100 
      : 0;

    // Calculate project completion percentage
    const projectCompletionPercentage = totalActivitiesCount > 0 
      ? (completedActivitiesCount / totalActivitiesCount) * 100 
      : 0;

    // Project total cost based on completion trends
    // If we have completion data, extrapolate based on cost per completion percentage
    let projectedTotalCostUsd = totalActualCostUsd;
    if (projectCompletionPercentage > 0 && totalActualCostUsd > 0) {
      // Estimate total cost based on current burn rate
      projectedTotalCostUsd = (totalActualCostUsd / projectCompletionPercentage) * 100;
    } else if (totalPlannedBudgetUsd > 0) {
      // Fallback to planned budget if no actual costs yet
      projectedTotalCostUsd = totalPlannedBudgetUsd;
    }

    // Calculate projected over budget amount
    const projectedOverBudgetUsd = Math.max(0, projectedTotalCostUsd - totalBudgetUsd);

    // Determine if project is at risk of going over budget
    // Risk factors: projected cost exceeds budget OR current utilization > 80% with < 80% completion
    const isOverBudgetRisk = projectedOverBudgetUsd > 0 || 
      (budgetUtilizationPercentage > 80 && projectCompletionPercentage < 80);

    return {
      project_id: projectId,
      total_budget_usd: totalBudgetUsd,
      total_planned_budget_usd: totalPlannedBudgetUsd,
      total_actual_cost_usd: totalActualCostUsd,
      remaining_budget_usd: remainingBudgetUsd,
      budget_utilization_percentage: budgetUtilizationPercentage,
      projected_total_cost_usd: projectedTotalCostUsd,
      projected_over_budget_usd: projectedOverBudgetUsd,
      is_over_budget_risk: isOverBudgetRisk,
      completed_activities_count: completedActivitiesCount,
      total_activities_count: totalActivitiesCount,
      project_completion_percentage: projectCompletionPercentage
    };
  } catch (error) {
    console.error('Budget analysis failed:', error);
    throw error;
  }
};