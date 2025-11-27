import {
  DashboardActiveBins,
  DashboardActiveCards,
  DashboardCurrentUsage,
  DashboardAverageFilling,
  CollectionTrends,
  BinStatusDistributionData,
  DailyUsageTrendData,
  LocationStatsData,
  Bin,
  Client,
  BinUsage,
  BinClearing,
  BinStatistics,
  UsageStatistics,
  PenetrationAnalysis,
  ClearingEfficiency,
  ClientActivity,
  LoginCredentials,
  AuthResponse,
  User
} from '@/types';
import { authUtils } from './auth';
import { API_CONFIG } from '@/config/api';
import { apiClient } from './api-client';

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// API endpoint URLs - these now point to the backend API
export const API_ENDPOINTS = {
  BINS: buildApiUrl(API_CONFIG.ENDPOINTS.BINS),
  CLIENTS: buildApiUrl(API_CONFIG.ENDPOINTS.CLIENTS),
  BIN_USAGES: buildApiUrl(API_CONFIG.ENDPOINTS.BIN_USAGES),
  CLEARINGS: buildApiUrl(API_CONFIG.ENDPOINTS.CLEARINGS),
  // Authentication endpoints
  AUTH_SIGNIN: buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNIN),
  AUTH_SIGNOUT: buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNOUT),
  AUTH_REFRESH: buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH),
  AUTH_VALIDATE: buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.VALIDATE),
  AUTH_STATUS: buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.STATUS),
  // Dashboard endpoints
  DASHBOARD_ACTIVE_BINS: buildApiUrl(
    API_CONFIG.ENDPOINTS.DASHBOARD.ACTIVE_BINS
  ),
  DASHBOARD_ACTIVE_CARDS: buildApiUrl(
    API_CONFIG.ENDPOINTS.DASHBOARD.ACTIVE_CARDS
  ),
  DASHBOARD_TOTAL_CARDS: buildApiUrl(
    API_CONFIG.ENDPOINTS.DASHBOARD.TOTAL_CARDS
  ),
  DASHBOARD_CURRENT_USAGE: buildApiUrl(
    API_CONFIG.ENDPOINTS.DASHBOARD.CURRENT_USAGE
  ),
  DASHBOARD_TOTAL_HOUSEHOLDS: buildApiUrl(
    API_CONFIG.ENDPOINTS.DASHBOARD.TOTAL_HOUSEHOLDS
  ),
  DASHBOARD_AVERAGE_FILLING: buildApiUrl(
    API_CONFIG.ENDPOINTS.DASHBOARD.AVERAGE_BIN_FILLING
  ),
  // Analytics endpoints
  ANALYTICS_BIN_STATISTICS: buildApiUrl(
    API_CONFIG.ENDPOINTS.ANALYTICS.BIN_STATISTICS
  ),
  ANALYTICS_USAGE_STATISTICS: buildApiUrl(
    API_CONFIG.ENDPOINTS.ANALYTICS.USAGE_STATISTICS
  ),
  ANALYTICS_PENETRATION_ANALYSIS: buildApiUrl(
    API_CONFIG.ENDPOINTS.ANALYTICS.PENETRATION_ANALYSIS
  ),
  ANALYTICS_CLEARING_EFFICIENCY: buildApiUrl(
    API_CONFIG.ENDPOINTS.ANALYTICS.CLEARING_EFFICIENCY
  ),
  // Client activity endpoints
  CLIENT_ACTIVITY: buildApiUrl(API_CONFIG.ENDPOINTS.CLIENT_ACTIVITY),
  // User management endpoints
  USERS: buildApiUrl(API_CONFIG.ENDPOINTS.USERS),
  // Test endpoint
  TEST: buildApiUrl(API_CONFIG.ENDPOINTS.TEST)
} as const;

// Authentication functions
export async function signIn(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    API_ENDPOINTS.AUTH_SIGNIN,
    credentials,
    false
  );

  // Store auth data after successful login
  authUtils.setAuthData(response);

  return response;
}

export async function signOut(): Promise<{ message: string }> {
  try {
    await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH_SIGNOUT,
      {},
      true
    );
  } catch (error) {
    // sign out error suppressed
  } finally {
    // Always clear local auth data
    authUtils.removeAuthData();
  }

  return { message: 'Logged out successfully' };
}

export async function refreshToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  return apiClient.post<{ accessToken: string; refreshToken: string }>(
    API_ENDPOINTS.AUTH_REFRESH,
    { refreshToken },
    false
  );
}

export async function validateToken(token: string): Promise<any> {
  return apiClient.post(API_ENDPOINTS.AUTH_VALIDATE, { token }, false);
}

export async function getAuthStatus(): Promise<any> {
  return apiClient.get(API_ENDPOINTS.AUTH_STATUS, true);
}

// Bin functions
export async function getBins(): Promise<Bin[]> {
  return apiClient.get<Bin[]>(API_ENDPOINTS.BINS);
}

export async function getBin(id: number): Promise<Bin> {
  return apiClient.get<Bin>(`${API_ENDPOINTS.BINS}/${id}`);
}

export async function createBin(bin: Partial<Bin>): Promise<Bin> {
  return apiClient.post<Bin>(API_ENDPOINTS.BINS, bin);
}

export async function updateBin(id: number, bin: Partial<Bin>): Promise<Bin> {
  return apiClient.put<Bin>(`${API_ENDPOINTS.BINS}/${id}`, bin);
}

export async function deleteBin(id: number): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`${API_ENDPOINTS.BINS}/${id}`);
}

// Client functions
export async function getClients(): Promise<Client[]> {
  return apiClient.get<Client[]>(API_ENDPOINTS.CLIENTS);
}

export async function getClient(id: number): Promise<Client> {
  return apiClient.get<Client>(`${API_ENDPOINTS.CLIENTS}/${id}`);
}

// Bin usage functions
export async function getBinUsages(): Promise<BinUsage[]> {
  return apiClient.get<BinUsage[]>(API_ENDPOINTS.BIN_USAGES);
}

// Clearing functions
export async function getClearings(): Promise<BinClearing[]> {
  return apiClient.get<BinClearing[]>(API_ENDPOINTS.CLEARINGS);
}

// User management functions
export async function getUsers(): Promise<User[]> {
  return apiClient.get<User[]>(API_ENDPOINTS.USERS);
}

export async function getUser(id: number): Promise<User> {
  return apiClient.get<User>(`${API_ENDPOINTS.USERS}/${id}`);
}

export async function createUser(user: Partial<User>): Promise<User> {
  return apiClient.post<User>(API_ENDPOINTS.USERS, user);
}

export async function updateUser(
  id: number,
  user: Partial<User>
): Promise<User> {
  return apiClient.put<User>(`${API_ENDPOINTS.USERS}/${id}`, user);
}

export async function deleteUser(id: number): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`${API_ENDPOINTS.USERS}/${id}`);
}

// Analytics functions
export async function getBinStatistics(): Promise<BinStatistics> {
  return apiClient.get<BinStatistics>(API_ENDPOINTS.ANALYTICS_BIN_STATISTICS);
}

export async function getUsageStatistics(): Promise<UsageStatistics> {
  return apiClient.get<UsageStatistics>(
    API_ENDPOINTS.ANALYTICS_USAGE_STATISTICS
  );
}

export async function getPenetrationAnalysis(): Promise<PenetrationAnalysis> {
  return apiClient.get<PenetrationAnalysis>(
    API_ENDPOINTS.ANALYTICS_PENETRATION_ANALYSIS
  );
}

export async function getClearingEfficiency(): Promise<ClearingEfficiency> {
  return apiClient.get<ClearingEfficiency>(
    API_ENDPOINTS.ANALYTICS_CLEARING_EFFICIENCY
  );
}

// Client activity functions
export async function getClientActivity(
  cardId: string
): Promise<ClientActivity> {
  return apiClient.get<ClientActivity>(
    `${API_ENDPOINTS.CLIENT_ACTIVITY}/${cardId}/activity`
  );
}

// Dashboard functions
export const getDashboardActiveBins =
  async (): Promise<DashboardActiveBins> => {
    return apiClient.get<DashboardActiveBins>(
      API_ENDPOINTS.DASHBOARD_ACTIVE_BINS
    );
  };

export const getTotalHouseHolds = async (): Promise<DashboardActiveCards> => {
  return apiClient.get<DashboardActiveCards>(
    API_ENDPOINTS.DASHBOARD_TOTAL_HOUSEHOLDS
  );
};

export const getDashboardActiveCards =
  async (): Promise<DashboardActiveCards> => {
    return apiClient.get<DashboardActiveCards>(
      API_ENDPOINTS.DASHBOARD_ACTIVE_CARDS
    );
  };

export const getDashboardCurrentUsage =
  async (): Promise<DashboardCurrentUsage> => {
    return apiClient.get<DashboardCurrentUsage>(
      API_ENDPOINTS.DASHBOARD_CURRENT_USAGE
    );
  };

export const getDashboardAverageFilling =
  async (): Promise<DashboardAverageFilling> => {
    return apiClient.get<DashboardAverageFilling>(
      API_ENDPOINTS.DASHBOARD_AVERAGE_FILLING
    );
  };

export const getCollectionTrends = async (): Promise<CollectionTrends> => {
  return apiClient.get<CollectionTrends>(
    buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.COLLECTION_TRENDS)
  );
};

export const getBinStatusDistribution =
  async (): Promise<BinStatusDistributionData> => {
    return apiClient.get<BinStatusDistributionData>(
      buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.BIN_STATUS_DISTRIBUTION)
    );
  };

export const getDailyUsageTrend = async (): Promise<DailyUsageTrendData> => {
  return apiClient.get<DailyUsageTrendData>(
    buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.DAILY_USAGE_TREND)
  );
};

export const getLocationStats = async (): Promise<LocationStatsData> => {
  return apiClient.get<LocationStatsData>(
    buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.LOCATION_STATS)
  );
};

// Fetch khoroo list for a district
export const getKhorooList = async (district?: string): Promise<number[]> => {
  const params = new URLSearchParams();
  if (district) params.set('district', district);
  return apiClient.get<number[]>(
    buildApiUrl(
      `${API_CONFIG.ENDPOINTS.DASHBOARD.GET_KHOROO}?${params.toString()}`
    )
  );
};

// Fetch client type counts filtered by district and optional khoroo
export const getClientTypeCounts = async (
  district?: string,
  khoroo?: number
): Promise<Array<{ type: string; count: number }>> => {
  const params = new URLSearchParams();
  if (district) params.set('district', district);
  if (khoroo != null) params.set('khoroo', String(khoroo));
  return apiClient.get<Array<{ type: string; count: number }>>(
    buildApiUrl(
      `${API_CONFIG.ENDPOINTS.DASHBOARD.CLIENT_TYPE_COUNTS}?${params.toString()}`
    )
  );
};

// Fetch all bins (used for map pins)
export const getAllBins = async (): Promise<Bin[]> => {
  return apiClient.get<Bin[]>(
    buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.ALL_BINS)
  );
};
