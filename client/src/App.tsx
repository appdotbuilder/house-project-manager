import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { ProjectForm } from './components/ProjectForm';
import { ActivityForm } from './components/ActivityForm';
import { ExchangeRateForm } from './components/ExchangeRateForm';
import { ActivityList } from './components/ActivityList';
import { BudgetDashboard } from './components/BudgetDashboard';
import type { Project, Activity, BudgetAnalysis } from '../../server/src/schema';
import { AlertTriangle, Building2, DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);

  // Load all projects
  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getProjects.query();
      setProjects(result);
      
      // If no project is selected but we have projects, select the first one
      if (!selectedProject && result.length > 0) {
        setSelectedProject(result[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      // Show demo data when backend is not available
      const demoProjects: Project[] = [];
      setProjects(demoProjects);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject]);

  // Load project-specific data (activities and budget analysis)
  const loadProjectData = useCallback(async (projectId: number) => {
    try {
      setIsProjectLoading(true);
      const [activitiesResult, budgetResult] = await Promise.all([
        trpc.getActivities.query({ projectId }),
        trpc.getBudgetAnalysis.query({ projectId })
      ]);
      
      setActivities(activitiesResult);
      setBudgetAnalysis(budgetResult);
    } catch (error) {
      console.error('Failed to load project data:', error);
      // Show demo data when backend is not available
      setActivities([]);
      
      // Generate demo budget analysis
      const demoBudgetAnalysis: BudgetAnalysis = {
        project_id: projectId,
        total_budget_usd: selectedProject?.total_budget_usd || 100000,
        total_planned_budget_usd: 0,
        total_actual_cost_usd: 0,
        remaining_budget_usd: selectedProject?.total_budget_usd || 100000,
        budget_utilization_percentage: 0,
        projected_total_cost_usd: 0,
        projected_over_budget_usd: 0,
        is_over_budget_risk: false,
        completed_activities_count: 0,
        total_activities_count: 0,
        project_completion_percentage: 0
      };
      setBudgetAnalysis(demoBudgetAnalysis);
    } finally {
      setIsProjectLoading(false);
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Load project data when selected project changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject.id);
    }
  }, [selectedProject, loadProjectData]);

  const handleProjectCreated = async (newProject: Project) => {
    setProjects((prev: Project[]) => [...prev, newProject]);
    setSelectedProject(newProject);
  };

  const handleProjectUpdated = async (updatedProject: Project) => {
    setProjects((prev: Project[]) => 
      prev.map((p: Project) => p.id === updatedProject.id ? updatedProject : p)
    );
    setSelectedProject(updatedProject);
  };

  const handleActivityCreated = async (newActivity: Activity) => {
    setActivities((prev: Activity[]) => {
      const updatedActivities = [...prev, newActivity];
      
      // Update budget analysis with new activity
      if (selectedProject && budgetAnalysis) {
        const totalPlanned = updatedActivities.reduce((sum, act) => sum + act.planned_budget_usd, 0);
        const actualCost = updatedActivities.reduce((sum, act) => sum + (act.actual_cost_crc || 0) / selectedProject.current_exchange_rate, 0);
        const completed = updatedActivities.filter(act => act.status === 'completed').length;
        
        const updatedAnalysis: BudgetAnalysis = {
          ...budgetAnalysis,
          total_planned_budget_usd: totalPlanned,
          total_actual_cost_usd: actualCost,
          remaining_budget_usd: selectedProject.total_budget_usd - actualCost,
          budget_utilization_percentage: (actualCost / selectedProject.total_budget_usd) * 100,
          projected_total_cost_usd: totalPlanned,
          projected_over_budget_usd: Math.max(0, totalPlanned - selectedProject.total_budget_usd),
          is_over_budget_risk: totalPlanned > selectedProject.total_budget_usd,
          completed_activities_count: completed,
          total_activities_count: updatedActivities.length,
          project_completion_percentage: updatedActivities.length > 0 ? (completed / updatedActivities.length) * 100 : 0
        };
        setBudgetAnalysis(updatedAnalysis);
      }
      
      return updatedActivities;
    });
  };

  const handleActivityUpdated = async (updatedActivity: Activity) => {
    setActivities((prev: Activity[]) => {
      const updatedActivities = prev.map((a: Activity) => a.id === updatedActivity.id ? updatedActivity : a);
      
      // Update budget analysis with updated activity
      if (selectedProject && budgetAnalysis) {
        const totalPlanned = updatedActivities.reduce((sum, act) => sum + act.planned_budget_usd, 0);
        const actualCost = updatedActivities.reduce((sum, act) => sum + (act.actual_cost_crc || 0) / selectedProject.current_exchange_rate, 0);
        const completed = updatedActivities.filter(act => act.status === 'completed').length;
        
        const updatedAnalysis: BudgetAnalysis = {
          ...budgetAnalysis,
          total_planned_budget_usd: totalPlanned,
          total_actual_cost_usd: actualCost,
          remaining_budget_usd: selectedProject.total_budget_usd - actualCost,
          budget_utilization_percentage: (actualCost / selectedProject.total_budget_usd) * 100,
          projected_total_cost_usd: totalPlanned,
          projected_over_budget_usd: Math.max(0, totalPlanned - selectedProject.total_budget_usd),
          is_over_budget_risk: totalPlanned > selectedProject.total_budget_usd,
          completed_activities_count: completed,
          total_activities_count: updatedActivities.length,
          project_completion_percentage: updatedActivities.length > 0 ? (completed / updatedActivities.length) * 100 : 0
        };
        setBudgetAnalysis(updatedAnalysis);
      }
      
      return updatedActivities;
    });
  };

  const handleExchangeRateUpdated = async () => {
    // In stub mode, we don't need to refresh everything
    // Just update the current project's exchange rate would be handled by the parent component
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-orange-600 animate-pulse" />
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">🏠 Construction Project Manager</h1>
          </div>
          <p className="text-gray-600">
            Track your house construction project, manage budgets, and monitor progress
          </p>
        </div>

        {/* Project Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
            <Badge variant="outline" className="text-sm">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <Alert className="border-orange-200 bg-orange-50 mb-4">
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode:</strong> Backend handlers are stub implementations. 
              You can create projects to explore the interface, but data won't persist between sessions.
            </AlertDescription>
          </Alert>
          
          {projects.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="text-center py-12">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Construction Project Manager! 🏗️</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Get started by creating your first construction project. Track activities, 
                  manage budgets, and monitor progress all in one place.
                </p>
                <div className="grid gap-4 max-w-2xl mx-auto md:grid-cols-3 text-sm">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <div className="font-medium text-blue-900">Track Activities</div>
                    <div className="text-blue-700">Manage construction tasks and timelines</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <div className="font-medium text-green-900">Monitor Budget</div>
                    <div className="text-green-700">USD budgets with CRC expense tracking</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <div className="font-medium text-purple-900">Exchange Rates</div>
                    <div className="text-purple-700">Manage USD to CRC conversions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project: Project) => (
                <Card 
                  key={project.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedProject?.id === project.id ? 'ring-2 ring-orange-500 shadow-md' : ''
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                      <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Budget:</span>
                        <span className="font-medium">{formatCurrency(project.total_budget_usd)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Exchange Rate:</span>
                        <span className="font-medium">₡{project.current_exchange_rate.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium">
                          {Math.ceil((project.end_date.getTime() - project.start_date.getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="exchange" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Exchange Rate
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Manage Projects
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {selectedProject ? (
              <div className="space-y-6">
                {/* Project Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-orange-600" />
                          {selectedProject.name}
                        </CardTitle>
                        <CardDescription>{selectedProject.description}</CardDescription>
                      </div>
                      {budgetAnalysis?.is_over_budget_risk && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Budget Risk
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="text-center p-4 rounded-lg bg-blue-50">
                        <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                        <div className="text-2xl font-bold text-blue-900">
                          {selectedProject.start_date.toLocaleDateString()}
                        </div>
                        <div className="text-sm text-blue-600">Start Date</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-green-50">
                        <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <div className="text-2xl font-bold text-green-900">
                          {formatCurrency(selectedProject.total_budget_usd)}
                        </div>
                        <div className="text-sm text-green-600">Total Budget</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-purple-50">
                        <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <div className="text-2xl font-bold text-purple-900">
                          ₡{selectedProject.current_exchange_rate.toLocaleString()}
                        </div>
                        <div className="text-sm text-purple-600">Exchange Rate</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-orange-50">
                        <Users className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <div className="text-2xl font-bold text-orange-900">
                          {activities.length}
                        </div>
                        <div className="text-sm text-orange-600">Activities</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Budget Dashboard */}
                {budgetAnalysis && (
                  <BudgetDashboard 
                    analysis={budgetAnalysis} 
                    isLoading={isProjectLoading}
                  />
                )}

                {/* Recent Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>Latest activity updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activities.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No activities yet. Add some activities to track your project progress.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {activities.slice(0, 5).map((activity: Activity) => (
                          <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex-1">
                              <h4 className="font-medium">{activity.name}</h4>
                              <p className="text-sm text-gray-600">
                                {activity.contractor && `Contractor: ${activity.contractor} • `}
                                Planned: {formatCurrency(activity.planned_budget_usd)}
                              </p>
                            </div>
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
                  <p className="text-gray-600">
                    Create a new project or select an existing one to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            {selectedProject ? (
              <div className="space-y-6">
                <ActivityForm 
                  projectId={selectedProject.id}
                  onActivityCreated={handleActivityCreated}
                />
                <ActivityList 
                  activities={activities}
                  onActivityUpdated={handleActivityUpdated}
                  isLoading={isProjectLoading}
                />
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Select a project to manage activities.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget">
            {selectedProject ? (
              budgetAnalysis ? (
                <BudgetDashboard 
                  analysis={budgetAnalysis} 
                  isLoading={isProjectLoading}
                />
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
                    <p className="text-gray-600">Loading budget analysis...</p>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Select a project to view budget analysis.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Exchange Rate Tab */}
          <TabsContent value="exchange">
            {selectedProject ? (
              <ExchangeRateForm 
                project={selectedProject}
                onExchangeRateUpdated={handleExchangeRateUpdated}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Select a project to manage exchange rates.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <ProjectForm 
              onProjectCreated={handleProjectCreated}
              onProjectUpdated={handleProjectUpdated}
              selectedProject={selectedProject}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;