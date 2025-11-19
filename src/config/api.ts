// API Configuration
export const API_CONFIG = {
  // Base URL for the backend API - point to actual backend server
  // For client-side requests, always use Next.js API routes to avoid CORS issues
  // For server-side requests, use the direct backend URL
  BASE_URL: (() => {
    if (typeof window !== 'undefined') {
      // Client-side: use Next.js API routes
      return '/api';
    }
    // Server-side: use direct backend URL
    return process.env.BACKEND_URL || 'http://system.grhog.mn';
  })(),

  // API endpoints
  ENDPOINTS: {
    AUTH: {
      SIGNIN: '/auth/signin',
      SIGNOUT: '/auth/signout',
      REFRESH: '/auth/refresh',
      VALIDATE: '/auth/validate',
      STATUS: '/auth/status'
    },
    BINS: '/bins',
    CLIENTS: '/clients',
    BIN_USAGES: '/bin-usages',
    CLEARINGS: '/clearings',
    DASHBOARD: {
      ACTIVE_BINS: '/dashboard/active-bins',
      ACTIVE_CARDS: '/dashboard/active-cards',
      CURRENT_USAGE: '/dashboard/current-usage',
      AVERAGE_BIN_FILLING: '/dashboard/average-bin-filling',
      COLLECTION_TRENDS: '/dashboard/collection-trends',
      BIN_STATUS_DISTRIBUTION: '/dashboard/bin-status-distribution',
      DAILY_USAGE_TREND: '/dashboard/daily-usage-trend',
      LOCATION_STATS: '/dashboard/location-stats',
      GET_DISTRICT: '/dashboard/getDistrict',
      GET_KHOROO: '/dashboard/getKhoroo',
      CLIENT_TYPE_COUNTS: '/dashboard/client-type-counts',
      ALL_BINS: '/dashboard/all-bins',
      CLIENT_ACTIVITY_CHANGE: '/dashboard/client-activity-change'
    },
    ANALYTICS: {
      BIN_STATISTICS: '/analytics/bin-statistics',
      USAGE_STATISTICS: '/analytics/usage-statistics',
      PENETRATION_ANALYSIS: '/analytics/penetration-analysis',
      CLEARING_EFFICIENCY: '/analytics/clearing-efficiency'
    },
    STATISTICS: {
      BINS: {
        TOTAL_BINS: '/bins/total-bins',
        AVERAGE_FILL_LEVEL: '/bins/average-fill-level',
        AVERAGE_BATTERY: '/bins/average-battery',
        WARNING_BINS: '/bins/warning-bins'
      },
      CARDS: {
        TOTAL_CARDS: '/cards/total-cards',
        TOTAL_ACCESS: '/cards/total-access',
        ACTIVITY_RATE: '/cards/activity-rate'
      },
      TRANSACTIONS: {
        TODAY_USAGE: '/transactions/today-usage',
        TODAY_AVERAGE: '/transactions/today-average',
        ACTIVE_BINS_TODAY: '/transactions/active-bins-today',
        OVERALL_AVERAGE: '/transactions/overall-average'
      }
    },
    CLIENT_ACTIVITY: '/clients',
    TEST: '/test',
    USERS: '/users'
  },

  // Request configuration
  REQUEST_CONFIG: {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 seconds
  }
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get API endpoint
export const getApiEndpoint = (path: string): string => {
  const endpoint =
    API_CONFIG.ENDPOINTS[path as keyof typeof API_CONFIG.ENDPOINTS];
  if (typeof endpoint === 'string') {
    return endpoint;
  }
  return path;
};
