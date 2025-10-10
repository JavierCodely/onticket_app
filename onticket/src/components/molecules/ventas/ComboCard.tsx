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
        'cursor-pointer transition-all hover:shadow-lg border-2',
        borderStyle ? `${borderStyle.border} ${borderStyle.shadow} ${borderStyle.glow}` : '',
        className
      )}
      onClick={onClick}
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

          {/* Combo Badge */}
          <Badge className="absolute top-0.5 right-0.5 bg-purple-500 h-4 text-[9px] px-1 py-0">
            <TrendingUp className="h-2 w-2 mr-0.5" />
            Combo
          </Badge>
          
          {/* Limit Badge */}
          {limiteUsosPorVenta && limiteUsosPorVenta < 999 && (
            <Badge variant="outline" className="absolute bottom-0.5 right-0.5 bg-background/90 h-4 text-[8px] px-1 py-0 backdrop-blur-sm">
              Máx: {limiteUsosPorVenta}
            </Badge>
          )}
        </div>

        {/* Combo Info */}
        <div className="space-y-1">
          <div>
            <h3 className="font-semibold text-[11px] line-clamp-1 leading-tight">{nombre}</h3>
            <p className="text-[9px] text-muted-foreground">Combo</p>
          </div>

          {/* Products List */}
          {productos && productos.length > 0 && (
            <div className="space-y-0.5 py-1 border-t border-border/50">
              {productos.slice(0, 3).map((item, index) => (
                item.productos && (
                  <div key={index} className="flex items-center gap-1 text-[8px] text-muted-foreground">
                    <span className="font-medium text-primary">{item.cantidad}x</span>
                    <span className="truncate">{item.productos.nombre}</span>
                  </div>
                )
              ))}
              {productos.length > 3 && (
                <p className="text-[8px] text-muted-foreground italic">
                  +{productos.length - 3} más...
                </p>
              )}
            </div>
          )}

          {/* Price */}
          <div className="pt-1">
            <p className="font-bold text-base text-center leading-tight text-purple-600">
              {formatCurrency(precio, moneda)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

