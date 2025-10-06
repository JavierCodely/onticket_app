/**
 * Export utilities for downloading data as CSV
 */

import type { Producto, InicioCierre } from '@/types/database';

/**
 * Export products to CSV file
 */
export function exportProductsToCSV(productos: Producto[], filename: string = 'productos.csv') {
  // Define CSV headers
  const headers = [
    'Nombre',
    'Categoría',
    'Precio Compra',
    'Precio Venta',
    'Stock',
    'Ganancia %',
    'Ganancia Unitaria',
    'Valor Stock (Compra)',
    'Valor Stock (Venta)',
  ];

  // Convert products to CSV rows
  const rows = productos.map((producto) => {
    const gananciaUnitaria = producto.precio_venta - producto.precio_compra;
    const gananciaPorcentaje =
      producto.precio_compra === 0
        ? 0
        : ((producto.precio_venta - producto.precio_compra) / producto.precio_compra) * 100;
    const valorStockCompra = producto.precio_compra * producto.stock;
    const valorStockVenta = producto.precio_venta * producto.stock;

    return [
      producto.nombre,
      producto.categoria,
      producto.precio_compra.toFixed(2),
      producto.precio_venta.toFixed(2),
      producto.stock.toString(),
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
