import { create } from 'zustand';
import {
  assetsInventoryApi,
  type FixedAsset,
  type Warehouse,
  type StockLevel,
  type StockTransaction,
} from '../api/modules/assetsInventory.api';

interface AssetsInventoryState {
  assets: FixedAsset[];
  fixedAssets: FixedAsset[];
  warehouses: Warehouse[];
  stockLevels: StockLevel[];
  stockTransactions: StockTransaction[];
  loading: boolean;
  error: string | null;

  fetchFixedAssets: (companyId?: string) => Promise<FixedAsset[]>;
  runDepreciation: (id: string, expenseAccId: string, accumAccId: string) => Promise<any>;
  runBatchDepreciation: (asOfDate?: string) => Promise<any>;
  disposeAsset: (id: string, data: any) => Promise<any>;

  fetchWarehouses: (companyId?: string) => Promise<Warehouse[]>;
  createWarehouse: (data: any) => Promise<Warehouse>;

  fetchStockLevels: (companyId?: string) => Promise<StockLevel[]>;
  fetchStockTransactions: (companyId?: string) => Promise<StockTransaction[]>;
  createStockTransaction: (data: any) => Promise<StockTransaction>;

  fetchAllAssetsInventory: (companyId?: string) => Promise<void>;
}

export const useAssetsInventoryStore = create<AssetsInventoryState>((set, get) => ({
  assets: [],
  fixedAssets: [],
  warehouses: [],
  stockLevels: [],
  stockTransactions: [],
  loading: false,
  error: null,

  fetchFixedAssets: async (companyId?: string) => {
    try {
      const assets = await assetsInventoryApi.getFixedAssets(companyId);
      set({ assets, fixedAssets: assets });
      return assets;
    } catch {
      return [];
    }
  },

  runDepreciation: async (id: string, expenseAccId: string, accumAccId: string) => {
    const res = await assetsInventoryApi.runDepreciation(id, expenseAccId, accumAccId);
    await get().fetchFixedAssets();
    return res;
  },

  runBatchDepreciation: async (asOfDate?: string) => {
    const res = await assetsInventoryApi.runBatchDepreciation(asOfDate);
    await get().fetchFixedAssets();
    return res;
  },

  disposeAsset: async (id: string, data: any) => {
    const res = await assetsInventoryApi.disposeAsset(id, data);
    await get().fetchFixedAssets();
    return res;
  },

  fetchWarehouses: async (companyId?: string) => {
    try {
      const warehouses = await assetsInventoryApi.getWarehouses(companyId);
      set({ warehouses });
      return warehouses;
    } catch {
      return [];
    }
  },

  createWarehouse: async (data: any) => {
    const res = await assetsInventoryApi.createWarehouse(data);
    await get().fetchWarehouses();
    return res;
  },

  fetchStockLevels: async (companyId?: string) => {
    try {
      const stockLevels = await assetsInventoryApi.getStockLevels(companyId);
      set({ stockLevels });
      return stockLevels;
    } catch {
      return [];
    }
  },

  fetchStockTransactions: async (companyId?: string) => {
    try {
      const stockTransactions = await assetsInventoryApi.getStockTransactions(companyId);
      set({ stockTransactions });
      return stockTransactions;
    } catch {
      return [];
    }
  },

  createStockTransaction: async (data: any) => {
    const res = await assetsInventoryApi.createStockTransaction(data);
    await Promise.all([get().fetchStockLevels(), get().fetchStockTransactions()]);
    return res;
  },

  fetchAllAssetsInventory: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const [assets, warehouses, stockLevels, stockTransactions] = await Promise.all([
        assetsInventoryApi.getFixedAssets(companyId).catch(() => []),
        assetsInventoryApi.getWarehouses(companyId).catch(() => []),
        assetsInventoryApi.getStockLevels(companyId).catch(() => []),
        assetsInventoryApi.getStockTransactions(companyId).catch(() => []),
      ]);
      set({ assets, warehouses, stockLevels, stockTransactions, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load assets & inventory data', loading: false });
    }
  },
}));
