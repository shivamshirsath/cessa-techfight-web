// src/types/index.ts

// src/types/index.ts
export type UserRole = 'ADMIN' | 'TREASURER' | 'COORDINATOR' | 'SOCIAL_MEDIA' | 'USER';

export type SponsorCategory = 'TECHNICAL' | 'NON_TECHNICAL';
export type SponsorType = 'TITLE' | 'CO_SPONSOR' | 'ASSOCIATE' | 'OTHER';

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  category: SponsorCategory;
  type: SponsorType;
  displayOrder: number;
  createdAt: number;
}

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
  
  // Staff Coordinator
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

// --- NEW TYPES FOR SOCIAL MEDIA & TEAM ---

export interface SocialPost {
  id: string;
  embedHtml: string; // The iframe code provided by Instagram
  createdAt: number;
  createdBy: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  displayOrder: number; // To control who shows up first (e.g., President, then VPs)
  createdAt: number;
}