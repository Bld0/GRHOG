'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { authUtils } from '@/lib/auth';

// Types for card statistics
export interface TotalCardsStats {
  totalCards: number;
  activeCards: number;
  inactiveCards: number;
  date: string;
}

export interface TotalAccessStats {
  totalAccess: number;
  totalCards: number;
  averageAccessPerCard: number;
  activeCards: number;
  date: string;
}

export interface ActivityRateStats {
  activityRate: number;
  totalCards: number;
  activeCards: number;
  inactiveCards: number;
  trend: {
    isPositive: boolean;
    changePercentage: number;
    period: string;
  };
  date: string;
}

// Hook for total cards count
export function useTotalCards() {
  const [data, setData] = useState<TotalCardsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/cards/total-cards', {
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

// Hook for total access count
export function useTotalAccess() {
  const [data, setData] = useState<TotalAccessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/cards/total-access', {
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

// Hook for activity rate
export function useActivityRate() {
  const [data, setData] = useState<ActivityRateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/cards/activity-rate', {
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