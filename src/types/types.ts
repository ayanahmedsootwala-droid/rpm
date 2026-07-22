export type UserRole = 'user' | 'admin' | 'dealership_manager' | 'dealership_staff' | 'dealership_salesperson' | 'dealership_viewer';

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dealership {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface DealershipMember {
  id: string;
  dealership_id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  profile?: Profile;
  dealership?: Dealership;
}

export interface CarBrand {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  display_order: number;
  country_of_origin?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CarModel {
  id: string;
  brand_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  brand?: CarBrand;
}

export interface CarVariant {
  id: string;
  model_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  model?: CarModel;
}

export type CarStatus = 'pending' | 'active' | 'sold' | 'reserved' | 'rejected' | 'pending_approval';

export interface Car {
  id: string;
  title: string;
  brand_id: string | null;
  model_id: string | null;
  variant_id: string | null;
  brand_name: string | null;
  model_name: string | null;
  variant_name: string | null;
  year: number;
  price: number;
  is_negotiable: boolean;
  mileage: number | null;
  condition: string | null;
  fuel_type: string | null;
  transmission: string | null;
  body_type: string | null;
  color: string | null;
  drive_type: string | null;
  doors: number | null;
  seating_capacity: number | null;
  cylinders: number | null;
  engine_size: string | null;
  engine_capacity: string | null;
  assembly: string | null;
  is_imported: boolean;
  registration_city: string | null;
  registration_year: number | null;
  city: string | null;
  description: string | null;
  features: string[] | null;
  images: string[] | null;
  status: CarStatus;
  is_featured: boolean;
  views: number;
  dealership_id: string | null;
  dealership_name: string | null;
  seller_id: string | null;
  location: string | null;
  show_contact_type: string;
  registration_number?: string | null;
  chassis_number?: string | null;
  created_at: string;
  updated_at: string;
  dealership?: Dealership;
  seller?: Profile;
  brand?: CarBrand;
}

export interface CarVersionHistory {
  id: string;
  car_id: string;
  user_id: string | null;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Inquiry {
  id: string;
  car_id: string | null;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  // aliases used by DealershipLeads
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string | null;
  message: string;
  notes?: string | null;
  status: 'new' | 'responded' | 'closed' | 'in_progress' | 'converted';
  created_at: string;
  updated_at: string;
  car?: Car;
}

export interface Wishlist {
  id: string;
  user_id: string;
  car_id: string;
  created_at: string;
  car?: Car;
}

export type AuctionStatus = 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled';

export interface Auction {
  id: string;
  car_id: string;
  title: string;
  description: string | null;
  starting_bid: number;
  starting_price: number | null;
  reserve_price: number | null;
  bid_increment: number;
  deposit_amount: number;
  current_bid: number | null;
  current_price: number | null;
  winning_bidder_id: string | null;
  status: AuctionStatus;
  start_time: string;
  end_time: string;
  streaming_url: string | null;
  car_images: string[] | null;
  created_at: string;
  updated_at: string;
  car?: Car;
  winning_bidder?: Profile;
  _bid_count?: number;
}

export interface Bid {
  id: string;
  auction_id: string;
  user_id: string;
  amount: number;
  is_auto_bid: boolean;
  max_bid_amount: number | null;
  created_at: string;
  profile?: Profile;
}

export type DepositStatus = 'pending' | 'approved' | 'refunded';

export interface AuctionDeposit {
  id: string;
  auction_id: string;
  user_id: string;
  amount: number;
  status: DepositStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  auction?: Auction;
}

export interface AuctionWatchlist {
  id: string;
  user_id: string;
  auction_id: string;
  created_at: string;
  auction?: Auction;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  image_url: string | null;
  featured_image: string | null;
  category: string | null;
  author_id: string | null;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  customer_title: string | null;
  customer_photo_url: string | null;
  avatar_url: string | null;
  testimonial_text: string;
  content: string | null;
  author_name: string | null;
  author_title: string | null;
  rating: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

export interface SeoSetting {
  id: string;
  page: string;
  page_key: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  updated_at: string;
}

export interface BrandCarousel {
  id: string;
  brand_name: string;
  logo_url: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomepageSection {
  id: string;
  section_key: string;
  label: string;
  title: string | null;
  is_visible: boolean;
  is_active: boolean;
  display_order: number;
  updated_at: string;
}

export interface DealershipActivityLog {
  id: string;
  dealership_id: string | null;
  user_id: string | null;
  action: string;
  description: string | null;
  created_at: string;
  profile?: Profile;
}

export interface VehicleDbVersionHistory {
  id: string;
  entity_type: 'brand' | 'model' | 'variant';
  entity_id: string;
  user_id: string | null;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  profile?: Profile;
}

// Filter types
export interface CarFilters {
  make?: string;
  model?: string;
  variant?: string;
  brand_id?: string;
  model_id?: string;
  variant_id?: string;
  listing_type?: string;
  minPrice?: number;
  maxPrice?: number;
  price_min?: number;
  price_max?: number;
  minYear?: number;
  maxYear?: number;
  year_min?: number;
  year_max?: number;
  minMileage?: number;
  maxMileage?: number;
  city?: string;
  condition?: string;
  fuelType?: string;
  fuel_type?: string;
  transmission?: string;
  color?: string;
  bodyType?: string;
  body_type?: string;
  driveType?: string;
  assembly?: string;
  search?: string;
  status?: CarStatus;
  sortBy?: 'latest' | 'price_asc' | 'price_desc' | 'views';
  limit?: number;
  offset?: number;
}

export interface AuctionFilters {
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  status?: AuctionStatus;
  reserveMet?: boolean;
  sortBy?: 'ending_soon' | 'newest' | 'bid_asc' | 'bid_desc';
  limit?: number;
}

// Language
export type Language = 'en' | 'ur';

export interface Translations {
  [key: string]: string;
}
