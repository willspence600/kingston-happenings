import { Event, Venue } from '@/types/event';
import { addDays, format, subDays } from 'date-fns';

const today = new Date();

export const venues: Venue[] = [
  {
    id: 'v1',
    name: 'The Grand Theatre',
    address: '218 Princess St, Kingston, ON',
    neighborhood: 'Downtown',
    website: 'https://kingstongrand.ca',
    imageUrl: '/venues/grand-theatre.jpg',
  },
  {
    id: 'v2',
    name: 'The Ale House',
    address: '393 Princess St, Kingston, ON',
    neighborhood: 'Downtown',
    website: 'https://alehousekingston.com',
  },
  {
    id: 'v3',
    name: 'Leon\'s Centre',
    address: '1 The Tragically Hip Way, Kingston, ON',
    neighborhood: 'Downtown',
    website: 'https://leonscentre.com',
    imageUrl: '/venues/leons-centre.jpg',
  },
  {
    id: 'v4',
    name: 'The Toucan',
    address: '76 Princess St, Kingston, ON',
    neighborhood: 'Downtown',
  },
  {
    id: 'v5',
    name: 'Memorial Centre',
    address: '303 York St, Kingston, ON',
    neighborhood: 'Downtown',
  },
  {
    id: 'v6',
    name: 'Tir Nan Og',
    address: '200 Ontario St, Kingston, ON',
    neighborhood: 'Waterfront',
  },
  {
    id: 'v7',
    name: 'Kingston Brewing Company',
    address: '34 Clarence St, Kingston, ON',
    neighborhood: 'Downtown',
  },
  {
    id: 'v8',
    name: 'Isabel Bader Centre',
    address: '390 King St W, Kingston, ON',
    neighborhood: 'Queen\'s University',
    website: 'https://queensu.ca/theisabel',
  },
  {
    id: 'v9',
    name: 'Market Square',
    address: '216 Ontario St, Kingston, ON',
    neighborhood: 'Downtown',
  },
  {
    id: 'v10',
    name: 'The Mansion',
    address: '506 Princess St, Kingston, ON',
    neighborhood: 'Downtown',
  },
];

export const events: Event[] = [
  // Today's events
  {
    id: 'e1',
    title: 'Trivia Night at The Ale House',
    description: 'Test your knowledge at Kingston\'s most popular trivia night! Teams of up to 6 people. Prizes for top 3 teams. Great food and drink specials all night.',
    date: format(today, 'yyyy-MM-dd'),
    startTime: '19:00',
    endTime: '22:00',
    venue: venues[1],
    categories: ['trivia'],
    price: 'Free',
  },
  {
    id: 'e2',
    title: 'Half-Price Wings Wednesday',
    description: 'All wings are half price every Wednesday! Choose from over 20 different sauces and dry rubs. Dine-in only.',
    date: format(today, 'yyyy-MM-dd'),
    startTime: '11:00',
    endTime: '23:00',
    venue: venues[3],
    categories: ['food-deal'],
    price: 'Half-Price Wings',
  },
  {
    id: 'e3',
    title: 'Open Mic Night',
    description: 'Bring your guitar, your voice, or your poetry! Sign-up starts at 7pm. All genres and skill levels welcome.',
    date: format(today, 'yyyy-MM-dd'),
    startTime: '20:00',
    endTime: '23:30',
    venue: venues[6],
    categories: ['concert', 'nightlife'],
    price: 'Free',
  },
  // Tomorrow
  {
    id: 'e4',
    title: 'Kingston Symphony: Holiday Classics',
    description: 'Join the Kingston Symphony for an evening of beloved holiday classics. Featuring works by Tchaikovsky, Handel, and traditional carols arranged for full orchestra.',
    date: format(addDays(today, 1), 'yyyy-MM-dd'),
    startTime: '19:30',
    endTime: '21:30',
    venue: venues[0],
    categories: ['concert', 'theatre'],
    price: '$35-75',
    ticketUrl: 'https://kingstongrand.ca',
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
  },
  {
    id: 'e5',
    title: '$5 Burger Night',
    description: 'Every Thursday, enjoy our famous half-pound burgers for just $5. Add fries for $2 more. While supplies last!',
    date: format(addDays(today, 1), 'yyyy-MM-dd'),
    startTime: '17:00',
    endTime: '21:00',
    venue: venues[5],
    categories: ['food-deal'],
    price: '$5 Burgers',
  },
  // This weekend
  {
    id: 'e6',
    title: 'Kingston Frontenacs vs Ottawa 67\'s',
    description: 'OHL hockey action as the Frontenacs take on the Ottawa 67\'s. Family-friendly atmosphere with activities for kids between periods.',
    date: format(addDays(today, 2), 'yyyy-MM-dd'),
    startTime: '19:00',
    endTime: '22:00',
    venue: venues[2],
    categories: ['sports', 'family'],
    price: '$18-45',
    ticketUrl: 'https://leonscentre.com',
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800',
  },
  {
    id: 'e7',
    title: 'Saturday Farmers Market',
    description: 'Fresh local produce, artisan goods, baked treats, and more from over 50 local vendors. Live music and family activities.',
    date: format(addDays(today, 2), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '14:00',
    venue: venues[8],
    categories: ['market', 'family', 'community'],
    price: 'Free Admission',
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
  },
  {
    id: 'e8',
    title: 'Indie Rock Night: The Wilderness',
    description: 'Toronto-based indie rock band The Wilderness brings their energetic live show to Kingston. Opening act: local favorites Shoreline.',
    date: format(addDays(today, 2), 'yyyy-MM-dd'),
    startTime: '21:00',
    endTime: '01:00',
    venue: venues[9],
    categories: ['concert', 'nightlife'],
    price: '$15',
    ticketUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
  },
  // Next week
  {
    id: 'e9',
    title: 'Paint Night: Winter Wonderland',
    description: 'Create your own winter scene masterpiece! All supplies included. No experience necessary. Wine and snacks available for purchase.',
    date: format(addDays(today, 4), 'yyyy-MM-dd'),
    startTime: '18:30',
    endTime: '21:00',
    venue: venues[6],
    categories: ['workshop', 'nightlife'],
    price: '$45',
    imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
  },
  {
    id: 'e10',
    title: 'Comedy Night: Stand-Up Showcase',
    description: 'Laugh the night away with five of Canada\'s funniest up-and-coming comedians. Hosted by Kingston\'s own Mike Patterson.',
    date: format(addDays(today, 5), 'yyyy-MM-dd'),
    startTime: '20:00',
    endTime: '22:30',
    venue: venues[0],
    categories: ['theatre', 'nightlife'],
    price: '$25',
    imageUrl: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=800',
  },
  {
    id: 'e11',
    title: 'Jazz Brunch',
    description: 'Start your Sunday right with live jazz, bottomless mimosas, and a delicious brunch buffet. Reservations recommended.',
    date: format(addDays(today, 3), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '14:00',
    venue: venues[5],
    categories: ['concert', 'food-deal'],
    price: '$35',
    imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
  },
  {
    id: 'e12',
    title: 'Kids\' Art Workshop',
    description: 'Creative art workshop for children ages 6-12. This week: making holiday ornaments! All materials provided.',
    date: format(addDays(today, 6), 'yyyy-MM-dd'),
    startTime: '14:00',
    endTime: '16:00',
    venue: venues[8],
    categories: ['workshop', 'family'],
    price: '$15',
  },
  {
    id: 'e13',
    title: 'Chamber Music Concert',
    description: 'An intimate evening of chamber music featuring works by Mozart, Beethoven, and contemporary Canadian composers.',
    date: format(addDays(today, 7), 'yyyy-MM-dd'),
    startTime: '19:30',
    endTime: '21:00',
    venue: venues[7],
    categories: ['concert'],
    price: '$20-40',
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800',
  },
  {
    id: 'e14',
    title: 'Pub Quiz Championship',
    description: 'Monthly championship round! Top teams from weekly trivia nights compete for prizes and bragging rights.',
    date: format(addDays(today, 8), 'yyyy-MM-dd'),
    startTime: '19:00',
    endTime: '22:00',
    venue: venues[1],
    categories: ['trivia'],
    price: 'Free',
  },
  {
    id: 'e15',
    title: 'Winter Festival',
    description: 'Annual winter celebration featuring ice sculptures, hot chocolate, skating, and holiday market. Fun for the whole family!',
    date: format(addDays(today, 10), 'yyyy-MM-dd'),
    startTime: '11:00',
    endTime: '20:00',
    venue: venues[8],
    categories: ['festival', 'family', 'community'],
    price: 'Free',
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
  },
  // Past events for history
  {
    id: 'e16',
    title: 'Poetry Slam',
    description: 'Open mic poetry slam. Sign up at the door. All styles welcome.',
    date: format(subDays(today, 2), 'yyyy-MM-dd'),
    startTime: '20:00',
    endTime: '23:00',
    venue: venues[6],
    categories: ['theatre', 'community'],
    price: 'Free',
  },
  {
    id: 'e17',
    title: 'Craft Beer Tasting',
    description: 'Sample 8 different craft beers paired with local cheeses. Limited spots available.',
    date: format(subDays(today, 3), 'yyyy-MM-dd'),
    startTime: '18:00',
    endTime: '21:00',
    venue: venues[6],
    categories: ['food-deal', 'workshop'],
    price: '$40',
  },
];

export function getEventsByDate(date: string): Event[] {
  return events.filter(event => event.date === date);
}

export function getTodaysEvents(): Event[] {
  return getEventsByDate(format(new Date(), 'yyyy-MM-dd'));
}

export function getFeaturedEvents(): Event[] {
  return events.filter(event => event.featured && event.date >= format(new Date(), 'yyyy-MM-dd'));
}

export function getUpcomingEvents(limit?: number): Event[] {
  const upcoming = events
    .filter(event => event.date >= format(new Date(), 'yyyy-MM-dd'))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  
  return limit ? upcoming.slice(0, limit) : upcoming;
}

export function getEventById(id: string): Event | undefined {
  return events.find(event => event.id === id);
}

export function getVenueById(id: string): Venue | undefined {
  return venues.find(venue => venue.id === id);
}

export function getEventsByVenue(venueId: string): Event[] {
  return events.filter(event => event.venue.id === venueId);
}

export function getEventsByCategory(category: string): Event[] {
  return events.filter(event => 
    event.categories.includes(category as Event['categories'][number])
  );
}

