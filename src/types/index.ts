// src/types/index.ts

export type UserRole = 'ADMIN' | 'TREASURER' | 'COORDINATOR' | 'USER';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: number;
  assignedEventId?: string;
}

export type EventType = 'SINGLE' | 'TEAM';

export interface Event {
  id: string;
  title: string;
  description: string;
  registrationFee: number;
  posterUrl: string; 
  eventType: EventType;
  teamSize: number; 
  
  // Student Coordinator
  coordinatorName: string;
  coordinatorContact: string;
  
  // NEW: Staff Coordinator
  staffCoordinatorName: string;
  staffCoordinatorContact: string;
  
  paymentQrUrl: string; 
  upiId: string;
  bankDetails: string;
  createdBy: string;
  isActive: boolean;
  createdAt: number;
}

export type RegistrationStatus = 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  utrNumber: string;
  status: RegistrationStatus;
  submittedAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
}