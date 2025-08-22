import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BudgetAnalysis } from '../../../server/src/schema';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Calculator,
  PieChart
} from 'lucide-react';

interface BudgetDashboardProps {
  analysis: BudgetAnalysis;
  isLoading: boolean;
}

export function BudgetDashboard({ analysis, isLoading }: BudgetDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getBudgetStatusColor = (utilizationPercentage: number) => {
    if (utilizationPercentage >= 90) return 'text-red-600';
    if (utilizationPercentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing budget...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Risk Alert */}
      {analysis.is_over_budget_risk && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Budget Risk Alert!</strong> Your project is projected to go over budget by{' '}
            <strong>{formatCurrency(analysis.projected_over_budget_usd)}</strong>.
            Consider reviewing your remaining activities and costs.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Budget Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Budget</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(analysis.total_budget_usd)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Project budget limit</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Planned Budget</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(analysis.total_planned_budget_usd)}
            </div>
            <div className="text-xs text-gray-500 mt-1">All planned activities</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Actual Cost</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(analysis.total_actual_cost_usd)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Spent so far (USD)</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Remaining</span>
            </div>
            <div className={`text-2xl font-bold ${
              analysis.remaining_budget_usd < 0 ? 'text-red-900' : 'text-orange-900'
            }`}>
              {formatCurrency(analysis.remaining_budget_usd)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Budget remaining</div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Budget Utilization
          </CardTitle>
          <CardDescription>
            Current budget usage and project completion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Budget Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Budget Used</span>
                <span className={`text-sm font-semibold ${getBudgetStatusColor(analysis.budget_utilization_percentage)}`}>
                  {analysis.budget_utilization_percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(analysis.budget_utilization_percentage, 100)} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatCurrency(analysis.total_actual_cost_usd)}</span>
                <span>{formatCurrency(analysis.total_budget_usd)}</span>
              </div>
            </div>

            {/* Project Completion Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Project Completion</span>
                <span className="text-sm font-semibold text-blue-600">
                  {analysis.project_completion_percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={analysis.project_completion_percentage} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{analysis.completed_activities_count} completed</span>
                <span>{analysis.total_activities_count} total activities</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Projection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Budget Projection
          </CardTitle>
          <CardDescription>
            Forecasted total project cost and budget variance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Projected Total Cost</span>
              </div>
              <div className="text-3xl font-bold text-purple-900 mb-2">
                {formatCurrency(analysis.projected_total_cost_usd)}
              </div>
              <div className="text-sm text-gray-600">
                Based on current spending trends and remaining planned activities
              </div>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                {analysis.projected_over_budget_usd > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                <span className="font-medium">Budget Variance</span>
              </div>
              <div className={`text-3xl font-bold mb-2 ${
                analysis.projected_over_budget_usd > 0 ? 'text-red-900' : 'text-green-900'
              }`}>
                {analysis.projected_over_budget_usd > 0 ? '+' : ''}{formatCurrency(
                  analysis.projected_over_budget_usd > 0 ? 
                    analysis.projected_over_budget_usd : 
                    analysis.total_budget_usd - analysis.projected_total_cost_usd
                )}
              </div>
              <div className="text-sm text-gray-600">
                {analysis.projected_over_budget_usd > 0 ? 
                  'Projected over budget' : 
                  'Projected under budget'
                }
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 mt-4">
            <Badge variant={analysis.is_over_budget_risk ? 'destructive' : 'default'}>
              {analysis.is_over_budget_risk ? 'High Risk' : 'On Track'}
            </Badge>
            <Badge variant="outline">
              {analysis.completed_activities_count}/{analysis.total_activities_count} Activities
            </Badge>
            <Badge variant="outline">
              {analysis.budget_utilization_percentage.toFixed(1)}% Budget Used
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Key Insights</CardTitle>
          <CardDescription>Budget analysis summary and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <PieChart className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-900">Budget Efficiency</div>
                  <div className="text-sm text-blue-800">
                    You've completed {analysis.project_completion_percentage.toFixed(1)}% of activities using{' '}
                    {analysis.budget_utilization_percentage.toFixed(1)}% of your budget.
                    {analysis.project_completion_percentage > analysis.budget_utilization_percentage ? 
                      ' Great efficiency! You\'re ahead of budget.' :
                      ' Monitor spending to stay on track.'
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-900">Remaining Activities</div>
                  <div className="text-sm text-green-800">
                    {analysis.total_activities_count - analysis.completed_activities_count} activities remain with{' '}
                    {formatCurrency(analysis.total_planned_budget_usd - analysis.total_actual_cost_usd)} planned budget.
                  </div>
                </div>
              </div>
            </div>

            {analysis.is_over_budget_risk && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-900">Action Required</div>
                    <div className="text-sm text-red-800">
                      Consider reviewing activity costs, negotiating with contractors, or adjusting project scope
                      to avoid budget overrun of {formatCurrency(analysis.projected_over_budget_usd)}.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}