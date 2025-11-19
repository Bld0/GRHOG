'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { authUtils } from '@/lib/auth';

// Types for transaction statistics
export interface TodayUsageStats {
  todayCount: number;
  totalCount: number;
  date: string;
}

export interface TodayAverageStats {
  todayAverage: number;
  yesterdayAverage: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  todayCount: number;
  yesterdayCount: number;
}

export interface ActiveBinsStats {
  todayActiveBins: number;
  totalBins: number;
  uniqueBinsToday: number[];
  date: string;
}

export interface OverallAverageStats {
  overallAverage: number;
  totalTransactions: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  totalBins: number;
}

// Hook for today's usage count
export function useTodayUsage() {
  const [data, setData] = useState<TodayUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/transactions/today-usage', {
          headers: authUtils.getAuthHeader(),
        });
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

// Hook for today's average storage level
export function useTodayAverage() {
  const [data, setData] = useState<TodayAverageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/transactions/today-average', {
          headers: authUtils.getAuthHeader(),
        });
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

// Hook for active bins today
export function useActiveBinsToday() {
  const [data, setData] = useState<ActiveBinsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/transactions/active-bins-today', {
          headers: authUtils.getAuthHeader(),
        });
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

// Hook for overall average storage level
export function useOverallAverage() {
  const [data, setData] = useState<OverallAverageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/transactions/overall-average', {
          headers: authUtils.getAuthHeader(),
        });
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
} 