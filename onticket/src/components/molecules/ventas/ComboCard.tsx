/**
 * ComboCard Component
 * Displays a combo card with products list and price-based border colors
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/currency-utils';
import type { CurrencyCode } from '@/types/currency';
import type { ComboProducto } from '@/types/database';

interface ComboCardProps {
  nombre: string;
  precio: number;
  precioReal?: number; // Precio real (sin descuento) para calcular % de ahorro
  precioARS: number; // Precio en ARS para determinar el color del borde
  imagen_url?: string | null;
  moneda: CurrencyCode;
  productos?: ComboProducto[];
  limiteUsosPorVenta?: number;
  onClick?: () => void;
  className?: string;
}

export function ComboCard({
  nombre,
  precio,
  precioReal,
  precioARS,
  imagen_url,
  moneda,
  productos = [],
  limiteUsosPorVenta,
  onClick,
  className,
}: ComboCardProps) {
  // Determinar color del borde según precio en ARS
  const getBorderStyle = (priceARS: number): { border: string; shadow: string; glow: string } | null => {
    if (priceARS >= 50000) {
      // Dorado neón para 50k+
      return {
        border: 'border-yellow-400',
        shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.6)]',
        glow: 'hover:shadow-[0_0_25px_rgba(250,204,21,0.8)]',
      };
    } else if (priceARS >= 30000) {
      // Verde para 30k-49k
      return {
        border: 'border-green-500',
        shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]',
        glow: 'hover:shadow-[0_0_25px_rgba(34,197,94,0.7)]',
      };
    }
    return null;
  };

  const borderStyle = getBorderStyle(precioARS);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg overflow-hidden border-2',
        borderStyle ? `${borderStyle.border} ${borderStyle.shadow} ${borderStyle.glow}` : '',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Combo Name Header - Above Image */}
        <div className="bg-black p-2 border-b border-purple-500/30">
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

          {/* Gradient overlay for combo label */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />

          {/* Combo label - Overlaid on image */}
          <div className="absolute top-0 left-0 right-0 p-2">
            <p
              className="text-sm font-bold text-purple-300"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              Combo
            </p>
          </div>

          {/* Badges */}
          {/* Combo Badge */}
          <Badge className="absolute top-2 right-2 bg-purple-500 h-6 text-xs px-2 py-0.5 shadow-lg z-10">
            <TrendingUp className="h-3 w-3 mr-1" />
            Combo
          </Badge>

          {/* Limit Badge */}
          {limiteUsosPorVenta && limiteUsosPorVenta < 999 && (
            <Badge variant="outline" className="absolute top-10 right-2 bg-background/90 h-6 text-xs px-2 py-0.5 backdrop-blur-sm shadow-lg z-10">
              Máx: {limiteUsosPorVenta}
            </Badge>
          )}
        </div>

        {/* Products and Price Info - Below Image */}
        <div className="bg-black p-2 border-t border-purple-500/30 space-y-0.5">
          {/* Products List */}
          {productos && productos.length > 0 && (
            <div className="space-y-0.5">
              {productos.slice(0, 2).map((item, index) => (
                item.productos && (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 text-xs text-white"
                  >
                    <span className="font-bold text-purple-300 text-sm">{item.cantidad}x</span>
                    <span className="truncate font-semibold">{item.productos.nombre}</span>
                  </div>
                )
              ))}
              {productos.length > 2 && (
                <p className="text-xs text-white/80 italic font-semibold">
                  +{productos.length - 2} más...
                </p>
              )}
            </div>
          )}

          {/* Discount Percentage - Show if precioReal is provided */}
          {precioReal && precioReal > precio && (
            <p
              className="text-lg font-black text-center text-green-400"
              style={{ textShadow: '0 0 12px rgba(34,197,94,0.8), 0 0 24px rgba(34,197,94,0.6)' }}
            >
              {Math.round(((precioReal - precio) / precioReal) * 100)}% OFF
            </p>
          )}

          {/* Price */}
          <p
            className="font-black text-2xl text-center leading-tight text-purple-400"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)' }}
          >
            {formatCurrency(precio, moneda)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

