import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { RestaurantConfigType, CategoryType, TableTypeConfig } from '../types/types';
import { getApiBase } from '../config';
import { authFetch } from '../utils/api';
import { useAuth } from './useAuth';

interface RestaurantConfigContextType {
  config: RestaurantConfigType | null;
  categories: CategoryType[];
  tableTypes: TableTypeConfig[];
  loading: boolean;
  refetch: () => Promise<void>;
  getCurrencySymbol: () => string;
  getTablePrefix: (tableType: string) => string;
  getCategoryEmoji: (name: string) => string;
}

const RestaurantConfigContext = createContext<RestaurantConfigContextType>({
  config: null,
  categories: [],
  tableTypes: [],
  loading: true,
  refetch: async () => {},
  getCurrencySymbol: () => '\u20B9',
  getTablePrefix: () => 'T',
  getCategoryEmoji: () => '',
});

export function RestaurantConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RestaurantConfigType | null>(null);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [tableTypes, setTableTypes] = useState<TableTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAll = useCallback(async () => {
    // Config endpoints require auth — skip if not logged in
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const [configRes, catRes, ttRes] = await Promise.all([
        authFetch(`${getApiBase()}/api/config`),
        authFetch(`${getApiBase()}/api/config/categories`),
        authFetch(`${getApiBase()}/api/config/table-types`),
      ]);
      if (configRes.ok) setConfig(await configRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (ttRes.ok) setTableTypes(await ttRes.json());
    } catch (err) {
      console.error('Failed to fetch restaurant config:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getCurrencySymbol = useCallback(() => config?.currencySymbol || '\u20B9', [config]);

  const getTablePrefix = useCallback((tableType: string) => {
    const tt = tableTypes.find(t => t.name === tableType);
    return tt?.labelPrefix || 'T';
  }, [tableTypes]);

  const getCategoryEmoji = useCallback((name: string) => {
    const cat = categories.find(c => c.name === name);
    return cat?.emoji || '';
  }, [categories]);

  return (
    <RestaurantConfigContext.Provider value={{
      config, categories, tableTypes, loading,
      refetch: fetchAll, getCurrencySymbol, getTablePrefix, getCategoryEmoji,
    }}>
      {children}
    </RestaurantConfigContext.Provider>
  );
}

export function useRestaurantConfig() {
  return useContext(RestaurantConfigContext);
}
