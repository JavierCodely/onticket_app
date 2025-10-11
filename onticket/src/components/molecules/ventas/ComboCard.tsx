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

interface ComboProduct {
  cantidad: number;
  productos: {
    id: string;
    nombre: string;
    categoria: string;
  } | null;
}

interface ComboCardProps {
  nombre: string;
  precio: number;
  precioARS: number; // Precio en ARS para determinar el color del borde
  imagen_url?: string | null;
  moneda: CurrencyCode;
  productos?: ComboProduct[];
  limiteUsosPorVenta?: number;
  onClick?: () => void;
  className?: string;
}

export function ComboCard({
  nombre,
  precio,
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

        {/* Combo Info - Overlaid on image */}
        <div className="absolute inset-0 p-2 flex flex-col justify-between">
          {/* Top section - Name */}
          <div className="space-y-0.5">
            <h3
              className="font-bold text-sm line-clamp-2 leading-tight text-white"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)' }}
            >
              {nombre}
            </h3>
            <p
              className="text-[10px] font-semibold text-purple-300"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              Combo
            </p>
          </div>

          {/* Bottom section - Products and Price */}
          <div className="space-y-1">
            {/* Products List */}
            {productos && productos.length > 0 && (
              <div className="space-y-0.5 p-1.5 bg-black/40 backdrop-blur-sm rounded-md">
                {productos.slice(0, 3).map((item, index) => (
                  item.productos && (
                    <div
                      key={index}
                      className="flex items-center gap-1 text-[9px] text-white"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                    >
                      <span className="font-bold text-purple-300">{item.cantidad}x</span>
                      <span className="truncate font-semibold">{item.productos.nombre}</span>
                    </div>
                  )
                ))}
                {productos.length > 3 && (
                  <p
                    className="text-[9px] text-white/80 italic font-semibold"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    +{productos.length - 3} más...
                  </p>
                )}
              </div>
            )}

            {/* Price */}
            <p
              className="font-black text-2xl text-center leading-tight text-purple-400"
              style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}
            >
              {formatCurrency(precio, moneda)}
            </p>
          </div>
        </div>

        {/* Badges - keep them on top */}
        {/* Combo Badge */}
        <Badge className="absolute top-1 right-1 bg-purple-500 h-5 text-[10px] px-1.5 py-0 shadow-lg z-10">
          <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
          Combo
        </Badge>

        {/* Limit Badge */}
        {limiteUsosPorVenta && limiteUsosPorVenta < 999 && (
          <Badge variant="outline" className="absolute bottom-1 right-1 bg-background/90 h-5 text-[9px] px-1.5 py-0 backdrop-blur-sm shadow-lg z-10">
            Máx: {limiteUsosPorVenta}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

