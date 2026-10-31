import { Role, SubscriptionStatus, InvoiceStatus, PaymentMethod, ProductType, BillingFrequency, DiscountType } from '@prisma/client';

export type UserSession = {
  id: string;
  email: string;
  name: string;
  role: Role;
  customerId?: string | null;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export interface DashboardMetrics {
  totalActiveSubscriptions: number;
  newSubscriptionsCount: number;
  revenueCollected: number;
  outstandingBalance: number;
  overdueInvoicesCount: number;
  overdueInvoicesAmount: number;
  upcomingRenewalsCount: number;
  revenueTrend: { date: string; collected: number; invoiced: number }[];
  invoiceStatusBreakdown: { status: InvoiceStatus; count: number; total: number }[];
  recentPayments: {
    id: string;
    paymentReference: string;
    customerName: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
  }[];
  recentSubscriptions: {
    id: string;
    subscriptionNumber: string;
    customerName: string;
    planName: string;
    grandTotal: number;
    status: SubscriptionStatus;
    startDate: string;
  }[];
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  roles: Role[];
}
