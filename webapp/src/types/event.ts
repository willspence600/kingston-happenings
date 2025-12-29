export type EventCategory = 
  | 'concert'
  | 'food-deal'
  | 'trivia'
  | 'theatre'
  | 'sports'
  | 'festival'
  | 'market'
  | 'workshop'
  | 'nightlife'
  | 'family'
  | 'community'
  | '19plus'
  | 'activity';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  startTime: string;
  endTime?: string;
  venue: Venue;
  categories: EventCategory[];
  imageUrl?: string;
  price?: string;
  ticketUrl?: string;
  featured?: boolean;
  // Recurrence fields
  isRecurring?: boolean;
  recurrencePattern?: 'weekly' | 'biweekly' | 'monthly';
  recurrenceDay?: number; // 0-6 for day of week
  recurrenceEndDate?: string;
  parentEventId?: string;
  // Deal vs Event distinction
  isDeal?: boolean;
  // All-day event
  isAllDay?: boolean;
  // Status
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  // Like count from API
  likeCount?: number;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  neighborhood?: string;
  website?: string;
  imageUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'organizer' | 'admin';
  venueId?: string; // If they're an organizer
}

export const categoryLabels: Record<EventCategory, string> = {
  'concert': 'Concerts',
  'food-deal': 'Food & Drink Deals',
  'trivia': 'Trivia Nights',
  'theatre': 'Theatre & Arts',
  'sports': 'Sports',
  'festival': 'Festivals',
  'market': 'Markets',
  'workshop': 'Workshops & Classes',
  'nightlife': 'Nightlife',
  'family': 'Family Friendly',
  'community': 'Community Events',
  '19plus': '19+',
  'activity': 'Activities',
};

export const categoryColors: Record<EventCategory, string> = {
  'concert': 'bg-rose-500',
  'food-deal': 'bg-amber-500',
  'trivia': 'bg-violet-500',
  'theatre': 'bg-fuchsia-500',
  'sports': 'bg-emerald-500',
  'festival': 'bg-orange-500',
  'market': 'bg-teal-500',
  'workshop': 'bg-sky-500',
  'nightlife': 'bg-indigo-500',
  'family': 'bg-lime-500',
  'community': 'bg-cyan-500',
  '19plus': 'bg-red-600',
  'activity': 'bg-blue-500',
};

