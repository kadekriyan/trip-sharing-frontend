export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";
export type GroupStatus = "open" | "waiting" | "full" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type DriverStatus = "active" | "on_duty" | "off_duty" | "inactive" | "available" | "on_trip";
export type CheckInStatus = "pending" | "checked_in" | "no_show" | "cancelled";

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
}

export interface Destination {
  id: string;
  title: string;
  name?: string;
  slug: string;
  tagline: string;
  description: string;
  shortDescription?: string;
  category?: string;
  location: string;
  durationDays: number;
  durationNights: number;
  pricePerPax: number;
  priceTransportOnly?: number;
  price_transport_only?: number;
  priceTransport?: number;
  priceAllIn?: number;
  price?: number;
  basePrice?: number;
  coverImage: string;
  image?: string;
  imageUrl?: string;
  galleryImages: string[];
  inclusions: string[];
  includedFacilities?: string[];
  exclusions: string[];
  excludedFacilities?: string[];
  highlights: string[];
  itinerary: ItineraryDay[];
  rating: number;
  totalReviews: number;
  isPopular?: boolean;
  isActive?: boolean;
  meetingPoint: string;
  maxGroupCapacity: number; // 6
  currentParticipants?: number;
  maxParticipants?: number;
  trips?: Trip[];
  activeTrips?: Trip[];
  totalTrips?: number;
  tripsCount?: number;
  // Dynamic SEO Fields (Optional Overrides)
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  seoOgImage?: string | null;
  customSchemaJson?: string | null;
  noIndex?: boolean;
  isUnlisted?: boolean;
  is_unlisted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Area {
  id: string;
  name: string;
  slug: string;
  city?: string;
  province?: string;
  description?: string;
  isActive?: boolean;
  is_active?: boolean;
  driversCount?: number;
  vehiclesCount?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface CreateAreaPayload {
  name: string;
  slug?: string;
  city?: string;
  province?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateAreaPayload {
  name?: string;
  slug?: string;
  city?: string;
  province?: string;
  description?: string;
  isActive?: boolean;
}

export type VehicleStatus = "active" | "maintenance" | "inactive";

export interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  plate_number?: string;
  vehicleType: string;
  vehicle_type?: string;
  capacity: number; // 6
  transmission?: string;
  fuelType?: string;
  fuel_type?: string;
  facility?: string[];
  coverImage?: string;
  cover_image?: string;
  status: VehicleStatus | string;
  isAvailable?: boolean;
  is_available?: boolean;
  areaId?: string | null;
  area_id?: string | null;
  area?: Area | null;
  driverId?: string | null;
  driver_id?: string | null;
  driver?: Driver | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface BookingGroup {
  id: string;
  tripId: string;
  trip?: Trip;
  groupNumber: number;
  capacity: number; // Max 6
  maxParticipants?: number;
  currentParticipants: number;
  pricePerPerson?: number;
  totalPrice?: number;
  status: GroupStatus;
  driverId?: string | null;
  driver?: Driver | null;
  vehicleId?: string | null;
  vehicle?: Vehicle | null;
  name?: string;
  notes?: string;
  participants?: Participant[];
  createdAt: string;
  updatedAt: string;
}

export type TripStatus =
  | "planning"
  | "published"
  | "scheduled"
  | "active"
  | "ongoing"
  | "departed"
  | "completed"
  | "cancelled";

export interface TripGuide {
  id: string;
  name: string;
  phone?: string;
  phoneNumber?: string;
}

export interface Trip {
  id: string;
  destinationId: string;
  destination_id?: string;
  destination?: Destination;
  departureDate: string;
  departure_date?: string;
  returnDate: string;
  return_date?: string;
  pricePerPax: number;
  maxGroups?: number;
  maxParticipants?: number;
  max_participants?: number;
  currentParticipants?: number;
  current_participants?: number;
  guideId?: string | null;
  guide_id?: string | null;
  guide?: TripGuide | Driver | null;
  status: TripStatus;
  notes?: string;
  groups: BookingGroup[];
  booking_groups?: BookingGroup[];
  participants?: Participant[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface Participant {
  id: string;
  tripId: string;
  trip?: Trip;
  destinationId?: string;
  destination?: Destination;
  bookingGroupId: string;
  bookingGroup?: BookingGroup;
  group?: BookingGroup;
  fullName: string;
  full_name?: string;
  email: string;
  phoneNumber: string;
  phone_number?: string;
  nationality: string;
  identityNumber?: string;
  identity_number?: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  roomPreference?: "single" | "shared" | "none" | string;
  room_preference?: "single" | "shared" | "none" | string;
  healthNotes?: string;
  health_notes?: string;
  pickupLocation?: string;
  pickup_location?: string;
  pickupLatitude?: number;
  pickup_latitude?: number;
  pickupLongitude?: number;
  pickup_longitude?: number;
  pickupNotes?: string;
  pickup_notes?: string;
  departureDate?: string;
  departure_date?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  hasInsurance?: boolean;
  has_insurance?: boolean;
  insuranceFee?: number;
  insurance_fee?: number;
  packageType?: "ALL_IN" | "TRANSPORT_ONLY" | string;
  package_type?: string;
  serviceType?: string;
  totalAmount: number;
  total_amount?: number;
  paymentStatus: PaymentStatus;
  payment_status?: PaymentStatus;
  checkInStatus: CheckInStatus;
  check_in_status?: CheckInStatus;
  paymentId?: string;
  payment?: Payment;
  bookingCode: string;
  booking_code?: string;
  voucherQrCode?: string;
  voucher_qr_code?: string;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface Driver {
  id: string;
  userId?: string;
  user_id?: string;
  fullName: string;
  name?: string;
  phoneNumber: string;
  phone?: string;
  email?: string;
  licenseNumber: string;
  license_number?: string;
  licenseExpiryDate?: string | null;
  license_expiry_date?: string | null;
  licenseExpiry?: string | null;
  activeStartDate?: string | null;
  active_start_date?: string | null;
  activeEndDate?: string | null;
  active_end_date?: string | null;
  inactiveStartDate?: string | null;
  inactive_start_date?: string | null;
  inactiveEndDate?: string | null;
  inactive_end_date?: string | null;
  rating: number;
  totalTrips?: number;
  total_trips?: number;
  isAvailable?: boolean;
  is_available?: boolean;
  rawIsAvailable?: boolean;
  status: DriverStatus;
  rawStatus?: string;
  statusReason?: string | null;
  evaluationDate?: string | null;
  areaId?: string | null;
  area_id?: string | null;
  area?: Area | null;
  vehicleId?: string | null;
  vehicle_id?: string | null;
  vehicle?: Vehicle | null;
  // Legacy compatibility fields
  vehicleModel?: string;
  vehicleType?: string;
  plateNumber?: string;
  vehiclePlat?: string;
  passengerCapacity?: number; // 6
  photoUrl?: string;
  photo_url?: string;
  notes?: string;
  user?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    profileImageUrl?: string;
  };
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  participantId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  snapToken?: string;
  redirectUrl?: string;
  paymentMethod?: "qris" | "bank_transfer" | "credit_card" | "gopay" | "cstore";
  orderId?: string;
  paidAt?: string;
  transactionTime?: string;
  settlementTime?: string;
  externalTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: "Travel Tips" | "Destinations" | "Community Story" | "Budget Travel" | "Guide" | string;
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
  authorName?: string;
  authorAvatar?: string;
  authorRole?: string;
  readTimeMinutes?: number;
  readTime?: string;
  publishedAt: string;
  views?: number;
  viewCount?: number;
  isPublished?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  seoOgImage?: string | null;
  customSchemaJson?: string | null;
  noIndex?: boolean;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PageSeoItem {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
}

export type PageSeoSettingsMap = Record<string, PageSeoItem>;

export interface GlobalSeoSettings {
  id?: string;
  siteTitleDefault: string;
  siteTitleTemplate: string;
  metaDescription: string;
  keywords: string[];
  defaultOgImage: string;
  googleVerificationTag?: string | null;
  organizationSchemaJson?: string | null;
  robotsIndex: boolean;
  pageSeoSettings?: PageSeoSettingsMap | null;
  page_seo_settings?: PageSeoSettingsMap | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSeoSettingsPayload {
  siteTitleDefault: string;
  siteTitleTemplate: string;
  metaDescription: string;
  keywords: string[];
  defaultOgImage: string;
  googleVerificationTag?: string | null;
  organizationSchemaJson?: string | null;
  robotsIndex: boolean;
  pageSeoSettings?: PageSeoSettingsMap | null;
  page_seo_settings?: PageSeoSettingsMap | null;
}



export interface AuditLog {
  id: string;
  adminEmail: string;
  action: "MOVE_PARTICIPANT" | "CREATE_DESTINATION" | "UPDATE_TRIP" | "CREATE_DRIVER" | "UPDATE_PAYMENT" | "DELETE_RECORD";
  targetResource: string;
  targetId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AdminMetrics {
  totalRevenue: number;
  revenueGrowthPercentage: number;
  activeTripsCount: number;
  averageOccupancyRate: number; // e.g. 84.5%
  totalParticipants: number;
  totalBookings: number;
  availableSeats: number;
  pendingPaymentsCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface CreateBookingPayload {
  tripId: string;
  destinationId: string;
  bookingGroupId?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  identityNumber?: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  roomPreference?: "single" | "shared" | "none" | string;
  healthNotes?: string;
  pickupLocation?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  pickupNotes?: string;
  hasInsurance?: boolean;
  packageType?: "ALL_IN" | "TRANSPORT_ONLY" | string;
  package_type?: string;
  captchaToken?: string;
  departureDate?: string;
}

export type BulkBookingItemPayload = Omit<CreateBookingPayload, "captchaToken">;

export interface BulkBookingPayload {
  captchaToken?: string;
  bookings: BulkBookingItemPayload[];
}

export interface BulkBookingResponse {
  bulkBookingId?: string;
  totalAmount: number;
  paymentStatus: string;
  participants: Participant[];
  payment?: Payment & {
    snapToken?: string;
    redirectUrl?: string;
    orderId?: string;
  };
}

export interface CreateTripPayload {
  destinationId: string;
  destination_id?: string;
  departureDate: string;
  departure_date?: string;
  returnDate: string;
  return_date?: string;
  maxParticipants?: number;
  max_participants?: number;
  guideId?: string | null;
  guide_id?: string | null;
  pricePerPax?: number;
  maxGroups?: number;
  initialDriverId?: string;
  status?: TripStatus;
  notes?: string;
}

export interface UpdateTripPayload {
  destinationId?: string;
  destination_id?: string;
  departureDate?: string;
  departure_date?: string;
  returnDate?: string;
  return_date?: string;
  pricePerPax?: number;
  maxGroups?: number;
  maxParticipants?: number;
  max_participants?: number;
  guideId?: string | null;
  guide_id?: string | null;
  status?: TripStatus;
  notes?: string;
}

export interface MoveParticipantPayload {
  participantId: string;
  currentGroupId: string;
  targetGroupId: string;
  currentTripId?: string;
  targetTripId?: string;
  reason?: string;
}

export interface CreateBookingGroupPayload {
  tripId: string;
  driverId?: string | null;
  vehicleId?: string | null;
  groupNumber?: number;
  maxParticipants?: number;
  capacity?: number;
  pricePerPerson?: number;
  status?: GroupStatus;
}

export interface UpdateBookingGroupPayload {
  maxParticipants?: number;
  capacity?: number;
  status?: GroupStatus;
  pricePerPerson?: number;
  driverId?: string | null;
  vehicleId?: string | null;
  groupNumber?: number;
}

export interface CreateVehiclePayload {
  name: string;
  plateNumber: string;
  vehicleType?: string;
  capacity?: number;
  transmission?: string;
  fuelType?: string;
  facility?: string[];
  coverImage?: string;
  status?: VehicleStatus | string;
  isAvailable?: boolean;
  areaId?: string | null;
  driverId?: string | null;
}

export interface UpdateVehiclePayload {
  name?: string;
  plateNumber?: string;
  vehicleType?: string;
  capacity?: number;
  transmission?: string;
  fuelType?: string;
  facility?: string[];
  coverImage?: string;
  status?: VehicleStatus | string;
  isAvailable?: boolean;
  areaId?: string | null;
  driverId?: string | null;
}

export interface AssignVehiclePayload {
  vehicleId: string | null;
}

export interface AssignDriverPayload {
  driverId: string | null;
}

export type UserRole = "admin" | "participant" | "traveler";

export interface User {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  phoneNumber?: string;
  nationality?: string;
  identityNumber?: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface InvoiceItem {
  itemNumber: number;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  invoice: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    paidAt: string | null;
    status: "PAID" | "PENDING" | "CANCELLED" | "REFUNDED" | string;
    paymentStatus: string;
    checkInStatus: string;
    bookingCode: string;
    participantId: string;
    bookingGroupId: string;
    tripId: string;
    packageType?: "ALL_IN" | "TRANSPORT_ONLY" | string;
    package_type?: string;
  };
  issuer: {
    companyName: string;
    legalName: string;
    tagline: string;
    website: string;
    supportEmail: string;
    supportPhone: string;
    address: string;
  };
  customer: {
    userId?: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    identityNumber?: string;
    identityType?: string;
    dateOfBirth?: string;
    date_of_birth?: string;
    hasInsurance?: boolean;
    has_insurance?: boolean;
    country: string;
    nationality: string;
    gender?: string;
  };
  tripDetails: {
    destinationId: string;
    destinationName: string;
    destinationSlug: string;
    destinationCoverImage?: string;
    departureDate: string;
    returnDate: string;
    duration?: string;
    meetingPoint: string;
    pickupLocation?: string;
    pickupLatitude?: number | null;
    pickupLongitude?: number | null;
    pickupNotes?: string;
    packageType?: "ALL_IN" | "TRANSPORT_ONLY" | string;
    package_type?: string;
    serviceType?: string;
    roomPreference?: string;
    roomType?: string;
    groupNumber: number;
    vehicleModel?: string;
    vehiclePlateNumber?: string;
    driverName?: string;
    driverPhone?: string;
  };
  pricing: {
    currency: string;
    items: InvoiceItem[];
    basePrice: number;
    insuranceFee?: number;
    adminFee: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
  };
  paymentDetails: {
    paymentId: string | null;
    paymentMethod: string;
    midtransOrderId: string;
    midtransTransactionId: string | null;
    paymentStatus: string;
    transactionTime: string;
    completionTime: string | null;
    paymentProofUrl: string | null;
  };
  verification: {
    voucherQrCode: string;
    invoiceUrl: string;
  };
}

// -------------------------------------------------------------
// FINANCE, BILLING & SETTLEMENT TYPES
// -------------------------------------------------------------

export type TransactionType = 'INCOME' | 'EXPENSE';

export type TransactionCategory =
  | 'GUEST_COLLECT'
  | 'MERCHANT_COMMISSION'
  | 'MODAL_REFUND'
  | 'OTHER_INCOME'
  | 'DRIVER_MODAL'
  | 'DRIVER_FEE'
  | 'DRIVER_TRANSPORT'
  | 'VENDOR_TICKET'
  | 'VENDOR_RENTAL'
  | 'VENDOR_PARKING'
  | 'OP_ADMIN_SALARY'
  | 'OP_CAR_WASH'
  | 'OP_RENT'
  | 'OP_UTILITIES'
  | 'OP_MAINTENANCE'
  | 'OTHER_EXPENSE';

export interface FinanceTransaction {
  id: string;
  transactionNumber: string;
  type: TransactionType;
  category: TransactionCategory | string;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'MIDTRANS' | string;
  status: 'PENDING' | 'CONFIRMED' | 'SETTLED' | 'CANCELLED' | string;
  transactionDate: string;
  tripId?: string | null;
  bookingGroupId?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  vehicleId?: string | null;
  vehiclePlate?: string | null;
  vendorName?: string | null;
  receiptProofUrl?: string | null;
  description?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  trip?: {
    id: string;
    destinationName?: string;
    departureDate?: string;
  } | null;
}

export interface CashflowSummary {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  estimatedTax: number;
  taxRatePercentage: number;
  categoryBreakdown: Record<string, number>;
  totalTransactions: number;
}

export interface DriverManifestSummaryItem {
  bookingGroupId: string;
  groupNumber: number;
  tripId: string;
  destinationName: string;
  departureDate: string;
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  vehiclePlate?: string | null;
  totalParticipants: number;
  totalManifestAmount: number;
  paidCount: number;
  pendingCount: number;
  uncollectedGuestAmount: number;
  recordedSetoran: number;
  recordedDriverModal: number;
  isSettled: boolean;
  participants: Array<{
    id: string;
    full_name: string;
    total_amount: number | null;
    payment_status: string;
    package_type: string;
    pickup_location?: string | null;
  }>;
}

export interface DriverSettlementSlip {
  id: string;
  slipNumber: string;
  driverId: string;
  driverName?: string | null;
  driverPhone?: string | null;
  periodStart: string;
  periodEnd: string;
  packageType: 'ALL_IN' | 'TRANSPORT_ONLY' | 'MIXED' | string;
  totalTrips: number;
  totalDriverFee: number;
  totalTransportAllowance: number;
  totalBonusOrCommission: number;
  totalDeductions: number;
  netAmount: number;
  status: 'DRAFT' | 'DRIVER_CONFIRMED' | 'PAID' | 'CANCELLED' | string;
  confirmedAt?: string | null;
  paidAt?: string | null;
  paymentProofUrl?: string | null;
  notes?: string | null;
  breakdownDetails?: any;
  createdAt: string;
  updatedAt: string;
}

export interface VendorSettlementSlip {
  id: string;
  slipNumber: string;
  vendorName: string;
  category: 'TICKET' | 'RENTAL_JEEP' | 'PARKING_VIP' | 'OTHER' | string;
  periodStart: string;
  periodEnd: string;
  totalItems: number;
  totalAmount: number;
  status: 'DRAFT' | 'VENDOR_CONFIRMED' | 'PAID' | 'CANCELLED' | string;
  confirmedAt?: string | null;
  paidAt?: string | null;
  paymentProofUrl?: string | null;
  notes?: string | null;
  breakdownDetails?: any;
  createdAt: string;
  updatedAt: string;
}



