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
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Producto</TableHead>
            <TableHead className="font-semibold">Categoría</TableHead>
            <TableHead className="text-center font-semibold">Fecha Inicio</TableHead>
            <TableHead className="text-center font-semibold">Fecha Cierre</TableHead>
            <TableHead className="text-center font-semibold">Stock Inicio</TableHead>
            <TableHead className="text-center font-semibold">Stock Cierre</TableHead>
            <TableHead className="text-center font-semibold">Total Vendido</TableHead>
            <TableHead className="text-center font-semibold">Estado</TableHead>
            <TableHead className="text-center font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((registro) => {
            const estaAbierto = !registro.fecha_cierre;

            return (
              <TableRow
                key={registro.id}
                className={`hover:bg-muted/30 transition-colors ${
                  estaAbierto ? 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
              >
                <TableCell className="font-semibold text-foreground">
                  {registro.nombre_producto}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    {registro.categoria}
                  </span>
                </TableCell>
                <TableCell className="text-center text-sm">
                  {formatDateTime(registro.fecha_inicio)}
                </TableCell>
                <TableCell className="text-center text-sm">
                  {formatDateTime(registro.fecha_cierre)}
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 font-semibold text-blue-700 dark:text-blue-400">
                    {registro.stock_inicio}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {registro.stock_cierre !== null ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 font-semibold text-purple-700 dark:text-purple-400">
                      {registro.stock_cierre}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {registro.total_vendido > 0 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 font-bold text-green-700 dark:text-green-400">
                      {registro.total_vendido}
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-semibold">
                      {registro.total_vendido}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {estaAbierto ? (
                    <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Abierto
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-500 hover:bg-green-600 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
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
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Cerrar
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
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
