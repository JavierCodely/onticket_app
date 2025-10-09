/**
 * Ventas Page
 * Complete sales management with realtime updates
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, CreditCard, Package } from 'lucide-react';
import { StatsCard } from '@/components/molecules/ventas/StatsCard';
import { SalesFilters } from '@/components/molecules/ventas/SalesFilters';
import { NewSaleDialog } from '@/components/organisms/ventas/NewSaleDialog';
import { useSales } from '@/hooks/useSales';
import { formatCurrency } from '@/lib/currency-utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Producto, Promocion, Combo, Personal, SaleFilters } from '@/types/database';

export function VentasPage() {
  const { user } = useAuth();
  const [showNewSaleDialog, setShowNewSaleDialog] = useState(false);
  const [filters, setFilters] = useState<SaleFilters>({});

  // Data for new sale dialog
  const [productos, setProductos] = useState<Producto[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [empleados, setEmpleados] = useState<Personal[]>([]);

  // Sales data with realtime
  const { sales, statistics, loading, error, fetchSales } = useSales({
    enableRealtime: true,
    filters,
  });

  /**
   * Fetch data for new sale dialog (products, promotions, combos, employees)
   */
  const fetchDialogData = useCallback(async () => {
    if (!user?.club?.id) return;

    try {
      // Fetch products
      const { data: productosData } = await supabase
        .from('productos')
        .select('*')
        .eq('club_id', user.club.id)
        .order('nombre');

      // Fetch active promotions
      const { data: promocionesData } = await supabase
        .from('promociones')
        .select('*')
        .eq('club_id', user.club.id)
        .eq('activo', true)
        .order('created_at', { ascending: false });

      // Fetch active combos with products
      const { data: combosData } = await supabase
        .from('combos')
        .select(`
          *,
          combo_productos(
            cantidad,
            productos(
              id,
              nombre,
              categoria
            )
          )
        `)
        .eq('club_id', user.club.id)
        .eq('activo', true)
        .order('nombre');

      // Fetch employees (bartenders and admins)
      const { data: empleadosData } = await supabase
        .from('personal')
        .select('*')
        .eq('club_id', user.club.id)
        .eq('activo', true)
        .in('rol', ['Admin', 'Bartender'])
        .order('nombre');

      setProductos(productosData || []);
      setPromociones(promocionesData || []);
      setCombos(combosData || []);
      setEmpleados(empleadosData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [user?.club?.id]);

  /**
   * Fetch initial data for sales
   */
  useEffect(() => {
    fetchDialogData();
  }, [fetchDialogData]);

  /**
   * Handle sale created - refresh both sales and product data
   */
  const handleSaleCreated = () => {
    fetchSales(); // Refresh sales list
    fetchDialogData(); // Refresh products, promotions, combos (to get updated stock)
  };

  /**
   * Get payment method label
   */
  const getMetodoPagoLabel = (metodo: string): string => {
    const labels: Record<string, string> = {
      efectivo: '💵 Efectivo',
      transferencia: '🏦 Transferencia',
      tarjeta: '💳 Tarjeta',
      billetera_virtual: '📱 Billetera Virtual',
    };
    return labels[metodo] || metodo;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
            <p className="text-muted-foreground">
              Gestión de ventas con actualización en tiempo real
            </p>
          </div>
          <Button onClick={() => setShowNewSaleDialog(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Venta
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Total Ventas"
            value={formatCurrency(statistics.total_ventas, 'ARS')}
            icon={DollarSign}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatsCard
            label="Efectivo"
            value={formatCurrency(statistics.total_efectivo, 'ARS')}
            icon={DollarSign}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatsCard
            label="Transferencia"
            value={formatCurrency(statistics.total_transferencia, 'ARS')}
            icon={CreditCard}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatsCard
            label="Productos Vendidos"
            value={statistics.total_productos_vendidos}
            icon={Package}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>

        {/* Filters */}
        <SalesFilters onFiltersChange={setFilters} empleados={empleados} />

        {/* Sales Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">
                Cargando ventas...
              </div>
            ) : error ? (
              <div className="p-12 text-center text-destructive">{error}</div>
            ) : sales.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay ventas registradas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>Moneda</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.productos?.nombre || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sale.productos?.categoria || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        {sale.personal?.nombre} {sale.personal?.apellido}
                      </TableCell>
                      <TableCell>{sale.cantidad}</TableCell>
                      <TableCell>{getMetodoPagoLabel(sale.metodo_pago)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sale.moneda}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sale.total, sale.moneda)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* New Sale Dialog */}
        <NewSaleDialog
          open={showNewSaleDialog}
          onOpenChange={setShowNewSaleDialog}
          productos={productos}
          promociones={promociones}
          combos={combos}
          empleados={empleados}
          onSaleCreated={handleSaleCreated}
        />
      </div>
    </AdminLayout>
  );
}

// Export as default for backward compatibility
export default VentasPage;
