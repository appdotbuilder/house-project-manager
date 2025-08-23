import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Activity, UpdateActivityInput } from '../../../server/src/schema';
import { Edit, Calendar, DollarSign, User, Clock, CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';

interface ActivityListProps {
  activities: Activity[];
  onActivityUpdated: (activity: Activity) => void;
  isLoading: boolean;
}

export function ActivityList({ activities, onActivityUpdated, isLoading }: ActivityListProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState<Partial<UpdateActivityInput>>({});

  const handleEditClick = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      id: activity.id,
      name: activity.name,
      description: activity.description,
      estimated_start_date: activity.estimated_start_date,
      estimated_end_date: activity.estimated_end_date,
      actual_start_date: activity.actual_start_date,
      actual_end_date: activity.actual_end_date,
      contractor: activity.contractor,
      planned_budget_usd: activity.planned_budget_usd,
      actual_cost_crc: activity.actual_cost_crc,
      status: activity.status
    });
  };

  const handleUpdateActivity = async () => {
    if (!editingActivity || !formData.id) return;

    setUpdateLoading(true);
    try {
      // Update activity with stub implementation
      const updatedActivity: Activity = {
        ...editingActivity,
        ...formData,
        updated_at: new Date()
      } as Activity;
      onActivityUpdated(updatedActivity);
      setEditingActivity(null);
      setFormData({});
    } catch (error) {
      console.error('Failed to update activity:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleStatusUpdate = async (activity: Activity, newStatus: Activity['status']) => {
    setUpdateLoading(true);
    try {
      // Update activity status with stub implementation
      const updatedActivity: Activity = {
        ...activity,
        status: newStatus,
        actual_start_date: newStatus === 'in_progress' && !activity.actual_start_date ? new Date() : activity.actual_start_date,
        actual_end_date: newStatus === 'completed' || newStatus === 'cancelled' ? new Date() : activity.actual_end_date,
        updated_at: new Date()
      };
      onActivityUpdated(updatedActivity);
    } catch (error) {
      console.error('Failed to update activity status:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusIcon = (status: Activity['status']) => {
    switch (status) {
      case 'planned': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'planned': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Activity['status']) => {
    switch (status) {
      case 'planned': return 'Planificado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const filteredActivities = activities.filter((activity: Activity) => {
    if (statusFilter === 'all') return true;
    return activity.status === statusFilter;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando actividades...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                📋 Actividades del Proyecto
                <Badge variant="outline">{filteredActivities.length} actividades</Badge>
              </CardTitle>
              <CardDescription>Rastrea el progreso y gestiona las actividades de construcción</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="planned">Planificado</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No Hay Actividades Aún' : `No Hay Actividades ${getStatusText(statusFilter as Activity['status'])}`}
            </h3>
            <p className="text-gray-600">
              {statusFilter === 'all' ? 
                'Agrega tu primera actividad de construcción para comenzar.' :
                `No se encontraron actividades con estado ${getStatusText(statusFilter as Activity['status'])}.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredActivities.map((activity: Activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{activity.name}</h3>
                    {activity.description && (
                      <p className="text-gray-600 text-sm mb-2">{activity.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {activity.contractor && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {activity.contractor}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {activity.estimated_start_date.toLocaleDateString()} - {activity.estimated_end_date.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(activity.status)}>
                      {getStatusIcon(activity.status)}
                      <span className="ml-1">{getStatusText(activity.status)}</span>
                    </Badge>
                  </div>
                </div>

                {/* Budget Information */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 mb-1">Presupuesto Planificado</div>
                    <div className="font-semibold text-blue-900">{formatCurrency(activity.planned_budget_usd)}</div>
                  </div>
                  
                  {activity.actual_cost_crc && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600 mb-1">Costo Real (CRC)</div>
                      <div className="font-semibold text-green-900">₡{activity.actual_cost_crc.toLocaleString()}</div>
                    </div>
                  )}

                  {activity.actual_start_date && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600 mb-1">Inicio Real</div>
                      <div className="font-semibold text-purple-900">
                        {activity.actual_start_date.toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {activity.actual_end_date && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-sm text-orange-600 mb-1">Finalización Real</div>
                      <div className="font-semibold text-orange-900">
                        {activity.actual_end_date.toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {/* Quick Status Updates */}
                    {activity.status === 'planned' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            Iniciar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Iniciar Actividad</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esto marcará "{activity.name}" como en progreso y establecerá la fecha de inicio real a hoy.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleStatusUpdate(activity, 'in_progress')}>
                              Iniciar Actividad
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {activity.status === 'in_progress' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-green-600 border-green-300">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Completar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Completar Actividad</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esto marcará "{activity.name}" como completada y establecerá la fecha de finalización real a hoy.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleStatusUpdate(activity, 'completed')}>
                              Completar Actividad
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(activity)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar Detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Editar Actividad</DialogTitle>
                        <DialogDescription>
                          Actualiza los detalles de la actividad, presupuesto y costos reales
                        </DialogDescription>
                      </DialogHeader>
                      
                      {editingActivity && (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Nombre de la Actividad</Label>
                              <Input
                                value={formData.name || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Estado</Label>
                              <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as Activity['status'] }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="planned">Planificado</SelectItem>
                                  <SelectItem value="in_progress">En Progreso</SelectItem>
                                  <SelectItem value="completed">Completado</SelectItem>
                                  <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Contratista</Label>
                              <Input
                                value={formData.contractor || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev) => ({ ...prev, contractor: e.target.value || null }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Presupuesto Planificado (USD)</Label>
                              <Input
                                type="number"
                                value={formData.planned_budget_usd || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev) => ({ ...prev, planned_budget_usd: parseFloat(e.target.value) || 0 }))
                                }
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Fecha de Inicio Real</Label>
                              <Input
                                type="date"
                                value={formatDateForInput(formData.actual_start_date || null)}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev) => ({ ...prev, actual_start_date: e.target.value ? new Date(e.target.value) : null }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Fecha de Finalización Real</Label>
                              <Input
                                type="date"
                                value={formatDateForInput(formData.actual_end_date || null)}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev) => ({ ...prev, actual_end_date: e.target.value ? new Date(e.target.value) : null }))
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Costo Real (CRC)</Label>
                            <Input
                              type="number"
                              value={formData.actual_cost_crc || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev) => ({ ...prev, actual_cost_crc: parseFloat(e.target.value) || null }))
                              }
                              placeholder="Ingresa el costo real en Colones de Costa Rica"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingActivity(null)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleUpdateActivity} disabled={updateLoading}>
                              {updateLoading ? 'Actualizando...' : 'Actualizar Actividad'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}