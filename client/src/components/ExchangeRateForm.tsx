import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { UpdateExchangeRateInput, ExchangeRateHistory, Project } from '../../../server/src/schema';
import { TrendingUp, TrendingDown, Calendar, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react';

interface ExchangeRateFormProps {
  project: Project;
  onExchangeRateUpdated: () => void;
}

export function ExchangeRateForm({ project, onExchangeRateUpdated }: ExchangeRateFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [newRate, setNewRate] = useState(project.current_exchange_rate);
  const [rateHistory, setRateHistory] = useState<ExchangeRateHistory[]>([]);

  const loadRateHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const history = await trpc.getExchangeRateHistory.query({ projectId: project.id });
      setRateHistory(history);
    } catch (error) {
      console.error('Failed to load exchange rate history:', error);
      // Show empty history when backend is not available
      setRateHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadRateHistory();
  }, [loadRateHistory]);

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update exchange rate with stub implementation
      const newHistoryEntry: ExchangeRateHistory = {
        id: Math.floor(Math.random() * 10000),
        project_id: project.id,
        usd_to_crc_rate: newRate,
        effective_date: new Date(),
        created_at: new Date()
      };
      
      // Add to history
      setRateHistory((prev: ExchangeRateHistory[]) => [newHistoryEntry, ...prev]);
      onExchangeRateUpdated();
    } catch (error) {
      console.error('Failed to update exchange rate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRateChange = (currentRate: number, previousRate: number) => {
    const change = ((currentRate - previousRate) / previousRate) * 100;
    return {
      percentage: Math.abs(change),
      isIncrease: change > 0,
      isDecrease: change < 0
    };
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const budgetImpact = {
    current: project.total_budget_usd * project.current_exchange_rate,
    new: project.total_budget_usd * newRate,
    difference: project.total_budget_usd * (newRate - project.current_exchange_rate)
  };

  const latestHistoryRate = rateHistory.length > 0 ? rateHistory[0] : null;
  const rateChange = latestHistoryRate ? calculateRateChange(project.current_exchange_rate, latestHistoryRate.usd_to_crc_rate) : null;

  return (
    <div className="space-y-6">
      {/* Current Rate Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Tipo de Cambio Actual
          </CardTitle>
          <CardDescription>Tasa de conversión de USD a Colones de Costa Rica</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-900">
                ₡{project.current_exchange_rate.toLocaleString()}
              </div>
              <div className="text-sm text-blue-600">por $1 USD</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-900">
                ₡{(project.total_budget_usd * project.current_exchange_rate).toLocaleString()}
              </div>
              <div className="text-sm text-green-600">Presupuesto Total en CRC</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-purple-50">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-lg font-bold text-purple-900">
                {project.updated_at.toLocaleDateString()}
              </div>
              <div className="text-sm text-purple-600">Última Actualización</div>
            </div>
          </div>

          {rateChange && (
            <div className="mt-4 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                {rateChange.isIncrease ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : rateChange.isDecrease ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <RefreshCw className="h-4 w-4 text-gray-600" />
                )}
                <span className="text-sm font-medium">
                  {rateChange.isIncrease ? 'Aumentó' : rateChange.isDecrease ? 'Disminuyó' : 'Sin cambio'} en{' '}
                  <span className={rateChange.isIncrease ? 'text-green-600' : rateChange.isDecrease ? 'text-red-600' : 'text-gray-600'}>
                    {rateChange.percentage.toFixed(2)}%
                  </span>
                  {' '}desde la última actualización
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Rate Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-green-600" />
            Actualizar Tipo de Cambio
          </CardTitle>
          <CardDescription>
            Actualiza la tasa de cambio de USD a CRC para reflejar las condiciones actuales del mercado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo Demostración:</strong> Las actualizaciones del tipo de cambio están simuladas. 
              En producción, esto actualizaría la tasa actual del proyecto y afectaría todos los cálculos presupuestales.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleUpdateRate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="new-rate" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Nuevo Tipo de Cambio (USD a CRC) *
              </Label>
              <Input
                id="new-rate"
                type="number"
                value={newRate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewRate(parseFloat(e.target.value) || 0)
                }
                placeholder="550"
                min="0"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500">
                Ingresa la tasa actual de USD a CRC (ej. 550 significa ₡550 por $1 USD)
              </p>
            </div>

            {/* Rate Impact Preview */}
            {newRate !== project.current_exchange_rate && newRate > 0 && (
              <div className={`p-4 rounded-lg border ${
                budgetImpact.difference > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <h4 className={`font-medium mb-3 ${
                  budgetImpact.difference > 0 ? 'text-green-900' : 'text-red-900'
                }`}>
                  💱 Vista Previa del Impacto en el Presupuesto
                </h4>
                <div className="grid gap-3 md:grid-cols-3 text-sm">
                  <div>
                    <span className="text-gray-600">Presupuesto Actual (CRC): </span>
                    <span className="font-semibold">₡{budgetImpact.current.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Nuevo Presupuesto (CRC): </span>
                    <span className="font-semibold">₡{budgetImpact.new.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Diferencia: </span>
                    <span className={`font-semibold ${
                      budgetImpact.difference > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {budgetImpact.difference > 0 ? '+' : ''}₡{budgetImpact.difference.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Cambio en tipo de cambio: ₡{project.current_exchange_rate.toLocaleString()} → ₡{newRate.toLocaleString()} por USD
                </div>
              </div>
            )}

            <Button type="submit" disabled={isLoading || newRate === project.current_exchange_rate}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Actualizando Tasa...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar Tipo de Cambio
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Rate History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Historial de Tipos de Cambio
            {rateHistory.length > 0 && (
              <Badge variant="outline">{rateHistory.length} actualizaciones</Badge>
            )}
          </CardTitle>
          <CardDescription>Rastrea los cambios en el tipo de cambio a lo largo del tiempo</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Cargando historial de tasas...</p>
            </div>
          ) : rateHistory.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No hay historial de tasas disponible aún.</p>
              <p className="text-sm text-gray-500">Los cambios de tasa aparecerán aquí después de actualizar el tipo de cambio.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rateHistory.map((rate: ExchangeRateHistory) => (
                <div key={rate.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="font-medium">₡{rate.usd_to_crc_rate.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">por $1 USD</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {rate.effective_date.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {rate.effective_date.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}