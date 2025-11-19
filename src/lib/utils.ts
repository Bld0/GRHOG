import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate battery percentage from voltage string using Li-ion discharge curve
 * @param batteryLevel - Voltage string like "10.95 V"
 * @param initialCapacity - Initial battery capacity in volts (default: 12.6 for 3S Li-ion)
 * @returns Battery percentage (0-100)
 */
export function calculateBatteryPercentage(batteryLevel: string | null, initialCapacity: number = 12.6): number {
  if (!batteryLevel) return 0;
  
  // Extract voltage value from "10.95 V" format
  const voltageMatch = batteryLevel.match(/(\d+\.?\d*)/);
  if (!voltageMatch) return 0;
  
  const currentVoltage = parseFloat(voltageMatch[1]);
  
  // Li-ion 3S battery voltage-to-percentage lookup table
  // Based on standard Li-ion discharge curve (12.6V nominal when fully charged)
  const voltageTable = [
    { voltage: 12.60, percentage: 100 },
    { voltage: 12.40, percentage: 90 },
    { voltage: 12.20, percentage: 80 },
    { voltage: 12.00, percentage: 70 },
    { voltage: 11.80, percentage: 60 },
    { voltage: 11.60, percentage: 50 },
    { voltage: 11.40, percentage: 40 },
    { voltage: 11.20, percentage: 30 },
    { voltage: 11.00, percentage: 20 },
    { voltage: 10.80, percentage: 10 },
    { voltage: 10.50, percentage: 5 },
    { voltage: 9.00, percentage: 0 }   // Deep discharge protection
  ];
  
  // Handle voltages above maximum
  if (currentVoltage >= voltageTable[0].voltage) {
    return 100;
  }
  
  // Handle voltages below minimum (deep discharge)
  if (currentVoltage <= voltageTable[voltageTable.length - 1].voltage) {
    return 0;
  }
  
  // Find the two closest voltage points for interpolation
  for (let i = 0; i < voltageTable.length - 1; i++) {
    const upper = voltageTable[i];
    const lower = voltageTable[i + 1];
    
    if (currentVoltage <= upper.voltage && currentVoltage >= lower.voltage) {
      // Linear interpolation between the two points
      const voltageRange = upper.voltage - lower.voltage;
      const percentageRange = upper.percentage - lower.percentage;
      const voltageOffset = currentVoltage - lower.voltage;
      
      const interpolatedPercentage = lower.percentage + (voltageOffset / voltageRange) * percentageRange;
      return Math.round(interpolatedPercentage * 10) / 10; // Round to 1 decimal place
    }
  }
  
  return 0;
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: 'accurate' | 'normal';
  } = {}
) {
  const { decimals = 0, sizeType = 'normal' } = opts;

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === 'accurate'
      ? (accurateSizes[i] ?? 'Bytest')
      : (sizes[i] ?? 'Bytes')
  }`;
}

/**
 * Normalizes storage level from the range 30-100 to 0-100
 * @param storageLevel - The original storage level (30-100)
 * @returns The normalized storage level (0-100)
 */
export function normalizeStorageLevel(storageLevel: number): number {
  if (storageLevel === null || storageLevel === undefined || storageLevel === -1) {
    return 0;
  }
  
  // Map 30-100 to 0-100
  // Formula: (value - min) / (max - min) * new_max
  // (storageLevel - 30) / (100 - 30) * 100
  const normalized = ((storageLevel - 30) / 70) * 100;
  
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, normalized));
}
