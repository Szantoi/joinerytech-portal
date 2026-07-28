/**
 * React Query Keys for Warehouse Module
 */
export const warehouseKeys = {
  all: ['warehouse'] as const,

  // Inventory Stock (paginated read model) + Summary KPIs
  stock: () => [...warehouseKeys.all, 'stock'] as const,
  stockList: (filters?: Record<string, unknown>) => [...warehouseKeys.stock(), 'list', filters] as const,
  summary: () => [...warehouseKeys.all, 'summary'] as const,

  // Inventory Offcuts
  offcuts: () => [...warehouseKeys.all, 'offcuts'] as const,
  offcutsList: (filters?: Record<string, unknown>) => [...warehouseKeys.offcuts(), 'list', filters] as const,
  offcutDetail: (id: string) => [...warehouseKeys.offcuts(), 'detail', id] as const,
  offcutsSummary: () => [...warehouseKeys.offcuts(), 'summary'] as const,

  // Inventory Movements & Trends
  /** Prefix az ÖSSZES movements-lekérdezés invalidálásához (Rule-6 deliver ág). */
  movementsRoot: () => [...warehouseKeys.all, 'movements'] as const,
  movements: (filters: Record<string, unknown> = {}) => [...warehouseKeys.movementsRoot(), filters] as const,
  /** Prefix az ÖSSZES trend-lekérdezés invalidálásához (Rule-6 deliver ág). */
  trends: () => [...warehouseKeys.all, 'trend'] as const,
  trend: (materialType?: string, from?: string, to?: string) =>
    [...warehouseKeys.trends(), { materialType, from, to }] as const,

  // Procurement Suppliers
  suppliers: () => [...warehouseKeys.all, 'suppliers'] as const,

  // Procurement Orders (POs)
  purchaseOrders: () => [...warehouseKeys.all, 'purchase-orders'] as const,
  purchaseOrderList: (filters?: Record<string, unknown>) => [...warehouseKeys.purchaseOrders(), 'list', filters] as const,
  purchaseOrderDetail: (id: string) => [...warehouseKeys.purchaseOrders(), 'detail', id] as const,

  // Procurement Requisitions
  requisitions: () => [...warehouseKeys.all, 'requisitions'] as const,
  requisitionDetail: (id: string) => [...warehouseKeys.requisitions(), 'detail', id] as const,
};
