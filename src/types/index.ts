export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";
export type GroupStatus = "open" | "waiting" | "full" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type DriverStatus = "available" | "on_trip" | "maintenance" | "off_duty";
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
  createdAt: string;
  updatedAt: string;
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
  identityNumber: string; // KTP / Paspor
  identity_number?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  roomPreference?: "single" | "shared" | "none";
  room_preference?: "single" | "shared" | "none";
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
  hasInsurance: boolean;
  has_insurance?: boolean;
  insuranceFee: number;
  insurance_fee?: number;
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
  fullName: string;
  name?: string;
  phoneNumber: string;
  phone?: string;
  email?: string;
  licenseNumber: string;
  vehicleModel: string;
  vehicleType?: string;
  plateNumber: string;
  vehiclePlat?: string;
  passengerCapacity: number; // 6
  experienceYears?: number;
  isAvailable?: boolean;
  status: DriverStatus;
  rating: number;
  totalTrips: number;
  photoUrl?: string;
  notes?: string;
  user?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    profileImageUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
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
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
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
  identityNumber: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  roomPreference?: "single" | "shared" | "none";
  healthNotes?: string;
  pickupLocation?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  pickupNotes?: string;
  hasInsurance: boolean;
  captchaToken: string;
  departureDate?: string;
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
  driverId?: string;
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
  groupNumber?: number;
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


