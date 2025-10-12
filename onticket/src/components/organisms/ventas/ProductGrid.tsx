/**
 * ProductGrid Component
 * Grid display of products with category filter and view toggle (products/promos/combos)
 */

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/molecules/ventas/ProductCard';
import { ComboCard } from '@/components/molecules/ventas/ComboCard';
import { Package, Tag, TrendingUp, Search } from 'lucide-react';
import type { Producto, Promocion, Combo, CategoriaProducto } from '@/types/database';
import type { CurrencyCode } from '@/types/currency';

type ViewMode = 'products' | 'promotions' | 'combos';

interface ProductGridProps {
  productos: Producto[];
  promociones: Promocion[];
  combos: Combo[];
  moneda: CurrencyCode;
  isAdmin: boolean;
  onProductClick: (producto: Producto, promocion?: Promocion) => void;
  onComboClick: (combo: Combo) => void;
}

const CATEGORIES: CategoriaProducto[] = [
  'Vodka',
  'Vino',
  'Champan',
  'Tequila',
  'Sin Alcohol',
  'Cerveza',
  'Cocteles',
  'Whisky',
  'Otros',
];

export function ProductGrid({
  productos,
  promociones,
  combos,
  moneda,
  isAdmin,
  onProductClick,
  onComboClick,
}: ProductGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('products');
  const [selectedCategory, setSelectedCategory] = useState<CategoriaProducto | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products by category and search
  const filteredProductos = useMemo(() => {
    let filtered = productos;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.categoria === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [productos, selectedCategory, searchQuery]);

  // Filter promotions by category and search
  const filteredPromociones = useMemo(() => {
    let filtered = promociones.filter((promo) => promo.activo);

    if (selectedCategory !== 'all') {
      const productosInCategory = productos.filter((p) => p.categoria === selectedCategory);
      const productIds = new Set(productosInCategory.map((p) => p.id));
      filtered = filtered.filter((promo) => productIds.has(promo.producto_id));
    }

    if (searchQuery) {
      const matchingProductos = productos.filter((p) =>
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const productIds = new Set(matchingProductos.map((p) => p.id));
      filtered = filtered.filter((promo) => productIds.has(promo.producto_id));
    }

    return filtered;
  }, [promociones, productos, selectedCategory, searchQuery]);

  // Filter combos by search
  const filteredCombos = useMemo(() => {
    let filtered = combos.filter((combo) => combo.activo);

    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [combos, searchQuery]);

  const getProductPrice = (producto: Producto): number => {
    const field = isAdmin ? 'precio_compra' : 'precio_venta';
    switch (moneda) {
      case 'ARS':
        return producto[`${field}_ars`];
      case 'USD':
        return producto[`${field}_usd`];
      case 'BRL':
        return producto[`${field}_brl`];
      default:
        return producto[`${field}_ars`];
    }
  };

  const getPromotionPrice = (promocion: Promocion): { real: number; promo: number } => {
    switch (moneda) {
      case 'ARS':
        return { real: promocion.precio_real_ars, promo: promocion.precio_promocion_ars };
      case 'USD':
        return { real: promocion.precio_real_usd, promo: promocion.precio_promocion_usd };
      case 'BRL':
        return { real: promocion.precio_real_brl, promo: promocion.precio_promocion_brl };
      default:
        return { real: promocion.precio_real_ars, promo: promocion.precio_promocion_ars };
    }
  };

  const getComboPrice = (combo: Combo): number => {
    switch (moneda) {
      case 'ARS':
        return combo.precio_combo_ars;
      case 'USD':
        return combo.precio_combo_usd;
      case 'BRL':
        return combo.precio_combo_brl;
      default:
        return combo.precio_combo_ars;
    }
  };

  return (
    <div className="space-y-4">
      {/* View Mode Selector */}
      <div className="flex items-center gap-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="products">
              <Package className="h-4 w-4 mr-2" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="promotions">
              <Tag className="h-4 w-4 mr-2" />
              Promociones
            </TabsTrigger>
            <TabsTrigger value="combos">
              <TrendingUp className="h-4 w-4 mr-2" />
              Combos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter (only for products and promotions) */}
      {(viewMode === 'products' || viewMode === 'promotions') && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            Todas
          </Button>
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {viewMode === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProductos.map((producto) => {
            const precio = getProductPrice(producto);
            const precioCompra = isAdmin
              ? moneda === 'ARS'
                ? producto.precio_compra_ars
                : moneda === 'USD'
                ? producto.precio_compra_usd
                : producto.precio_compra_brl
              : undefined;

            return (
              <ProductCard
                key={producto.id}
                nombre={producto.nombre}
                categoria={producto.categoria}
                precio={precio}
                precioCompra={precioCompra}
                stock={producto.stock}
                imagen_url={producto.imagen_url}
                moneda={moneda}
                onClick={() => onProductClick(producto)}
              />
            );
          })}
        </div>
      )}

      {/* Promotions Grid */}
      {viewMode === 'promotions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPromociones.map((promocion) => {
            const producto = productos.find((p) => p.id === promocion.producto_id);
            if (!producto) return null;

            const prices = getPromotionPrice(promocion);

            return (
              <ProductCard
                key={promocion.id}
                nombre={producto.nombre}
                categoria={producto.categoria}
                precio={prices.promo}
                precioAnterior={prices.real}
                stock={producto.stock}
                imagen_url={promocion.imagen_url || producto.imagen_url}
                moneda={moneda}
                type="promotion"
                isPromotion
                limiteUsosPorVenta={promocion.limite_usos_por_venta}
                cantidadMinima={promocion.cantidad_minima}
                cantidadMaxima={promocion.cantidad_maxima}
                onClick={() => onProductClick(producto, promocion)}
              />
            );
          })}
        </div>
      )}

      {/* Combos Grid */}
      {viewMode === 'combos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCombos.map((combo) => {
            const precio = getComboPrice(combo);

            return (
              <ComboCard
                key={combo.id}
                nombre={combo.nombre}
                precio={precio}
                precioARS={combo.precio_combo_ars}
                imagen_url={combo.imagen_url}
                moneda={moneda}
                productos={combo.combo_productos as any}
                limiteUsosPorVenta={combo.limite_usos_por_venta}
                onClick={() => onComboClick(combo)}
              />
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {viewMode === 'products' && filteredProductos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No se encontraron productos</p>
          </CardContent>
        </Card>
      )}
      {viewMode === 'promotions' && filteredPromociones.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay promociones activas</p>
          </CardContent>
        </Card>
      )}
      {viewMode === 'combos' && filteredCombos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay combos activos</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
