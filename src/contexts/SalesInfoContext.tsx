'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface SalesInfo {
  id?: number;
  info_sign: number;
  name?: string;
  phone?: string;
  // 添加其他需要的字段
}

interface SalesInfoContextType {
  salesInfo: SalesInfo | null;
  isLoading: boolean;
  refreshSalesInfo: () => Promise<void>;
}

const SalesInfoContext = createContext<SalesInfoContextType | undefined>(undefined);

export function SalesInfoProvider({ children }: { children: ReactNode }) {
  const [salesInfo, setSalesInfo] = useState<SalesInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchSalesInfo = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // 这里可以调用实际的API来获取销售信息
      // 暂时使用模拟数据
      const mockSalesInfo: SalesInfo = {
        id: 1,
        info_sign: 1,
        name: user.data?.name || '',
        phone: user.data?.phone || '',
      };
      setSalesInfo(mockSalesInfo);
    } catch (error) {
      console.error('获取销售信息失败:', error);
      setSalesInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSalesInfo = async () => {
    await fetchSalesInfo();
  };

  useEffect(() => {
    if (user) {
      fetchSalesInfo();
    } else {
      setSalesInfo(null);
    }
  }, [user]);

  return (
    <SalesInfoContext.Provider value={{ salesInfo, isLoading, refreshSalesInfo }}>
      {children}
    </SalesInfoContext.Provider>
  );
}

export function useSalesInfo() {
  const context = useContext(SalesInfoContext);
  if (context === undefined) {
    throw new Error('useSalesInfo must be used within a SalesInfoProvider');
  }
  return context;
} 