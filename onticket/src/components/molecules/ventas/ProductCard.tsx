/**
 * ProductCard Component
 * Displays a product card with image, name, price, and stock
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Package, Tag, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/currency-utils';
import type { CurrencyCode } from '@/types/currency';

interface ProductCardProps {
  nombre: string;
  categoria: string;
  precio: number;
  precioCompra?: number;
  stock: number;
  imagen_url?: string | null;
  moneda: CurrencyCode;
  type?: 'product' | 'promotion' | 'combo';
  onClick?: () => void;
  className?: string;
  showStock?: boolean;
  isPromotion?: boolean;
  precioAnterior?: number;
  limiteUsosPorVenta?: number;
  cantidadMinima?: number;
  cantidadMaxima?: number | null;
}

export function ProductCard({
  nombre,
  categoria,
  precio,
  precioCompra,
  stock,
  imagen_url,
  moneda,
  type = 'product',
  onClick,
  className,
  showStock = true,
  isPromotion = false,
  precioAnterior,
  limiteUsosPorVenta,
  cantidadMinima,
  cantidadMaxima,
}: ProductCardProps) {
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isOutOfStock && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={!isOutOfStock ? onClick : undefined}
    >
      <CardContent className="p-2">
        {/* Image */}
        <div className="relative aspect-square mb-1.5 rounded-md overflow-hidden bg-muted">
          {imagen_url ? (
            <img
              src={imagen_url}
              alt={nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          {/* Type Badge */}
          {isPromotion && (
            <Badge className="absolute top-0.5 right-0.5 bg-red-500 h-4 text-[9px] px-1 py-0">
              <Tag className="h-2 w-2 mr-0.5" />
              Promo
            </Badge>
          )}
          {type === 'combo' && (
            <Badge className="absolute top-0.5 right-0.5 bg-purple-500 h-4 text-[9px] px-1 py-0">
              <TrendingUp className="h-2 w-2 mr-0.5" />
              Combo
            </Badge>
          )}

          {/* Stock Badge */}
          {showStock && isOutOfStock && (
            <Badge variant="destructive" className="absolute top-0.5 left-0.5 h-4 text-[9px] px-1 py-0">
              Sin Stock
            </Badge>
          )}
          {showStock && isLowStock && (
            <Badge variant="secondary" className="absolute top-0.5 left-0.5 h-4 text-[9px] px-1 py-0">
              Bajo
            </Badge>
          )}

          {/* Promotion Limits Badge */}
          {isPromotion && cantidadMinima && cantidadMinima > 1 && (
            <Badge variant="default" className="absolute bottom-0.5 left-0.5 bg-blue-600 h-5 text-[9px] px-1.5 py-0 backdrop-blur-sm font-semibold">
              Mín: {cantidadMinima}
            </Badge>
          )}
          {isPromotion && cantidadMaxima && (
            <Badge variant="outline" className="absolute bottom-0.5 right-0.5 bg-background/90 h-4 text-[8px] px-1 py-0 backdrop-blur-sm">
              Máx: {cantidadMaxima}
            </Badge>
          )}
          {isPromotion && limiteUsosPorVenta && limiteUsosPorVenta < 999 && !cantidadMaxima && (
            <Badge variant="outline" className="absolute bottom-0.5 right-0.5 bg-background/90 h-4 text-[8px] px-1 py-0 backdrop-blur-sm">
              Límite: {limiteUsosPorVenta}
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-0.5">
          <div>
            <h3 className="font-semibold text-[11px] line-clamp-1 leading-tight">{nombre}</h3>
            <p className="text-sm font-medium text-muted-foreground truncate">{categoria}</p>
          </div>

          {/* Prices */}
          <div className="space-y-0">
            {isPromotion && precioAnterior && (
              <p className="text-[9px] text-muted-foreground line-through text-center">
                {formatCurrency(precioAnterior, moneda)}
              </p>
            )}
            <p className={cn('font-bold text-xl text-center leading-tight', isPromotion ? 'text-red-600' : 'text-[#00ff41]')}>
              {formatCurrency(precio, moneda)}
            </p>
            {precioCompra !== undefined && (
              <p className="text-[9px] text-muted-foreground truncate text-center">
                C: {formatCurrency(precioCompra, moneda)}
              </p>
            )}
          </div>

          {/* Stock */}
          {showStock && (
            <p className="text-[9px] text-muted-foreground truncate text-center">Stock: {stock}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
