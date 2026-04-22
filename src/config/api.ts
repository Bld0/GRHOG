// API Configuration
export const API_CONFIG = {
  // Base URL for the backend API. The client always talks to '/api/*' on the
  // same origin; in production a Next.js `beforeFiles` rewrite (see
  // next.config.ts) forwards those requests directly to the backend at the
  // edge, so requests never hit a serverless function. The server-side branch
  // exists for SSR/route-handler fallbacks.
  BASE_URL: (() => {
    if (typeof window !== 'undefined') {
      return '/api';
    }
    return (
      process.env.BACKEND_URL ||
      'https://grhog-api-production-0161.up.railway.app'
    ).replace(/\/$/, '');
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
      BIN_SUMMARY: '/dashboard/bin-summary',
      ACTIVE_CARDS: '/dashboard/active-cards',
      TOTAL_CARDS: '/dashboard/total-cards',
      CURRENT_USAGE: '/dashboard/current-usage',
      TOTAL_HOUSEHOLDS: '/dashboard/total-household',
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

// Returns the backend base URL normalized for server-side fetch:
// - strips a trailing slash so paths don't end up with `//`
// - prepends `https://` if the env var was set without a scheme
// Used by the /api/auth/* route handlers that proxy to the backend.
export const getBackendUrl = (): string => {
  const raw = (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://grhog-api-production-0161.up.railway.app'
  ).replace(/\/$/, '');
  return /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
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
