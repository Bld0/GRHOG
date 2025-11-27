import { Icons } from '@/components/icons';

export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
  requiresRole?: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER'; // Role requirement for menu items
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;

// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserPermissions {
  canGet: boolean;
  canPost: boolean;
  canPut: boolean;
  canDelete: boolean;
  canViewAllData: boolean;
  canManageBins: boolean;
  canManageClients: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canViewDashboard: boolean;
  canViewTransactions: boolean;
  canViewReports: boolean;
}

export interface UserConfig {
  showUserManagement: boolean;
  showBinManagement: boolean;
  showClientManagement: boolean;
  showAnalytics: boolean;
  showDashboard: boolean;
  showTransactions: boolean;
  showReports: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canCreateBins: boolean;
  canEditBins: boolean;
  canDeleteBins: boolean;
  canCreateClients: boolean;
  canEditClients: boolean;
  canDeleteClients: boolean;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
  isActive?: boolean;
  active?: boolean;
  permissions: UserPermissions;
  config: UserConfig;
}

// User management types
export interface User {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
  createdAt: string;
  updatedAt: string | null;
}

// Waste Management API Types
export interface Bin {
  id: number;
  binId: string | null;
  binName: string | null;
  storageLevel: number;
  latitude: number;
  longitude: number;
  location: string | null;
  createdAt: string;
  updatedAt: string | null;
  batteryLevel: string | null;
  clearedAt: string | null;
  isActive: boolean;
  active?: boolean; // Add 'active' field for API compatibility
  storageLevelBeforeClear: number;
  lastEmptied: string | null;
  lastEmptyFillLevel: number;
  type: string;
  serialNumber: string | null;
  installDate: string | null;
  usageCount?: number;
  penetration?: number;
  penetrationsSinceLastClear?: number;
  // New battery and storage tracking fields
  initialBatteryCapacity?: number;
  currentBatteryCapacity?: number;
  storageHeight?: number;
  lastIoTActivity?: string;
  // Percentage fields from backend
  storageLevelPercent?: number;
  batteryLevelPercent?: number;
  storageLevelBeforeClearPercent?: number;
  // Location details
  district?: string | null;
  khoroo?: number | null;
}

// Grouped bins by district and khoroo
export interface DistrictKhorooGroup {
  district: string;
  khoroo: number;
  location: string | null;
  activeBinsCount: number;
  avgStorageLevelPercent: number;
  totalPenetrationsSinceLastClear: number;
  avgBatteryLevelPercent: number;
  lastEmptied: string | null;
  bins: Bin[];
}

export interface Client {
  id: number;
  email: string | null;
  name: string | null;
  phone: string | null;
  address: string | null;
  cardId: string;
  cardIdDec: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  cardUsedAt: string | null;
  totalAccess: number;
  // New address fields
  district: string | null;
  khoroo: number | null;
  streetBuilding: string | null;
  apartmentNumber: number | null;
  // New client type field
  type: 'ААНБ' | 'СӨХ' | 'Айл' | 'Ажилтан' | null;
}

export interface BinUsage {
  id: number;
  bin: Bin;
  cardId: string;
  cardIdDec: string | null;
  clientName: string | null;
  clientType: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  createdAt: string;
  batteryLevel: string | null;
  storageLevel: number;
  // Percentage fields from backend
  storageLevelPercent?: number;
  batteryLevelPercent?: number;
}

// New types for clearing functionality
export interface BinClearing {
  id: number;
  bin: Bin;
  clearedAt: string;
  fillLevelBeforeClear: number;
  penetrationCount: number | null;
  createdAt: string;
  // Percentage fields from backend
  fillLevelBeforeClearPercent?: number;
}

export interface BinStatistics {
  totalBins: number;
  onlineBins: number;
  offlineBins: number;
  averageFillLevel: number;
  criticalBins: number;
  warningBins: number;
  normalBins: number;
  totalClearings: number;
  averageClearingsPerDay: number;
  penetrationRate: number;
}

export interface UsageStatistics {
  totalUsages: number;
  uniqueUsers: number;
  averageUsagesPerDay: number;
  usageTrend: Array<{
    date: string;
    usages: number;
    uniqueUsers: number;
  }>;
  topUsedBins: Array<{
    binId: string;
    usageCount: number;
  }>;
}

export interface PenetrationAnalysis {
  averagePenetration: number;
  highPenetrationBins: number;
  mediumPenetrationBins: number;
  lowPenetrationBins: number;
  penetrationByLocation: Array<{
    location: string;
    averagePenetration: number;
    binCount: number;
  }>;
}

export interface ClearingEfficiency {
  averageFillLevelBeforeClear: number;
  optimalClearings: number;
  overdueClearings: number;
  prematureClearings: number;
  efficiencyScore: number;
  clearingsByPeriod: Array<{
    period: string;
    totalClearings: number;
    averageFillLevel: number;
  }>;
}

export interface ClientActivity {
  cardId: string;
  clientName: string;
  totalAccess: number;
  uniqueBins: number;
  accessesPerDay: number;
  recentAccess: number;
  lastAccess: string | null;
  activityHistory: Array<{
    id: number;
    binId: string;
    binLocation: string | null;
    createdAt: string;
    storageLevel: number;
  }>;
}

export interface DashboardActiveBins {
  active: number;
  total: number;
}

export interface DashboardTotalCards {
  type: string;
  count: number;
}

export interface DashboardCurrentUsage {
  'usage-today': number;
  'usage-prev-day': number;
  difference: number;
}

export interface DashboardAverageFilling {
  'filling-today': number;
  'filling-prev-day': number;
  changes: number;
}

export interface CollectionTrend {
  month: string;
  collection: number;
  recycling: number;
  storageLevel: number;
  clearings: number;
}

export interface CollectionTrends {
  trends: CollectionTrend[];
  totalCollection: number;
  totalRecycling: number;
}

export interface BinStatusDistribution {
  status: string;
  count: number;
  color: string;
}

export interface BinStatusDistributionData {
  distribution: BinStatusDistribution[];
  total: number;
}

export interface DailyUsageTrend {
  day: string;
  usages: number;
  storageLevel: number;
}

export interface DailyUsageTrendData {
  dailyTrend: DailyUsageTrend[];
  totalUsages: number;
  avgStorageLevel: number;
}

export interface LocationStats {
  location: string;
  totalBins: number;
  activeBins: number;
  avgFillLevel: number;
}

export interface LocationStatsData {
  locationStats: LocationStats[];
  totalLocations: number;
}

export interface TotalHouseholdsData {
  totalHouseholds: number;
  ailHouseholds: number;
  sokhHouseholds: number;
  aanbHouseholds: number;
  ajiltanHouseholds: number;
  nullTypeHouseholds: number;
}
