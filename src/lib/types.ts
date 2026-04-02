// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  restaurantId: string;
}

export interface RegisterRequest {
  restaurantName: string;
  slug: string;
  address: string;
  email: string;
  password: string;
  staffName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ── Restaurant ───────────────────────────────────────────────────────────────

export interface RestaurantResponse {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string | null;
  description: string | null;
  openingHours: Record<string, unknown>;
  qrCodeUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicRestaurantResponse {
  name: string;
  slug: string;
  description: string | null;
  openingHours: Record<string, unknown>;
  active: boolean;
}

// ── Config ───────────────────────────────────────────────────────────────────

export interface RestaurantConfigResponse {
  id: string;
  restaurantId: string;
  confirmationTimeoutMinutes: number;
  noshowGraceMinutes: number;
  avgTableDurationMinutes: number;
  reservationProtectionWindowMinutes: number;
  maxQueueSize: number | null;
}

// ── Tables ───────────────────────────────────────────────────────────────────

export type TableStatus = "FREE" | "OCCUPIED" | "CLEANING";

export interface TableResponse {
  id: string;
  restaurantId: string;
  label: string;
  capacity: number;
  status: TableStatus;
  zone: string | null;
  reservedSoon: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Queue ────────────────────────────────────────────────────────────────────

export type QueueEntryStatus =
  | "WAITING"
  | "NOTIFIED"
  | "SEATED"
  | "CANCELLED"
  | "EXPIRED";

export interface QueueStatusResponse {
  waitingCount: number;
  estimatedWaitMinutes: number;
  queueOpen: boolean;
}

export interface JoinQueueRequest {
  customerName: string;
  partySize: number;
  customerPhone?: string;
}

export interface JoinQueueResponse {
  entryId: string;
  accessToken: string;
  position: number;
  estimatedWaitMinutes: number;
}

export interface QueueEntryResponse {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string | null;
  partySize: number;
  position: number;
  status: QueueEntryStatus;
  estimatedWaitMinutes: number | null;
  notifiedAt: string | null;
  walkIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicQueueEntryResponse {
  id: string;
  customerName: string;
  partySize: number;
  position: number;
  status: QueueEntryStatus;
  estimatedWaitMinutes: number | null;
  createdAt: string;
}

// ── Reservations ─────────────────────────────────────────────────────────────

export type ReservationStatus =
  | "BOOKED"
  | "ARRIVED"
  | "SEATED"
  | "CANCELLED"
  | "NO_SHOW"
  | "COMPLETED";

export interface ReservationResponse {
  id: string;
  restaurantId: string;
  tableId: string | null;
  customerName: string;
  customerPhone: string | null;
  partySize: number;
  reservedAt: string;
  status: ReservationStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationRequest {
  customerName: string;
  customerPhone?: string;
  partySize: number;
  reservedAt: string;
  notes?: string;
}

// ── Errors ───────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
  status: number;
  timestamp: string;
}
