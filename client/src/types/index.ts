export type UserRoleName = 'ORGANIZER' | 'PLAYER';

export type GameGenre =
  | 'MMORPG'
  | 'MOBA'
  | 'FPS'
  | 'RPG'
  | 'SURVIVAL'
  | 'STRATEGY'
  | 'SPORTS'
  | 'OTHER';

export type EventStatus = 'REGISTRATION' | 'FULL' | 'WAITING' | 'STARTED' | 'COMPLETED' | 'CANCELLED';

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';

export type AttendanceStatus = 'NOT_MARKED' | 'PRESENT' | 'ABSENT';

export type ReportKind = 'EVENT_ATTENDANCE' | 'PLAYER_PARTICIPATION';

export type ReportFormat = 'PDF' | 'DOCX';

export type DeliveryChannel = 'DOWNLOAD' | 'EMAIL';

export type ReportStatus = 'QUEUED' | 'GENERATED' | 'EMAILED' | 'FAILED';

export interface Role {
  id: number;
  name: UserRoleName;
  description: string;
}

export interface PublicUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Game {
  id: number;
  slug: string;
  title: string;
  genre: GameGenre;
  platform: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventGameSummary {
  id: number;
  slug: string;
  title: string;
  genre: GameGenre;
  platform: string;
}

export interface EventOrganizerSummary {
  id: number;
  username: string;
  displayName: string;
}

export interface Event {
  id: number;
  gameId: number;
  organizerId: number;
  title: string;
  description: string;
  serverRegion: string;
  scheduledStart: string;
  scheduledEnd: string;
  registrationDeadline: string;
  maxPlayers: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  game: EventGameSummary;
  organizer: EventOrganizerSummary;
  _count: {
    registrations: number;
    slots: number;
  };
}

export interface EventSlot {
  id: number;
  eventId: number;
  roleName: string;
  displayOrder: number;
  requiredCount: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    registrations: number;
  };
}

export interface RegistrationEventSummary {
  id: number;
  title: string;
  status: EventStatus;
  organizerId: number;
  registrationDeadline: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export interface RegistrationUserSummary {
  id: number;
  username: string;
  displayName: string;
  email: string;
}

export interface RegistrationSlotSummary {
  id: number;
  roleName: string;
  displayOrder: number;
}

export interface Registration {
  id: number;
  eventId: number;
  userId: number;
  eventSlotId: number | null;
  requestedRoleName: string | null;
  status: RegistrationStatus;
  attendanceStatus: AttendanceStatus;
  joinedAt: string;
  updatedAt: string;
  event: RegistrationEventSummary;
  user: RegistrationUserSummary;
  eventSlot: RegistrationSlotSummary | null;
}

export interface AvailabilityWindow {
  id: number;
  userId: number;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportRequest {
  id: number;
  requestedByUserId: number;
  subjectUserId: number | null;
  eventId: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  reportKind: ReportKind;
  outputFormat: ReportFormat;
  deliveryChannel: DeliveryChannel;
  recipientEmail: string | null;
  status: ReportStatus;
  fileName: string | null;
  storagePath: string | null;
  requestedAt: string;
  generatedAt: string | null;
  emailedAt: string | null;
  failedReason: string | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedEvents {
  events: Event[];
  pagination: PaginationMeta;
}

export interface PaginatedRegistrations {
  registrations: Registration[];
  pagination: PaginationMeta;
}

export interface PaginatedReports {
  reports: ReportRequest[];
  pagination: PaginationMeta;
}

export interface RosterBoard {
  eventId: number;
  slots: EventSlot[];
  registrations: Registration[];
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  displayName: string;
  roleName: UserRoleName;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface CreateGameInput {
  slug: string;
  title: string;
  genre: GameGenre;
  platform: string;
  isActive?: boolean;
}

export type UpdateGameInput = Partial<CreateGameInput>;

export interface ListEventsQuery {
  search?: string;
  gameId?: number;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  sort?: 'scheduledStart' | 'title' | 'createdAt' | 'status';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  availabilityFit?: boolean;
}

export interface CreateEventInput {
  gameId: number;
  title: string;
  description: string;
  serverRegion: string;
  scheduledStart: string;
  scheduledEnd: string;
  maxPlayers: number;
}

export type UpdateEventInput = Partial<CreateEventInput> & {
  status?: EventStatus;
};

export interface CreateSlotInput {
  roleName: string;
  displayOrder: number;
  requiredCount: number;
}

export type UpdateSlotInput = Partial<CreateSlotInput>;

export interface ListRegistrationsQuery {
  eventId?: number;
  status?: RegistrationStatus;
  page?: number;
  pageSize?: number;
}

export interface CreateRegistrationInput {
  eventId: number;
  requestedRoleName?: string;
}

export interface UpdateRegistrationInput {
  status?: RegistrationStatus;
  eventSlotId?: number | null;
  attendanceStatus?: AttendanceStatus;
  requestedRoleName?: string | null;
}

export interface ListAvailabilityQuery {
  dayOfWeek?: number;
}

export interface CreateAvailabilityInput {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  timezone: string;
}

export type UpdateAvailabilityInput = Partial<CreateAvailabilityInput>;

export interface ListReportsQuery {
  page?: number;
  pageSize?: number;
}

export interface CreateReportInput {
  reportKind: ReportKind;
  outputFormat: ReportFormat;
  deliveryChannel: DeliveryChannel;
  recipientEmail?: string;
  eventId?: number;
  subjectUserId?: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface UpdateReportInput {
  recipientEmail?: string;
  status?: ReportStatus;
}

export interface EmailReportInput {
  recipientEmail?: string;
}

export interface ReportDownload {
  blob: Blob;
  fileName: string;
}
