/**
 * Bartender Ventas Page
 * Sales management for bartenders with automatic employee selection
 */

import { useState, useEffect, useCallback, Fragment } from 'react';
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
import { Plus, ChevronDown, ChevronRight, LogOut, Package } from 'lucide-react';
import { SalesFilters } from '@/components/molecules/ventas/SalesFilters';
import { NewSaleDialog } from '@/components/organisms/ventas/NewSaleDialog';
import { useSales } from '@/hooks/useSales';
import { formatCurrency } from '@/lib/currency-utils';
import { getCategoryBadgeClass } from '@/lib/category-colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Producto, Promocion, ComboWithProducts, Personal, SaleFilters } from '@/types/database';

export function VentasPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showNewSaleDialog, setShowNewSaleDialog] = useState(false);

  // Initialize filters with today's date range (UTC-based)
  const [filters, setFilters] = useState<SaleFilters>(() => {
    const today = new Date();
    // Use UTC dates to match Supabase's NOW() function
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59));

    console.log('📅 [FILTERS] Initializing date filters (UTC):', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    return {
      fecha_desde: startOfDay.toISOString(),
      fecha_hasta: endOfDay.toISOString(),
      personal_id: user?.personal?.id, // Filter by current bartender
    };
  });

  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());

  // Data for new sale dialog
  const [productos, setProductos] = useState<Producto[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [combos, setCombos] = useState<ComboWithProducts[]>([]);
  const [empleados, setEmpleados] = useState<Personal[]>([]);

  // Sales data with realtime
  const { sales, loading, error, fetchSales } = useSales({
    enableRealtime: true,
    filters,
  });

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

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

      // Set current bartender as the only employee option
      setEmpleados(user.personal ? [user.personal] : []);

      setProductos(productosData || []);
      setPromociones(promocionesData || []);
      setCombos(combosData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [user?.club?.id, user?.personal]);

  /**
   * Fetch initial data for sales
   */
  useEffect(() => {
    fetchDialogData();
  }, [fetchDialogData]);

  /**
   * Handle sale created - refresh both sales and product data
   * For bartender: automatically reopen the modal for quick consecutive sales
   */
  const handleSaleCreated = async () => {
    // Close modal first
    setShowNewSaleDialog(false);

    // Wait for both fetches to complete to get updated stock
    await Promise.all([
      fetchSales(), // Refresh sales list
      fetchDialogData() // Refresh products, promotions, combos (to get updated stock)
    ]);

    // Small delay to ensure state is fully updated before reopening
    setTimeout(() => {
      setShowNewSaleDialog(true);
    }, 100);
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
      mixto: '🔀 Mixto',
    };
    return labels[metodo] || metodo;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Welcome Message */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                ¡Hola, {user.personal.nombre}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                {user.club.nombre} • {user.personal.rol}
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Page Title and New Sale Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Ventas</h2>
              <p className="text-muted-foreground">
                Gestión de ventas con actualización en tiempo real
              </p>
            </div>
            <Button onClick={() => setShowNewSaleDialog(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </div>

          {/* Filters */}
          <SalesFilters
            onFiltersChange={setFilters}
            empleados={empleados}
            productos={productos}
            initialFilters={filters}
            hideEmployeeFilter={true} // Hide employee filter for bartenders
          />

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
                      <TableHead className="h-14 text-base font-bold">Items</TableHead>
                      <TableHead className="h-14 text-base font-bold">Método de Pago</TableHead>
                      <TableHead className="h-14 text-base font-bold">Moneda</TableHead>
                      <TableHead className="h-14 text-base font-bold text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => {
                      const isExpanded = expandedSales.has(sale.id);
                      const itemCount = sale.sale_items?.length || 0;
                      const totalQuantity = sale.sale_items?.reduce((sum, item) => sum + item.cantidad, 0) || 0;

                      return (
                        <Fragment key={sale.id}>
                          <TableRow className="h-16 hover:bg-muted/50 transition-colors">
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
                          </TableRow>
                          {isExpanded && sale.sale_items && sale.sale_items.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-muted/30 p-0">
                                <div className="p-4">
                                  <h4 className="font-semibold text-sm mb-3 text-muted-foreground">
                                    Detalles de la venta:
                                  </h4>
                                  <div className="space-y-2">
                                    {sale.sale_items.map((item) => (
                                      <div
                                        key={item.id}
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
                        </Fragment>
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
            onOpenChange={setShowNewSaleDialog}
            productos={productos}
            promociones={promociones}
            combos={combos}
            empleados={empleados}
            onSaleCreated={handleSaleCreated}
            defaultEmpleadoId={user.personal.id} // Pre-select current bartender
            isBartender={true} // Flag to hide employee selector in dialog
            onRefreshData={fetchDialogData}
          />
        </div>
      </main>
    </div>
  );
}

// Export as default for routing
export default VentasPage;
