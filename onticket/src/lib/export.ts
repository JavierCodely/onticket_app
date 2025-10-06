/**
 * Export utilities for downloading data as CSV
 */

import type { Producto } from '@/types/database';

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
