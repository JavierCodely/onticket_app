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
        'cursor-pointer transition-all hover:shadow-md overflow-hidden',
        isOutOfStock && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={!isOutOfStock ? onClick : undefined}
    >
      <CardContent className="p-0 relative aspect-square">
        {/* Background Image */}
        {imagen_url ? (
          <img
            src={imagen_url}
            alt={nombre}
            className="w-full h-full object-cover absolute inset-0"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted absolute inset-0">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />

        {/* Product Info - Overlaid on image */}
        <div className="absolute inset-0 p-2 flex flex-col justify-between">
          {/* Top section - Name and Category */}
          <div className="space-y-0.5">
            <h3
              className="font-bold text-sm line-clamp-2 leading-tight text-white"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)' }}
            >
              {nombre}
            </h3>
            <p
              className="text-[10px] font-semibold truncate text-white/90"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              {categoria}
            </p>
          </div>

          {/* Bottom section - Prices and Stock */}
          <div className="space-y-0.5">
            {/* Prices */}
            <div className="space-y-0">
              {isPromotion && precioAnterior && (
                <p
                  className="text-[10px] text-white/80 line-through text-center font-semibold"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {formatCurrency(precioAnterior, moneda)}
                </p>
              )}
              <p
                className={cn('font-black text-2xl text-center leading-tight', isPromotion ? 'text-red-400' : 'text-[#00ff41]')}
                style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}
              >
                {formatCurrency(precio, moneda)}
              </p>
              {precioCompra !== undefined && (
                <p
                  className="text-[10px] text-white/80 truncate text-center font-semibold"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  C: {formatCurrency(precioCompra, moneda)}
                </p>
              )}
            </div>

            {/* Stock */}
            {showStock && (
              <p
                className="text-[10px] text-white/90 truncate text-center font-bold"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
              >
                Stock: {stock}
              </p>
            )}
          </div>
        </div>

        {/* Badges - keep them on top */}
        {/* Type Badge */}
        {isPromotion && (
          <Badge className="absolute top-1 right-1 bg-red-500 h-5 text-[10px] px-1.5 py-0 shadow-lg z-10">
            <Tag className="h-2.5 w-2.5 mr-0.5" />
            Promo
          </Badge>
        )}
        {type === 'combo' && (
          <Badge className="absolute top-1 right-1 bg-purple-500 h-5 text-[10px] px-1.5 py-0 shadow-lg z-10">
            <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
            Combo
          </Badge>
        )}

        {/* Stock Badge */}
        {showStock && isOutOfStock && (
          <Badge variant="destructive" className="absolute top-1 left-1 h-5 text-[10px] px-1.5 py-0 shadow-lg z-10">
            Sin Stock
          </Badge>
        )}
        {showStock && isLowStock && (
          <Badge variant="secondary" className="absolute top-1 left-1 h-5 text-[10px] px-1.5 py-0 shadow-lg z-10">
            Bajo
          </Badge>
        )}

        {/* Promotion Limits Badge */}
        {isPromotion && cantidadMinima && cantidadMinima > 1 && (
          <Badge variant="default" className="absolute bottom-1 left-1 bg-blue-600 h-5 text-[10px] px-1.5 py-0 backdrop-blur-sm font-semibold shadow-lg z-10">
            Mín: {cantidadMinima}
          </Badge>
        )}
        {isPromotion && cantidadMaxima && (
          <Badge variant="outline" className="absolute bottom-1 right-1 bg-background/90 h-5 text-[9px] px-1.5 py-0 backdrop-blur-sm shadow-lg z-10">
            Máx: {cantidadMaxima}
          </Badge>
        )}
        {isPromotion && limiteUsosPorVenta && limiteUsosPorVenta < 999 && !cantidadMaxima && (
          <Badge variant="outline" className="absolute bottom-1 right-1 bg-background/90 h-5 text-[9px] px-1.5 py-0 backdrop-blur-sm shadow-lg z-10">
            Límite: {limiteUsosPorVenta}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
