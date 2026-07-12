/**
 * Pure function KPI calculator for partner orders
 */

export interface Order {
  id: string;
  partnerId: string;
  orderDate: string;
  deliveryDate?: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items?: Array<{
    name: string;
    quantity?: number;
    price?: number;
  }>;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface KpiMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  onTimeDeliveryRate: number;
  missingDataCount: number;
  missingDataDetails: string[];
}

export function calculateKPIs(orders: Order[], dateRange?: DateRange): KpiMetrics {
  // Filter by date range if provided
  const filteredOrders = dateRange
    ? orders.filter((order) => {
        const orderDate = new Date(order.orderDate);
        const from = new Date(dateRange.from);
        const to = new Date(dateRange.to);
        return orderDate >= from && orderDate <= to;
      })
    : orders;

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.amount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // On-time delivery calculation
  const deliveredOrders = filteredOrders.filter(
    (order) => order.status === 'delivered' && order.deliveryDate
  );
  const onTimeOrders = deliveredOrders.filter((order) => {
    if (!order.deliveryDate) return false;
    const deliveryDate = new Date(order.deliveryDate);
    const orderDate = new Date(order.orderDate);
    // Assuming 7 days standard delivery
    const expectedDate = new Date(orderDate);
    expectedDate.setDate(expectedDate.getDate() + 7);
    return deliveryDate <= expectedDate;
  });
  const onTimeDeliveryRate =
    deliveredOrders.length > 0 ? (onTimeOrders.length / deliveredOrders.length) * 100 : 0;

  // Missing data audit
  const missingDataDetails: string[] = [];
  filteredOrders.forEach((order) => {
    if (!order.deliveryDate && order.status === 'delivered') {
      missingDataDetails.push(`Order ${order.id}: missing deliveryDate`);
    }
    if (!order.items || order.items.length === 0) {
      missingDataDetails.push(`Order ${order.id}: missing items`);
    }
    if (order.items) {
      order.items.forEach((item, index) => {
        if (!item.quantity) {
          missingDataDetails.push(`Order ${order.id}, Item ${index + 1}: missing quantity`);
        }
        if (!item.price) {
          missingDataDetails.push(`Order ${order.id}, Item ${index + 1}: missing price`);
        }
      });
    }
  });

  return {
    totalOrders,
    totalRevenue,
    averageOrderValue,
    onTimeDeliveryRate,
    missingDataCount: missingDataDetails.length,
    missingDataDetails,
  };
}

export function filterOrdersByMetric(
  orders: Order[],
  metric: 'missing_data' | 'late_delivery' | 'high_value'
): Order[] {
  switch (metric) {
    case 'missing_data':
      return orders.filter((order) => {
        const hasMissingDate = !order.deliveryDate && order.status === 'delivered';
        const hasMissingItems = !order.items || order.items.length === 0;
        const hasMissingItemData =
          order.items?.some((item) => !item.quantity || !item.price) || false;
        return hasMissingDate || hasMissingItems || hasMissingItemData;
      });

    case 'late_delivery':
      return orders.filter((order) => {
        if (order.status !== 'delivered' || !order.deliveryDate) return false;
        const deliveryDate = new Date(order.deliveryDate);
        const orderDate = new Date(order.orderDate);
        const expectedDate = new Date(orderDate);
        expectedDate.setDate(expectedDate.getDate() + 7);
        return deliveryDate > expectedDate;
      });

    case 'high_value':
      const avgValue = orders.reduce((sum, o) => sum + o.amount, 0) / orders.length;
      return orders.filter((order) => order.amount > avgValue * 1.5);

    default:
      return orders;
  }
}
