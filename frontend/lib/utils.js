import { format, formatDistanceToNow } from 'date-fns';

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num || 0);
}

export function formatDate(date) {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date) {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy HH:mm');
}

export function timeAgo(date) {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getStockStatus(current, min) {
  if (current === 0) return { label: 'Out of Stock', color: 'critical', dot: 'bg-rose-500' };
  if (current <= min) return { label: 'Critical', color: 'critical', dot: 'bg-rose-500' };
  if (current <= min * 2) return { label: 'Low Stock', color: 'warning', dot: 'bg-amber-500' };
  return { label: 'In Stock', color: 'success', dot: 'bg-emerald-500' };
}

export function getOrderStatusBadge(status) {
  const map = {
    pending: { color: 'warning', label: 'Pending' },
    ordered: { color: 'info', label: 'Ordered' },
    received: { color: 'success', label: 'Received' },
    cancelled: { color: 'neutral', label: 'Cancelled' },
  };
  return map[status] || { color: 'neutral', label: status };
}

export function getSupplierRatingColor(rating) {
  if (rating >= 4.5) return 'text-emerald-400';
  if (rating >= 3.5) return 'text-amber-400';
  return 'text-rose-400';
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
