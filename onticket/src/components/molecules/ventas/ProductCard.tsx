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
      <CardContent className="p-0">
        {/* Product Name Header - Above Image */}
        <div className="bg-black p-2 border-b border-white/10">
          <h3
            className="font-black text-lg line-clamp-1 leading-tight text-center"
            style={{
              color: '#ffffff',
              textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.4)'
            }}
          >
            {nombre}
          </h3>
        </div>

        {/* Image Section */}
        <div className="relative aspect-[4/3]">
          {/* Background Image */}
          {imagen_url ? (
            <img
              src={imagen_url}
              alt={nombre}
              className="w-full h-full object-cover absolute inset-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted absolute inset-0">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {/* Gradient overlay for category */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />

          {/* Category - Overlaid on image */}
          <div className="absolute top-0 left-0 right-0 p-2">
            <p
              className="text-sm font-bold truncate text-white/90"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              {categoria}
            </p>
          </div>

          {/* Badges */}
          {/* Type Badge */}
          {isPromotion && (
            <Badge className="absolute top-2 right-2 bg-red-500 h-6 text-xs px-2 py-0.5 shadow-lg z-10">
              <Tag className="h-3 w-3 mr-1" />
              Promo
            </Badge>
          )}
          {type === 'combo' && (
            <Badge className="absolute top-2 right-2 bg-purple-500 h-6 text-xs px-2 py-0.5 shadow-lg z-10">
              <TrendingUp className="h-3 w-3 mr-1" />
              Combo
            </Badge>
          )}

          {/* Stock Badge */}
          {showStock && isOutOfStock && (
            <Badge variant="destructive" className="absolute top-2 left-2 h-6 text-xs px-2 py-0.5 shadow-lg z-10">
              Sin Stock
            </Badge>
          )}
          {showStock && isLowStock && (
            <Badge variant="secondary" className="absolute top-2 left-2 h-6 text-xs px-2 py-0.5 shadow-lg z-10">
              Bajo
            </Badge>
          )}

          {/* Promotion Limits Badge */}
          {isPromotion && cantidadMinima && cantidadMinima > 1 && (
            <Badge variant="default" className="absolute top-10 left-2 bg-blue-600 h-6 text-xs px-2 py-0.5 backdrop-blur-sm font-semibold shadow-lg z-10">
              Mín: {cantidadMinima}
            </Badge>
          )}
          {isPromotion && cantidadMaxima && (
            <Badge variant="outline" className="absolute top-10 right-2 bg-background/90 h-6 text-xs px-2 py-0.5 backdrop-blur-sm shadow-lg z-10">
              Máx: {cantidadMaxima}
            </Badge>
          )}
          {isPromotion && limiteUsosPorVenta && limiteUsosPorVenta < 999 && !cantidadMaxima && (
            <Badge variant="outline" className="absolute top-10 right-2 bg-background/90 h-6 text-xs px-2 py-0.5 backdrop-blur-sm shadow-lg z-10">
              Límite: {limiteUsosPorVenta}
            </Badge>
          )}
        </div>

        {/* Price and Stock Info - Below Image */}
        <div className="bg-black p-2 border-t border-white/10 space-y-0.5">
          {/* Prices */}
          <div className="space-y-0.5">
            {/* Discount Percentage - Only for promotions */}
            {isPromotion && precioAnterior && precioAnterior > precio && (
              <p
                className="text-lg font-black text-center text-green-400"
                style={{ textShadow: '0 0 12px rgba(34,197,94,0.8), 0 0 24px rgba(34,197,94,0.6)' }}
              >
                {Math.round(((precioAnterior - precio) / precioAnterior) * 100)}% OFF
              </p>
            )}
            {isPromotion && precioAnterior && (
              <p className="text-xs text-white/80 line-through text-center font-semibold">
                {formatCurrency(precioAnterior, moneda)}
              </p>
            )}
            <p
              className={cn('font-black text-2xl text-center leading-tight', isPromotion ? 'text-red-400' : 'text-[#00ff41]')}
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)' }}
            >
              {formatCurrency(precio, moneda)}
            </p>
            {precioCompra !== undefined && (
              <p className="text-xs text-white/80 truncate text-center font-semibold">
                C: {formatCurrency(precioCompra, moneda)}
              </p>
            )}
          </div>

          {/* Stock */}
          {showStock && (
            <p className="text-sm text-white/90 truncate text-center font-bold">
              Stock: {stock}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
