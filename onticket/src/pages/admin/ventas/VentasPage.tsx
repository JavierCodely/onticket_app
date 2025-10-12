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
import { Plus, DollarSign, CreditCard, Package, ChevronDown, ChevronRight, Trash2, Pencil } from 'lucide-react';
import { StatsCard } from '@/components/molecules/ventas/StatsCard';
import { SalesFilters } from '@/components/molecules/ventas/SalesFilters';
import { NewSaleDialog } from '@/components/organisms/ventas/NewSaleDialog';
import { useSales } from '@/hooks/useSales';
import { formatCurrency } from '@/lib/currency-utils';
import { getCategoryBadgeClass } from '@/lib/category-colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Producto, Promocion, ComboWithProducts, Personal, SaleFilters, SaleWithDetails } from '@/types/database';

export function VentasPage() {
  const { user } = useAuth();
  const [showNewSaleDialog, setShowNewSaleDialog] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleWithDetails | null>(null);
  const [filters, setFilters] = useState<SaleFilters>({});
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());

  // Data for new sale dialog
  const [productos, setProductos] = useState<Producto[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [combos, setCombos] = useState<ComboWithProducts[]>([]);
  const [empleados, setEmpleados] = useState<Personal[]>([]);

  // Sales data with realtime
  const { sales, statistics, loading, error, fetchSales, deleteSale } = useSales({
    enableRealtime: true,
    filters,
  });

  /**
   * Toggle expanded sale
   */
  const toggleExpanded = (saleId: string) => {
    setExpandedSales((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(saleId)) {
        newSet.delete(saleId);
      } else {
        newSet.add(saleId);
      }
      return newSet;
    });
  };

  /**
   * Handle edit sale (Admin only)
   */
  const handleEditSale = async (sale: SaleWithDetails) => {
    if (user?.personal?.rol !== 'Admin') {
      alert('Solo los administradores pueden editar ventas');
      return;
    }

    // Load all promotions and combos used in this sale (even if inactive)
    try {
      const promocionIds = sale.sale_items
        ?.filter(item => item.item_type === 'promotion' && item.promocion_id)
        .map(item => item.promocion_id);

      const comboIds = sale.sale_items
        ?.filter(item => item.item_type === 'combo' && item.combo_id)
        .map(item => item.combo_id);

      // Arrays to track inactive items
      const inactiveItems: string[] = [];

      // Fetch promotions used in this sale (even if inactive)
      if (promocionIds && promocionIds.length > 0) {
        const { data: usedPromociones } = await supabase
          .from('promociones')
          .select('*')
          .in('id', promocionIds);

        if (usedPromociones && usedPromociones.length > 0) {
          // Check for inactive promotions
          const inactivePromociones = (usedPromociones as Promocion[]).filter(p => !p.activo);
          if (inactivePromociones.length > 0) {
            inactivePromociones.forEach(p => {
              const producto = productos.find(prod => prod.id === p.producto_id);
              inactiveItems.push(`Promoción: ${producto?.nombre || 'Desconocido'}`);
            });
          }

          // Merge with existing active promotions, avoiding duplicates
          const mergedPromociones = [...promociones];
          for (const promo of (usedPromociones as Promocion[])) {
            if (!mergedPromociones.find(p => p.id === promo.id)) {
              mergedPromociones.push(promo);
            }
          }
          setPromociones(mergedPromociones);
        }
      }

      // Fetch combos used in this sale (even if inactive)
      if (comboIds && comboIds.length > 0) {
        const uniqueComboIds = [...new Set(comboIds)];
        const { data: usedCombos } = await supabase
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
          .in('id', uniqueComboIds);

        if (usedCombos) {
          // Check for inactive combos
          const inactiveCombos = (usedCombos as ComboWithProducts[]).filter(c => !c.activo);
          if (inactiveCombos.length > 0) {
            inactiveCombos.forEach(c => {
              inactiveItems.push(`Combo: ${c.nombre}`);
            });
          }

          // Merge with existing active combos, avoiding duplicates
          const mergedCombos = [...combos];
          for (const combo of (usedCombos as ComboWithProducts[])) {
            if (!mergedCombos.find(c => c.id === combo.id)) {
              mergedCombos.push(combo);
            }
          }
          setCombos(mergedCombos);
        }
      }

      // Show warning if there are inactive items
      if (inactiveItems.length > 0) {
        const itemsList = inactiveItems.join('\n• ');
        const shouldContinue = confirm(
          `⚠️ ADVERTENCIA: Esta venta contiene promociones o combos que están INACTIVOS:\n\n• ${itemsList}\n\n` +
          `Si editas esta venta, estos items se cargarán con sus precios originales.\n\n` +
          `¿Deseas continuar con la edición?`
        );

        if (!shouldContinue) {
          return; // Cancel editing
        }
      }
    } catch (error) {
      console.error('Error loading sale data:', error);
    }

    setEditingSale(sale);
    setShowNewSaleDialog(true);
  };

  /**
   * Handle delete sale (Admin only)
   */
  const handleDeleteSale = async (saleId: string) => {
    if (user?.personal?.rol !== 'Admin') {
      alert('Solo los administradores pueden eliminar ventas');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar esta venta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteSale(saleId);
      alert('Venta eliminada correctamente');
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Error al eliminar la venta');
    }
  };

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
    setEditingSale(null); // Clear editing state
  };

  /**
   * Handle dialog close - clear editing state
   */
  const handleDialogClose = (open: boolean) => {
    setShowNewSaleDialog(open);
    if (!open) {
      setEditingSale(null); // Clear editing state when dialog closes
    }
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
                  <TableRow className="border-b-2">
                    <TableHead className="h-14 text-base font-bold w-12"></TableHead>
                    <TableHead className="h-14 text-base font-bold">Fecha</TableHead>
                    <TableHead className="h-14 text-base font-bold">Empleado</TableHead>
                    <TableHead className="h-14 text-base font-bold">Items</TableHead>
                    <TableHead className="h-14 text-base font-bold">Método de Pago</TableHead>
                    <TableHead className="h-14 text-base font-bold">Moneda</TableHead>
                    <TableHead className="h-14 text-base font-bold text-right">Total</TableHead>
                    {user?.personal?.rol === 'Admin' && (
                      <TableHead className="h-14 text-base font-bold text-right">Acciones</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => {
                    const isExpanded = expandedSales.has(sale.id);
                    const itemCount = sale.sale_items?.length || 0;
                    const totalQuantity = sale.sale_items?.reduce((sum, item) => sum + item.cantidad, 0) || 0;

                    return (
                      <>
                        <TableRow key={sale.id} className="h-16 hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleExpanded(sale.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-base font-medium">
                            {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell className="text-base">
                            {sale.personal?.nombre} {sale.personal?.apellido}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-md bg-primary/10 text-primary font-bold text-base border-2 border-primary/20">
                              {itemCount} items ({totalQuantity} unid.)
                            </span>
                          </TableCell>
                          <TableCell className="text-base">{getMetodoPagoLabel(sale.metodo_pago)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
                              {sale.moneda}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-bold text-xl text-[#00ff41]">
                              {formatCurrency(sale.total, sale.moneda)}
                            </span>
                          </TableCell>
                          {user?.personal?.rol === 'Admin' && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                                  onClick={() => handleEditSale(sale)}
                                  title="Editar venta"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteSale(sale.id)}
                                  title="Eliminar venta"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                        {isExpanded && sale.sale_items && sale.sale_items.length > 0 && (
                          <TableRow key={`${sale.id}-details`}>
                            <TableCell colSpan={user?.personal?.rol === 'Admin' ? 8 : 7} className="bg-muted/30 p-0">
                              <div className="p-4">
                                <h4 className="font-semibold text-sm mb-3 text-muted-foreground">
                                  Detalles de la venta:
                                </h4>
                                <div className="space-y-2">
                                  {sale.sale_items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-3 bg-background rounded-md border"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="font-bold text-primary text-lg min-w-[3rem] text-center">
                                          {item.cantidad}x
                                        </span>
                                        <div>
                                          <p className="font-semibold text-base">
                                            {item.productos?.nombre || 'N/A'}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            {item.productos?.categoria && (
                                              <span className={getCategoryBadgeClass(item.productos.categoria)}>
                                                {item.productos.categoria}
                                              </span>
                                            )}
                                            {item.item_type === 'promotion' && (
                                              <Badge variant="destructive" className="text-xs">
                                                Promoción
                                              </Badge>
                                            )}
                                            {item.item_type === 'combo' && (
                                              <Badge variant="secondary" className="text-xs">
                                                Combo
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm text-muted-foreground">
                                          {formatCurrency(item.precio_unitario, sale.moneda)} c/u
                                        </p>
                                        <p className="font-bold text-lg">
                                          {formatCurrency(item.total, sale.moneda)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {sale.descuento > 0 && (
                                  <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                                    <span className="text-muted-foreground">Descuento total:</span>
                                    <span className="font-semibold text-green-600">
                                      -{formatCurrency(sale.descuento, sale.moneda)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* New Sale Dialog */}
        <NewSaleDialog
          open={showNewSaleDialog}
          onOpenChange={handleDialogClose}
          productos={productos}
          promociones={promociones}
          combos={combos}
          empleados={empleados}
          onSaleCreated={handleSaleCreated}
          editingSale={editingSale}
          onDeleteSale={deleteSale}
        />
      </div>
    </AdminLayout>
  );
}

// Export as default for backward compatibility
export default VentasPage;
