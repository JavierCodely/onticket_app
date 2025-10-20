/**
 * Export utilities for downloading data as CSV
 */

import type { Producto, InicioCierre } from '@/types/database';
import type { CurrencyCode } from '@/types/currency';
import { getPriceForCurrency } from './currency-utils';

/**
 * Export products to CSV file
 */
export function exportProductsToCSV(
  productos: Producto[],
  filename: string = 'productos.csv',
  currency: CurrencyCode = 'ARS'
) {
  // Define CSV headers with currency
  const headers = [
    'Nombre',
    'Categoría',
    `Precio Compra (${currency})`,
    `Precio Venta (${currency})`,
    'Stock',
    'Ganancia %',
    'Ganancia Unitaria',
    'Valor Stock (Compra)',
    'Valor Stock (Venta)',
  ];

  // Convert products to CSV rows
  const rows = productos.map((producto) => {
    // Get prices for selected currency
    const precioCompra = getPriceForCurrency(producto, currency, 'compra');
    const precioVenta = getPriceForCurrency(producto, currency, 'venta');
    const stock = Number(producto.stock) || 0;

    const gananciaUnitaria = precioVenta - precioCompra;
    const gananciaPorcentaje =
      precioCompra === 0
        ? 0
        : ((precioVenta - precioCompra) / precioCompra) * 100;
    const valorStockCompra = precioCompra * stock;
    const valorStockVenta = precioVenta * stock;

    return [
      producto.nombre || '',
      producto.categoria || '',
      precioCompra.toFixed(2),
      precioVenta.toFixed(2),
      stock.toString(),
      gananciaPorcentaje.toFixed(2),
      gananciaUnitaria.toFixed(2),
      valorStockCompra.toFixed(2),
      valorStockVenta.toFixed(2),
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  // Add BOM (Byte Order Mark) for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;

  // Create blob and download
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export inventory opening/closing records to CSV file
 */
export function exportInicioCierreToCSV(
  registros: InicioCierre[],
  filename: string = 'inicioycierre.csv'
) {
  // Define CSV headers
  const headers = [
    'Producto',
    'Categoría',
    'Fecha Inicio',
    'Fecha Cierre',
    'Stock Inicio',
    'Stock Cierre',
    'Total Vendido',
    'Estado',
  ];

  // Helper to format date
  const formatDate = (dateString: string | null) => {
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

  // Convert records to CSV rows
  const rows = registros.map((registro) => {
    const estado = registro.fecha_cierre ? 'Cerrado' : 'Abierto';

    return [
      registro.nombre_producto,
      registro.categoria,
      formatDate(registro.fecha_inicio),
      formatDate(registro.fecha_cierre),
      registro.stock_inicio.toString(),
      registro.stock_cierre?.toString() || '-',
      registro.total_vendido.toString(),
      estado,
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
