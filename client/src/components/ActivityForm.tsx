import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { CreateActivityInput, Activity } from '../../../server/src/schema';
import { Plus, Calendar, DollarSign, User } from 'lucide-react';

interface ActivityFormProps {
  projectId: number;
  onActivityCreated: (activity: Activity) => void;
}

export function ActivityForm({ projectId, onActivityCreated }: ActivityFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateActivityInput>({
    project_id: projectId,
    name: '',
    description: null,
    estimated_start_date: new Date(),
    estimated_end_date: new Date(),
    contractor: null,
    planned_budget_usd: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create activity with stub implementation
      const newActivity: Activity = {
        id: Math.floor(Math.random() * 10000),
        ...formData,
        actual_start_date: null,
        actual_end_date: null,
        actual_cost_crc: null,
        status: 'planned' as const,
        created_at: new Date(),
        updated_at: new Date()
      };
      onActivityCreated(newActivity);

      // Reset form
      setFormData({
        project_id: projectId,
        name: '',
        description: null,
        estimated_start_date: new Date(),
        estimated_end_date: new Date(),
        contractor: null,
        planned_budget_usd: 0
      });
    } catch (error) {
      console.error('Failed to create activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-green-600" />
          Agregar Nueva Actividad
        </CardTitle>
        <CardDescription>
          Crear una actividad de construcción con detalles de cronograma y presupuesto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="activity-name" className="flex items-center gap-1">
                📋 Nombre de la Actividad *
              </Label>
              <Input
                id="activity-name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateActivityInput) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Trabajo de cimientos, Techado, Electricidad..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractor" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Contratista
              </Label>
              <Input
                id="contractor"
                value={formData.contractor || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateActivityInput) => ({
                    ...prev,
                    contractor: e.target.value || null
                  }))
                }
                placeholder="Nombre del contratista o empresa"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-description">Descripción</Label>
            <Textarea
              id="activity-description"
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateActivityInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              placeholder="Descripción detallada de la actividad de construcción..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="planned-budget" className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Presupuesto Planificado (USD) *
              </Label>
              <Input
                id="planned-budget"
                type="number"
                value={formData.planned_budget_usd}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateActivityInput) => ({
                    ...prev,
                    planned_budget_usd: parseFloat(e.target.value) || 0
                  }))
                }
                placeholder="5000"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Inicio Estimado *
              </Label>
              <Input
                id="start-date"
                type="date"
                value={formatDateForInput(formData.estimated_start_date)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateActivityInput) => ({
                    ...prev,
                    estimated_start_date: new Date(e.target.value)
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Finalización Estimada *
              </Label>
              <Input
                id="end-date"
                type="date"
                value={formatDateForInput(formData.estimated_end_date)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateActivityInput) => ({
                    ...prev,
                    estimated_end_date: new Date(e.target.value)
                  }))
                }
                required
              />
            </div>
          </div>

          {/* Activity Preview */}
          {formData.name && formData.planned_budget_usd > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">📋 Vista Previa de la Actividad</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-blue-700">Actividad: </span>
                  <span className="font-semibold">{formData.name}</span>
                </div>
                {formData.contractor && (
                  <div>
                    <span className="text-blue-700">Contratista: </span>
                    <span className="font-semibold">{formData.contractor}</span>
                  </div>
                )}
                <div>
                  <span className="text-blue-700">Presupuesto: </span>
                  <span className="font-semibold">${formData.planned_budget_usd.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-blue-700">Duración: </span>
                  <span className="font-semibold">
                    {Math.ceil((formData.estimated_end_date.getTime() - formData.estimated_start_date.getTime()) / (1000 * 60 * 60 * 24))} días
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando Actividad...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Actividad
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}