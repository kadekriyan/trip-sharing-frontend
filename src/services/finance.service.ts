import { apiClient } from "@/src/lib/api-client";
import type {
  FinanceTransaction,
  CashflowSummary,
  DriverManifestSummaryItem,
  DriverSettlementSlip,
  VendorSettlementSlip,
} from "@/src/types";

export interface TransactionFilterParams {
  type?: string;
  category?: string;
  driverId?: string;
  vehicleId?: string;
  tripId?: string;
  bookingGroupId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const financeService = {
  /**
   * Get Cashflow Overview, Profit & Loss, and 1.5% Tax
   */
  async getCashflowSummary(startDate?: string, endDate?: string): Promise<CashflowSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const res = await apiClient.get<CashflowSummary>(
      `/finance/summary?${params.toString()}`
    );
    return res.data;
  },

  /**
   * Get Driver Manifest collections & unsettled trip summaries
   */
  async getDriverManifests(driverId?: string, startDate?: string, endDate?: string): Promise<DriverManifestSummaryItem[]> {
    const params = new URLSearchParams();
    if (driverId) params.append("driverId", driverId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const res = await apiClient.get<DriverManifestSummaryItem[]>(
      `/finance/driver-manifests?${params.toString()}`
    );
    return res.data || [];
  },

  /**
   * Get list of finance transactions
   */
  async getTransactions(filters: TransactionFilterParams = {}): Promise<{
    data: FinanceTransaction[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.category) params.append("category", filters.category);
    if (filters.driverId) params.append("driverId", filters.driverId);
    if (filters.vehicleId) params.append("vehicleId", filters.vehicleId);
    if (filters.tripId) params.append("tripId", filters.tripId);
    if (filters.bookingGroupId) params.append("bookingGroupId", filters.bookingGroupId);
    if (filters.status) params.append("status", filters.status);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await apiClient.get<FinanceTransaction[]>(`/finance/transactions?${params.toString()}`);

    return {
      data: Array.isArray(res.data) ? res.data : [],
      pagination: (res as any).pagination || res.meta,
    };
  },

  /**
   * Get transaction detail by ID
   */
  async getTransactionById(id: string): Promise<FinanceTransaction> {
    const res = await apiClient.get<FinanceTransaction>(
      `/finance/transactions/${id}`
    );
    return res.data;
  },

  /**
   * Create finance transaction (Inflow or Outflow)
   */
  async createTransaction(payload: Record<string, any>): Promise<FinanceTransaction> {
    const res = await apiClient.post<FinanceTransaction>(
      `/finance/transactions`,
      payload
    );
    return res.data;
  },

  /**
   * Update finance transaction
   */
  async updateTransaction(id: string, payload: Record<string, any>): Promise<FinanceTransaction> {
    const res = await apiClient.put<FinanceTransaction>(
      `/finance/transactions/${id}`,
      payload
    );
    return res.data;
  },

  /**
   * Delete finance transaction
   */
  async deleteTransaction(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await apiClient.delete<unknown>(`/finance/transactions/${id}`);
    return {
      success: res.success,
      message: res.message,
    };
  },

  /**
   * Get Driver Settlement Slips
   */
  async getDriverSlips(driverId?: string, status?: string): Promise<DriverSettlementSlip[]> {
    const params = new URLSearchParams();
    if (driverId) params.append("driverId", driverId);
    if (status) params.append("status", status);

    const res = await apiClient.get<DriverSettlementSlip[]>(
      `/finance/driver-slips?${params.toString()}`
    );
    return res.data || [];
  },

  /**
   * Create Driver Settlement Slip
   */
  async createDriverSlip(payload: Record<string, any>): Promise<DriverSettlementSlip> {
    const res = await apiClient.post<DriverSettlementSlip>(
      `/finance/driver-slips`,
      payload
    );
    return res.data;
  },

  /**
   * Update Driver Slip Status
   */
  async updateDriverSlipStatus(
    id: string,
    payload: { status: string; paymentProofUrl?: string; notes?: string }
  ): Promise<DriverSettlementSlip> {
    const res = await apiClient.patch<DriverSettlementSlip>(
      `/finance/driver-slips/${id}/status`,
      payload
    );
    return res.data;
  },

  /**
   * Get Vendor Settlement Slips
   */
  async getVendorSlips(vendorName?: string, status?: string): Promise<VendorSettlementSlip[]> {
    const params = new URLSearchParams();
    if (vendorName) params.append("vendorName", vendorName);
    if (status) params.append("status", status);

    const res = await apiClient.get<VendorSettlementSlip[]>(
      `/finance/vendor-slips?${params.toString()}`
    );
    return res.data || [];
  },

  /**
   * Create Vendor Settlement Slip
   */
  async createVendorSlip(payload: Record<string, any>): Promise<VendorSettlementSlip> {
    const res = await apiClient.post<VendorSettlementSlip>(
      `/finance/vendor-slips`,
      payload
    );
    return res.data;
  },

  /**
   * Update Vendor Slip Status
   */
  async updateVendorSlipStatus(
    id: string,
    payload: { status: string; paymentProofUrl?: string; notes?: string }
  ): Promise<VendorSettlementSlip> {
    const res = await apiClient.patch<VendorSettlementSlip>(
      `/finance/vendor-slips/${id}/status`,
      payload
    );
    return res.data;
  },
};
