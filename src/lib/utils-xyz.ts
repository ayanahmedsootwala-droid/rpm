// Format currency in PKR
export const formatCurrency = (amount: number | null | undefined): string => {
  const n = amount ?? 0;
  if (n >= 10000000) return `PKR ${(n / 10000000).toFixed(2)} Crore`;
  if (n >= 100000) return `PKR ${(n / 100000).toFixed(2)} Lac`;
  return `PKR ${n.toLocaleString('en-US')}`;
};

// Format mileage
export const formatMileage = (km: number | null | undefined): string => km != null ? `${km.toLocaleString('en-US')} km` : 'N/A';

// Format date
export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Format countdown
export const formatCountdown = (endTime: string): { days: number; hours: number; minutes: number; seconds: number; isEnded: boolean } => {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, isEnded: false };
};

// Generate slug
export const generateSlug = (text: string): string =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Truncate text
export const truncate = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;

// Get car title
export const getCarTitle = (car: { brand_name?: string | null; model_name?: string | null; year?: number; title?: string }): string => {
  if (car.brand_name && car.model_name) return `${car.year} ${car.brand_name} ${car.model_name}`;
  return car.title || 'Vehicle';
};

// Pakistani cities
export const PAKISTANI_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana',
  'Sheikhupura', 'Rahim Yar Khan', 'Jhang', 'Dera Ghazi Khan', 'Gujrat',
];

// Body types
export const BODY_TYPES = [
  'Sedan', 'SUV', 'Hatchback', 'Pickup', 'Van', 'MPV', 'Coupe',
  'Convertible', 'Crossover', 'Truck', 'Minivan', 'Wagon', 'Other',
];

// Fuel types
export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG', 'LPG', 'Other'];

// Transmission types
export const TRANSMISSION_TYPES = ['Automatic', 'Manual', 'CVT', 'Semi-Automatic', 'Other'];

// Conditions
export const CONDITIONS = ['New', 'Used', 'Certified Pre-Owned', 'Salvage', 'Other'];

// Drive types
export const DRIVE_TYPES = ['2WD', '4WD', 'AWD', 'FWD', 'RWD', 'Other'];

// Colors
export const COLORS = [
  'White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green',
  'Brown', 'Beige', 'Gold', 'Orange', 'Yellow', 'Purple', 'Other',
];

// Assembly types
export const ASSEMBLY_TYPES = ['Local', 'Imported'];

// Car features
export const CAR_FEATURES = [
  'Air Conditioning', 'Power Steering', 'Power Windows', 'ABS Brakes',
  'Airbags', 'Alloy Wheels', 'Bluetooth', 'Backup Camera',
  'Cruise Control', 'Fog Lights', 'Heated Seats', 'Keyless Entry',
  'Navigation System', 'Parking Sensors', 'Push Start Button',
  'Sunroof', 'Leather Seats', 'USB Port', 'Apple CarPlay',
  'Android Auto', 'Lane Assist', 'Blind Spot Monitor', 'Roof Rails',
];

// Years
export const YEARS = Array.from({ length: 27 }, (_, i) => 2026 - i);

// Doors options
export const DOORS_OPTIONS = [2, 3, 4, 5];

// Cylinders
export const CYLINDER_OPTIONS = [2, 3, 4, 6, 8, 10, 12];

// Seating capacity
export const SEATING_CAPACITY = [2, 4, 5, 6, 7, 8, 9, 10, 12];

// Get status color
export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    sold: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    reserved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    rejected: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
    draft: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ended: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    new: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    responded: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    refunded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return map[status] || 'bg-muted text-muted-foreground';
};

/** Returns a translation key for a car/listing status (pass to t()) */
export const getStatusLabelKey = (status: string): string => {
  const map: Record<string, string> = {
    active: 'active',
    sold: 'sold',
    reserved: 'reserved',
    pending: 'pending',
    pending_approval: 'pendingApproval',
    inactive: 'inactive',
    rejected: 'rejected',
    draft: 'draft',
    approved: 'approved',
    scheduled: 'scheduled',
    ended: 'ended',
  };
  return map[status] || status;
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// Download CSV
export const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Upload file to Supabase storage
export const getPublicUrl = (supabase: { storage: { from: (bucket: string) => { getPublicUrl: (path: string) => { data: { publicUrl: string } } } } }, bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};


// Format number to Pakistani lac/crore notation for live display
export function formatPKRWords(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (!n || isNaN(n)) return '';
  if (n >= 10000000) {
    const crore = n / 10000000;
    return `${crore % 1 === 0 ? crore : crore.toFixed(2)} Crore`;
  }
  if (n >= 100000) {
    const lac = n / 100000;
    return `${lac % 1 === 0 ? lac : lac.toFixed(2)} Lac`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)} Thousand`;
  }
  return n.toLocaleString('en-US');
}

// Engine capacity options
export const ENGINE_CAPACITIES = [
  '660cc', '800cc', '1000cc', '1200cc', '1300cc', '1400cc', '1500cc',
  '1600cc', '1800cc', '2000cc', '2400cc', '2700cc', '2800cc', '3000cc',
  '3500cc', '4000cc', '4500cc', '5000cc', 'Other'
];

// Registration years
// Registration years — 'Unregistered' is always first
export const REG_YEARS_LIST = ['Unregistered', ...Array.from({ length: 31 }, (_, i) => String(2026 - i))];
export const REG_YEARS = Array.from({ length: 31 }, (_, i) => 2026 - i);
