import { faker } from '@faker-js/faker';

// Waste Management System Types
export interface Bin {
  id: string;
  location: string;
  khoroolol: 'А' | 'Б' | 'В'; // Хороолол А/Б/В
  fillPercentage: number;
  weight: number;
  batteryLevel: number;
  lastEmptied: Date;
  doorState: 'open' | 'closed';
  nfcReaderStatus: 'active' | 'inactive';
  isOnline: boolean;
  coordinates: { lat: number; lng: number };
}

export interface Resident {
  id: string;
  name: string;
  apartment: string;
  cardId: string; // NFC Card ID
  monthlyTrashTotal: number; // kg
  totalAccess: number;
  lastActivity: Date;
  status: 'active' | 'blocked';
  khoroolol: 'А' | 'Б' | 'В';
  registeredDate: Date;
}

export interface Transaction {
  id: string;
  date: Date;
  residentName: string;
  residentId: string;
  binId: string;
  binLocation: string;
  addedWeight: number; // kg
  totalBinWeight: number; // kg
  doorOpenDuration: number; // seconds
  actionLogs: string[];
}

export interface AnalyticsData {
  totalBins: number;
  onlineBins: number;
  averageFillLevel: number;
  todayWaste: number;
  activeUsers: number;
  totalUsers: number;
  fillLevelHistory: {
    date: string;
    khoroolol_a: number;
    khoroolol_b: number;
    khoroolol_v: number;
    total: number;
  }[];
  collectionTrends: {
    month: string;
    collection: number;
    recycling: number;
  }[];
  wasteDistribution: {
    khoroolol: string;
    amount: number;
    percentage: number;
    fill: string;
  }[];
}

// Generate mock data
export const generateBinData = (): Bin[] => {
  const locations = [
    'Хороолол А - 1-р байр',
    'Хороолол А - 5-р байр',
    'Хороолол Б - 3-р байр',
    'Хороолол Б - 7-р байр',
    'Хороолол В - 2-р байр'
  ];
  
  const khoroolols: ('А' | 'Б' | 'В')[] = ['А', 'А', 'Б', 'Б', 'В'];

  return locations.map((location, index) => ({
    id: `BIN-${String(index + 1).padStart(3, '0')}`,
    location,
    khoroolol: khoroolols[index],
    fillPercentage: Math.floor(Math.random() * 100),
    weight: parseFloat((Math.random() * 50 + 10).toFixed(1)),
    batteryLevel: Math.floor(Math.random() * 100),
    lastEmptied: faker.date.recent({ days: 7 }),
    doorState: Math.random() > 0.8 ? 'open' : 'closed',
    nfcReaderStatus: Math.random() > 0.1 ? 'active' : 'inactive',
    isOnline: Math.random() > 0.2,
    coordinates: {
      lat: 47.9077 + (Math.random() - 0.5) * 0.01,
      lng: 106.8832 + (Math.random() - 0.5) * 0.01
    }
  }));
};

export const generateResidentData = (): Resident[] => {
  const mongolianNames = [
    'Батбаяр', 'Оюунчимэг', 'Төмөрбаатар', 'Сайханбилэг', 'Энхтуяа',
    'Бямбасүрэн', 'Сэрэгдорж', 'Цэцэгмаа', 'Батчимэг', 'Дашдорж',
    'Мөнхбаяр', 'Алтанцэцэг', 'Баянмөнх', 'Цагаанбаатар', 'Сувдаа'
  ];

  return Array.from({ length: 127 }, (_, index) => ({
    id: `RES-${String(index + 1).padStart(3, '0')}`,
    name: faker.helpers.arrayElement(mongolianNames),
    apartment: `${Math.floor(Math.random() * 20) + 1}-${Math.floor(Math.random() * 50) + 1}`,
    cardId: faker.string.alphanumeric(8).toUpperCase(),
    monthlyTrashTotal: parseFloat((Math.random() * 30 + 5).toFixed(1)),
    totalAccess: Math.floor(Math.random() * 50 + 1),
    lastActivity: faker.date.recent({ days: 30 }),
    status: Math.random() > 0.05 ? 'active' : 'blocked',
    khoroolol: faker.helpers.arrayElement(['А', 'Б', 'В']),
    registeredDate: faker.date.past({ years: 2 })
  }));
};

export const generateTransactionData = (residents: Resident[], bins: Bin[]): Transaction[] => {
  return Array.from({ length: 500 }, (_, index) => {
    const resident = faker.helpers.arrayElement(residents);
    const bin = faker.helpers.arrayElement(bins);
    const addedWeight = parseFloat((Math.random() * 5 + 0.5).toFixed(1));
    
    return {
      id: `TXN-${String(index + 1).padStart(4, '0')}`,
      date: faker.date.recent({ days: 30 }),
      residentName: resident.name,
      residentId: resident.id,
      binId: bin.id,
      binLocation: bin.location,
      addedWeight,
      totalBinWeight: bin.weight + addedWeight,
      doorOpenDuration: Math.floor(Math.random() * 30 + 5),
      actionLogs: [
        'NFC card scanned',
        'Door opened',
        'Waste deposited',
        Math.random() > 0.8 ? 'Weight sensor triggered' : '',
        'Door closed'
      ].filter(Boolean)
    };
  });
};

// Generate 15-day historical data
export const generateFillLevelHistory = () => {
  return Array.from({ length: 15 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (14 - index));
    
    const khoroolol_a = Math.floor(Math.random() * 40 + 30);
    const khoroolol_b = Math.floor(Math.random() * 50 + 40);
    const khoroolol_v = Math.floor(Math.random() * 35 + 25);
    
    return {
      date: date.toISOString().split('T')[0],
      khoroolol_a,
      khoroolol_b,
      khoroolol_v,
      total: Math.floor((khoroolol_a + khoroolol_b + khoroolol_v) / 3)
    };
  });
};

// Generate collection trends for last 6 months
export const generateCollectionTrends = () => {
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'];
  
  return months.map(month => ({
    month,
    collection: Math.floor(Math.random() * 200 + 100),
    recycling: Math.floor(Math.random() * 50 + 20)
  }));
};

// Initialize mock data
export const binsData = generateBinData();
export const residentsData = generateResidentData();
export const transactionsData = generateTransactionData(residentsData, binsData);

export const analyticsData: AnalyticsData = {
  totalBins: binsData.length,
  onlineBins: binsData.filter(bin => bin.isOnline).length,
  averageFillLevel: parseFloat((binsData.reduce((sum, bin) => sum + bin.fillPercentage, 0) / binsData.length).toFixed(1)),
  todayWaste: parseFloat((Math.random() * 10 + 2).toFixed(1)),
  activeUsers: residentsData.filter(r => r.status === 'active' && r.lastActivity > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
  totalUsers: residentsData.length,
  fillLevelHistory: generateFillLevelHistory(),
  collectionTrends: generateCollectionTrends(),
  wasteDistribution: [
    { khoroolol: 'Хороолол А', amount: 120, percentage: 35, fill: 'var(--color-khoroolol-a)' },
    { khoroolol: 'Хороолол Б', amount: 180, percentage: 45, fill: 'var(--color-khoroolol-b)' },
    { khoroolol: 'Хороолол В', amount: 100, percentage: 20, fill: 'var(--color-khoroolol-v)' }
  ]
};

// Recent transactions (last 5)
export const recentTransactions = transactionsData
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 5); 