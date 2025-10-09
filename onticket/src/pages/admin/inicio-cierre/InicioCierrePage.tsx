/**
 * InicioCierrePage
 * Inventory opening/closing management page
 * Features: Opening stock snapshot, Closing stock, CSV export, Date & Category filters
 */

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Download, RefreshCw, CheckCheck } from 'lucide-react';
import { exportInicioCierreToCSV } from '@/lib/export';
import { InicioCierreFilters, SalesStatsCards } from '@/components/molecules/InicioCierre';
import { InicioCierreTable } from '@/components/organisms/InicioCierre';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { InicioCierre } from '@/types/database/InicioCierre';
import type { Producto } from '@/types/database/Productos';

interface ProductStat {
  nombre_producto: string;
  categoria: string;
  cantidad_vendida: number;
  stock_inicio: number;
  stock_actual: number;
}

export const InicioCierrePage: React.FC = () => {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<InicioCierre[]>([]);
  const [filteredRegistros, setFilteredRegistros] = useState<InicioCierre[]>([]);
  const [loading, setLoading] = useState(true);
  const [productosActuales, setProductosActuales] = useState<Producto[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filters - Initialize with today's date
  const today = new Date().toISOString().split('T')[0];
  const [fechaDesde, setFechaDesde] = useState(today);
  const [fechaHasta, setFechaHasta] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Dialogs
  const [inicioDialogOpen, setInicioDialogOpen] = useState(false);
  const [cierreDialogOpen, setCierreDialogOpen] = useState(false);
  const [cerrarTodosDialogOpen, setCerrarTodosDialogOpen] = useState(false);
  const [registroToCerrar, setRegistroToCerrar] = useState<InicioCierre | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch registros
  const fetchRegistros = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inicioycierre')
        .select('*')
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;

      setRegistros(data || []);
    } catch (error) {
      console.error('Error fetching registros:', error);
      toast.error('Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  // Fetch productos actuales when there are open registros
  const fetchProductosActuales = async () => {
    try {
      setStatsLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*');

      if (error) throw error;

      setProductosActuales(data || []);
    } catch (error) {
      console.error('Error fetching productos:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch productos when there are open records
  useEffect(() => {
    const registrosAbiertosCount = registros.filter((r) => !r.fecha_cierre).length;
    if (registrosAbiertosCount > 0) {
      fetchProductosActuales();
    }
  }, [registros]);

  // Calculate sales statistics based on FILTERED registros
  const calculateSalesStats = (): { topSelling: ProductStat[]; leastSelling: ProductStat[] } => {
    if (filteredRegistros.length === 0) {
      return { topSelling: [], leastSelling: [] };
    }

    // Create a map of current stock for open records
    const stockMap = new Map(productosActuales.map((p) => [p.id, p.stock]));

    // Calculate sales for each product
    const salesData: ProductStat[] = filteredRegistros
      .map((registro) => {
        let stockFinal: number;

        // Use stock_cierre if the record is closed, otherwise use current stock
        if (registro.fecha_cierre && registro.stock_cierre !== null) {
          stockFinal = registro.stock_cierre;
        } else {
          // For open records, use current stock from productosActuales
          stockFinal = stockMap.get(registro.producto_id) || registro.stock_inicio;
        }

        const cantidadVendida = Math.max(registro.stock_inicio - stockFinal, 0);

        return {
          nombre_producto: registro.nombre_producto,
          categoria: registro.categoria,
          cantidad_vendida: cantidadVendida,
          stock_inicio: registro.stock_inicio,
          stock_actual: stockFinal,
        };
      })
      .filter((stat) => stat.cantidad_vendida > 0); // Only include products with sales

    // Sort by cantidad_vendida
    const sortedByMost = [...salesData].sort((a, b) => b.cantidad_vendida - a.cantidad_vendida);
    const sortedByLeast = [...salesData].sort((a, b) => a.cantidad_vendida - b.cantidad_vendida);

    return {
      topSelling: sortedByMost.slice(0, 5), // Top 5 most sold
      leastSelling: sortedByLeast.slice(0, 5), // Top 5 least sold (but still sold)
    };
  };

  const { topSelling, leastSelling } = calculateSalesStats();

  // Filter registros
  useEffect(() => {
    let filtered = registros;

    // Filter by fecha desde
    if (fechaDesde) {
      filtered = filtered.filter((r) => {
        const fecha = new Date(r.fecha_inicio);
        return fecha >= new Date(fechaDesde);
      });
    }

    // Filter by fecha hasta
    if (fechaHasta) {
      filtered = filtered.filter((r) => {
        const fecha = new Date(r.fecha_inicio);
        return fecha <= new Date(fechaHasta + 'T23:59:59');
      });
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((r) => r.categoria === selectedCategory);
    }

    setFilteredRegistros(filtered);
  }, [registros, fechaDesde, fechaHasta, selectedCategory]);

  // Handle inicio - create opening records for all products
  const handleInicio = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Fetch all products with current stock
      const { data: productos, error: fetchError } = await supabase
        .from('productos')
        .select('*');

      if (fetchError) throw fetchError;

      if (!productos || productos.length === 0) {
        toast.error('No hay productos para iniciar');
        return;
      }

      // Create opening records for all products
      const registrosInicio = productos.map((producto: Producto) => ({
        club_id: user.club.id,
        producto_id: producto.id,
        nombre_producto: producto.nombre,
        categoria: producto.categoria,
        stock_inicio: producto.stock,
        fecha_inicio: new Date().toISOString(),
      }));

      const { error: insertError } = await (supabase
        .from('inicioycierre') as any)
        .insert(registrosInicio);

      if (insertError) throw insertError;

      toast.success(`Inicio registrado para ${productos.length} productos`);
      setInicioDialogOpen(false);
      fetchRegistros();
    } catch (error) {
      console.error('Error creating opening records:', error);
      toast.error('Error al registrar el inicio');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cierre - update closing stock for a record
  const handleCerrar = async (registro: InicioCierre) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Fetch current stock for this product
      const { data: producto, error: fetchError } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', registro.producto_id)
        .single() as any;

      if (fetchError) throw fetchError;

      if (!producto) {
        toast.error('Producto no encontrado');
        return;
      }

      // Update closing record
      const updateData = {
        stock_cierre: producto.stock,
        fecha_cierre: new Date().toISOString(),
      };

      const { error: updateError } = await (supabase
        .from('inicioycierre') as any)
        .update(updateData)
        .eq('id', registro.id);

      if (updateError) throw updateError;

      const totalVendido = Math.max(registro.stock_inicio - producto.stock, 0);
      toast.success(
        totalVendido > 0
          ? `Cierre registrado. Se vendieron ${totalVendido} unidades`
          : 'Cierre registrado. No se vendió ninguna unidad'
      );
      setCierreDialogOpen(false);
      setRegistroToCerrar(null);
      fetchRegistros();
    } catch (error) {
      console.error('Error closing record:', error);
      toast.error('Error al registrar el cierre');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open cerrar dialog
  const openCerrarDialog = (registro: InicioCierre) => {
    setRegistroToCerrar(registro);
    setCierreDialogOpen(true);
  };

  // Handle cerrar todos - close all open records
  const handleCerrarTodos = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Get all open records
      const registrosAbiertos = registros.filter((r) => !r.fecha_cierre);

      if (registrosAbiertos.length === 0) {
        toast.error('No hay registros abiertos para cerrar');
        setCerrarTodosDialogOpen(false);
        return;
      }

      // Fetch current stock for all products
      const productIds = registrosAbiertos.map((r) => r.producto_id);
      const { data: productos, error: fetchError } = await supabase
        .from('productos')
        .select('id, stock')
        .in('id', productIds) as any;

      if (fetchError) throw fetchError;

      if (!productos) {
        toast.error('Error al obtener productos');
        setCerrarTodosDialogOpen(false);
        return;
      }

      // Create a map of product stock
      const stockMap = new Map(productos.map((p: any) => [p.id, p.stock]));

      // Get all registro IDs to update
      const registroIds = registrosAbiertos.map((r) => r.id);
      const fechaCierre = new Date().toISOString();

      // Update all records at once using PostgreSQL IN clause
      const updateFechaCierre = {
        fecha_cierre: fechaCierre,
      };

      const { error: updateError } = await (supabase
        .from('inicioycierre') as any)
        .update(updateFechaCierre)
        .in('id', registroIds)
        .is('fecha_cierre', null);

      if (updateError) {
        console.error('Update error details:', updateError);
        throw updateError;
      }

      // Now update stock_cierre individually (since each has different value)
      const updatePromises = registrosAbiertos.map((registro) => {
        const updateStockCierre = {
          stock_cierre: stockMap.get(registro.producto_id) || 0,
        };
        return (supabase
          .from('inicioycierre') as any)
          .update(updateStockCierre)
          .eq('id', registro.id);
      });

      const results = await Promise.all(updatePromises);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        console.error('Some updates failed:', errors);
        throw new Error('Algunos registros no se pudieron actualizar');
      }

      // Calculate total sold
      const totalVendido = registrosAbiertos.reduce((sum, registro) => {
        const stockCierre = Number(stockMap.get(registro.producto_id) || 0);
        return sum + Math.max(registro.stock_inicio - stockCierre, 0);
      }, 0);

      toast.success(
        `${registrosAbiertos.length} registros cerrados. Total vendido: ${totalVendido} unidades`
      );
      setCerrarTodosDialogOpen(false);
      fetchRegistros();
    } catch (error) {
      console.error('Error closing all records:', error);
      toast.error('Error al cerrar los registros');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setFechaDesde('');
    setFechaHasta('');
    setSelectedCategory('all');
  };

  // Export to CSV
  const handleExport = () => {
    if (filteredRegistros.length === 0) {
      toast.error('No hay registros para exportar');
      return;
    }

    const filename = `inicioycierre_${new Date().toISOString().split('T')[0]}.csv`;
    exportInicioCierreToCSV(filteredRegistros, filename);
    toast.success('Registros exportados exitosamente');
  };

  // Count registros abiertos
  const registrosAbiertos = registros.filter((r) => !r.fecha_cierre).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inicio/Cierre de Inventario</h1>
            <p className="text-muted-foreground">
              Registra el stock inicial y final de tus productos
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchRegistros}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={filteredRegistros.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button
              onClick={() => setInicioDialogOpen(true)}
              disabled={registrosAbiertos > 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Registrar Inicio
            </Button>
          </div>
        </div>

        {/* Active Records Alert */}
        {registrosAbiertos > 0 && (
          <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-700 dark:text-blue-400">
                Registros Abiertos
              </CardTitle>
              <CardDescription>
                Tienes {registrosAbiertos} {registrosAbiertos === 1 ? 'registro abierto' : 'registros abiertos'} pendientes de cierre
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Sales Statistics - Show when there are filtered records */}
        {filteredRegistros.length > 0 && (
          statsLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <SalesStatsCards
              topSelling={topSelling}
              leastSelling={leastSelling}
            />
          )
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <InicioCierreFilters
              fechaDesde={fechaDesde}
              fechaHasta={fechaHasta}
              onFechaDesdeChange={setFechaDesde}
              onFechaHastaChange={setFechaHasta}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onClearFilters={handleClearFilters}
            />
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Registros</CardTitle>
                <CardDescription>
                  {filteredRegistros.length} {filteredRegistros.length === 1 ? 'registro encontrado' : 'registros encontrados'}
                </CardDescription>
              </div>
              {registrosAbiertos > 0 && (
                <Button
                  onClick={() => setCerrarTodosDialogOpen(true)}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Cerrar Todos ({registrosAbiertos})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <InicioCierreTable
                registros={filteredRegistros}
                onCerrar={openCerrarDialog}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inicio Dialog */}
      <AlertDialog open={inicioDialogOpen} onOpenChange={setInicioDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar Inicio de Inventario</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará un registro de inicio para todos los productos con el stock actual.
              ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleInicio} disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar Inicio'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cierre Dialog */}
      <AlertDialog open={cierreDialogOpen} onOpenChange={setCierreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar Cierre</AlertDialogTitle>
            <AlertDialogDescription>
              Se registrará el stock actual como cierre para{' '}
              <strong>{registroToCerrar?.nombre_producto}</strong>.
              ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => registroToCerrar && handleCerrar(registroToCerrar)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Cierre'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cerrar Todos Dialog */}
      <AlertDialog open={cerrarTodosDialogOpen} onOpenChange={setCerrarTodosDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar Todos los Registros</AlertDialogTitle>
            <AlertDialogDescription>
              Se cerrarán <strong>{registrosAbiertos} registros abiertos</strong> con el stock actual de cada producto.
              Esta acción no se puede deshacer. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCerrarTodos}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Cerrando...' : `Cerrar ${registrosAbiertos} Registros`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};
