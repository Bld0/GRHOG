'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { authUtils } from '@/lib/auth';

// Types for bin statistics
export interface TotalBinsStats {
  totalBins: number;
  activeBins: number;
  inactiveBins: number;
  date: string;
}

export interface AverageFillLevelStats {
  averageFillLevel: number;
  totalBins: number;
  criticalBins: number;
  warningBins: number;
  normalBins: number;
  trend: {
    isPositive: boolean;
    changePercentage: number;
    period: string;
  };
  date: string;
}

export interface WarningBinsStats {
  criticalBins: number;
  warningBins: number;
  normalBins: number;
  totalWarningBins: number;
  totalBins: number;
  date: string;
}

export interface AverageBatteryStats {
  averageBatteryLevel: number;
  totalBins: number;
  lowBatteryBins: number;
  normalBatteryBins: number;
  trend: {
    isPositive: boolean;
    changePercentage: number;
    period: string;
  };
  date: string;
}

// Hook for total bins count
export function useTotalBins() {
  const [data, setData] = useState<TotalBinsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/bins/total-bins', {
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

// Hook for average fill level
export function useAverageFillLevel() {
  const [data, setData] = useState<AverageFillLevelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/bins/average-fill-level', {
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

// Hook for warning bins count
export function useWarningBins() {
  const [data, setData] = useState<WarningBinsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/bins/warning-bins', {
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

// Hook for average battery level
export function useAverageBattery() {
  const [data, setData] = useState<AverageBatteryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/bins/average-battery', {
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