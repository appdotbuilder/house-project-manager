import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { CreateProjectInput, UpdateProjectInput, Project } from '../../../server/src/schema';
import { Building2, Plus, Edit, Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface ProjectFormProps {
  onProjectCreated: (project: Project) => void;
  onProjectUpdated: (project: Project) => void;
  selectedProject: Project | null;
}

export function ProjectForm({ onProjectCreated, onProjectUpdated, selectedProject }: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: null,
    total_budget_usd: 0,
    current_exchange_rate: 500, // Default CRC exchange rate
    start_date: new Date(),
    end_date: new Date()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && selectedProject) {
        // Update existing project (stub implementation)
        const updatedProject: Project = {
          ...selectedProject,
          ...formData,
          updated_at: new Date()
        };
        onProjectUpdated(updatedProject);
        setIsEditing(false);
      } else {
        // Create new project (stub implementation)
        const newProject: Project = {
          id: Math.floor(Math.random() * 10000),
          ...formData,
          created_at: new Date(),
          updated_at: new Date()
        };
        onProjectCreated(newProject);
      }

      // Reset form
      setFormData({
        name: '',
        description: null,
        total_budget_usd: 0,
        current_exchange_rate: 500,
        start_date: new Date(),
        end_date: new Date()
      });
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (selectedProject) {
      setFormData({
        name: selectedProject.name,
        description: selectedProject.description,
        total_budget_usd: selectedProject.total_budget_usd,
        current_exchange_rate: selectedProject.current_exchange_rate,
        start_date: selectedProject.start_date,
        end_date: selectedProject.end_date
      });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      description: null,
      total_budget_usd: 0,
      current_exchange_rate: 500,
      start_date: new Date(),
      end_date: new Date()
    });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Current Project Info */}
      {selectedProject && !isEditing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-orange-600" />
                  {selectedProject.name}
                </CardTitle>
                <CardDescription>Detalles del proyecto actual</CardDescription>
              </div>
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Editar Proyecto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-gray-500">Descripción</Label>
                <p className="mt-1">{selectedProject.description || 'No se proporcionó descripción'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Presupuesto Total</Label>
                <p className="mt-1 font-semibold">
                  ${selectedProject.total_budget_usd.toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Tipo de Cambio (USD a CRC)</Label>
                <p className="mt-1 font-semibold">₡{selectedProject.current_exchange_rate.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Duración del Proyecto</Label>
                <p className="mt-1">
                  {selectedProject.start_date.toLocaleDateString()} - {selectedProject.end_date.toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Presupuesto en CRC</Label>
                <p className="mt-1 font-semibold text-green-600">
                  ₡{(selectedProject.total_budget_usd * selectedProject.current_exchange_rate).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Creado</Label>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedProject.created_at.toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit className="h-5 w-5 text-blue-600" />
                Editar Proyecto
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-green-600" />
                Crear Nuevo Proyecto
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isEditing ? 
              'Actualiza los detalles de tu proyecto a continuación' : 
              'Comienza creando un nuevo proyecto de construcción con tu presupuesto y cronograma'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo Demostración:</strong> Los proyectos se crean con datos de prueba para demostrar la funcionalidad. 
              En producción, esto se conectaría a una base de datos real.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  Nombre del Proyecto *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProjectInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Mi Casa de Ensueño"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Presupuesto Total (USD) *
                </Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.total_budget_usd}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProjectInput) => ({ 
                      ...prev, 
                      total_budget_usd: parseFloat(e.target.value) || 0 
                    }))
                  }
                  placeholder="150000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción del Proyecto</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateProjectInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                placeholder="Describe tu proyecto de construcción..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="exchange_rate" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Tipo de Cambio (USD a CRC) *
                </Label>
                <Input
                  id="exchange_rate"
                  type="number"
                  value={formData.current_exchange_rate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProjectInput) => ({ 
                      ...prev, 
                      current_exchange_rate: parseFloat(e.target.value) || 0 
                    }))
                  }
                  placeholder="500"
                  min="0"
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500">
                  Tarifa actual: ₡{formData.current_exchange_rate.toLocaleString()} por $1 USD
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fecha de Inicio *
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formatDateForInput(formData.start_date)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProjectInput) => ({ 
                      ...prev, 
                      start_date: new Date(e.target.value) 
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fecha de Finalización *
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formatDateForInput(formData.end_date)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProjectInput) => ({ 
                      ...prev, 
                      end_date: new Date(e.target.value) 
                    }))
                  }
                  required
                />
              </div>
            </div>

            {/* Budget Preview */}
            {formData.total_budget_usd > 0 && formData.current_exchange_rate > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">💰 Vista Previa del Presupuesto</h4>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <div>
                    <span className="text-green-700">Presupuesto USD: </span>
                    <span className="font-semibold">${formData.total_budget_usd.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Equivalente CRC: </span>
                    <span className="font-semibold">
                      ₡{(formData.total_budget_usd * formData.current_exchange_rate).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading} className="flex-1 md:flex-none">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  <>
                    {isEditing ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {isEditing ? 'Actualizar Proyecto' : 'Crear Proyecto'}
                  </>
                )}
              </Button>

              {isEditing && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}