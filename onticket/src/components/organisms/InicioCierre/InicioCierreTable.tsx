/**
 * InicioCierreTable Organism
 * Table layout for displaying inventory opening/closing records
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, Clock } from 'lucide-react';
import { getCategoryBadgeClass } from '@/lib/category-colors';
import type { InicioCierre } from '@/types/database/InicioCierre';

interface InicioCierreTableProps {
  registros: InicioCierre[];
  onCerrar: (registro: InicioCierre) => void;
}

export const InicioCierreTable: React.FC<InicioCierreTableProps> = ({
  registros,
  onCerrar,
}) => {
  if (registros.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/30">
        <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground font-medium">No se encontraron registros</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Intenta ajustar los filtros</p>
      </div>
    );
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 border-b-2">
            <TableHead className="h-14 text-base font-bold">Producto</TableHead>
            <TableHead className="h-14 text-base font-bold">Categoría</TableHead>
            <TableHead className="h-14 text-base font-bold text-center">Fecha Inicio</TableHead>
            <TableHead className="h-14 text-base font-bold text-center">Fecha Cierre</TableHead>
            <TableHead className="h-14 text-base font-bold text-center">Stock Inicio</TableHead>
            <TableHead className="h-14 text-base font-bold text-center">Stock Cierre</TableHead>
            <TableHead className="h-14 text-base font-bold text-center">Total Vendido</TableHead>
            <TableHead className="h-14 text-base font-bold text-center">Estado</TableHead>
            <TableHead className="h-14 text-base font-bold text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((registro) => {
            const estaAbierto = !registro.fecha_cierre;

            return (
              <TableRow
                key={registro.id}
                className={`h-16 hover:bg-muted/30 transition-colors ${
                  estaAbierto ? 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
              >
                <TableCell className="font-bold text-base text-foreground">
                  {registro.nombre_producto}
                </TableCell>
                <TableCell>
                  <span className={getCategoryBadgeClass(registro.categoria) + ' text-sm font-semibold px-3 py-1.5'}>
                    {registro.categoria}
                  </span>
                </TableCell>
                <TableCell className="text-center text-base font-medium">
                  {formatDateTime(registro.fecha_inicio)}
                </TableCell>
                <TableCell className="text-center text-base font-medium">
                  {formatDateTime(registro.fecha_cierre)}
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center px-4 py-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-900 font-bold text-lg text-blue-700 dark:text-blue-400">
                    {registro.stock_inicio}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {registro.stock_cierre !== null ? (
                    <span className="inline-flex items-center px-4 py-2 rounded-md bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-900 font-bold text-lg text-purple-700 dark:text-purple-400">
                      {registro.stock_cierre}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-lg">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {registro.total_vendido > 0 ? (
                    <span className="inline-flex items-center px-4 py-2 rounded-md bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-900 font-bold text-xl text-[#00ff41]">
                      {registro.total_vendido}
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-semibold text-lg">
                      {registro.total_vendido}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {estaAbierto ? (
                    <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-sm font-semibold px-3 py-1.5">
                      <Clock className="h-4 w-4 mr-1" />
                      Abierto
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-3 py-1.5">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Cerrado
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {estaAbierto ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onCerrar(registro)}
                      className="bg-green-600 hover:bg-green-700 text-base font-semibold px-4 py-2 h-10"
                    >
                      Cerrar
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-base">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
