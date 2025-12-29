import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, format } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kingstonhappenings.ca' },
    update: {},
    create: {
      email: 'admin@kingstonhappenings.ca',
      name: 'Admin',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create venues
  const venues = await Promise.all([
    prisma.venue.upsert({
      where: { id: 'venue-grand-theatre' },
      update: {},
      create: {
        id: 'venue-grand-theatre',
        name: 'The Grand Theatre',
        address: '218 Princess St, Kingston, ON',
        neighborhood: 'Downtown',
        website: 'https://kingstongrand.ca',
      },
    }),
    prisma.venue.upsert({
      where: { id: 'venue-ale-house' },
      update: {},
      create: {
        id: 'venue-ale-house',
        name: 'The Ale House',
        address: '393 Princess St, Kingston, ON',
        neighborhood: 'Downtown',
        website: 'https://alehousekingston.com',
      },
    }),
    prisma.venue.upsert({
      where: { id: 'venue-leons-centre' },
      update: {},
      create: {
        id: 'venue-leons-centre',
        name: "Leon's Centre",
        address: '1 The Tragically Hip Way, Kingston, ON',
        neighborhood: 'Downtown',
        website: 'https://leonscentre.com',
      },
    }),
    prisma.venue.upsert({
      where: { id: 'venue-toucan' },
      update: {},
      create: {
        id: 'venue-toucan',
        name: 'The Toucan',
        address: '76 Princess St, Kingston, ON',
        neighborhood: 'Downtown',
      },
    }),
    prisma.venue.upsert({
      where: { id: 'venue-tir-nan-og' },
      update: {},
      create: {
        id: 'venue-tir-nan-og',
        name: 'Tir Nan Og',
        address: '200 Ontario St, Kingston, ON',
        neighborhood: 'Waterfront',
      },
    }),
    prisma.venue.upsert({
      where: { id: 'venue-kbc' },
      update: {},
      create: {
        id: 'venue-kbc',
        name: 'Kingston Brewing Company',
        address: '34 Clarence St, Kingston, ON',
        neighborhood: 'Downtown',
      },
    }),
    prisma.venue.upsert({
      where: { id: 'venue-isabel' },
      update: {},
      create: {
        id: 'venue-isabel',
        name: 'Isabel Bader Centre',
        address: "390 King St W, Kingston, ON",
        neighborhood: "Queen's University",
        website: 'https://queensu.ca/theisabel',
      },
    }),
    prisma.venue.upsert({
      where: { id: 'venue-market-square' },
      update: {},
      create: {
        id: 'venue-market-square',
        name: 'Market Square',
        address: '216 Ontario St, Kingston, ON',
        neighborhood: 'Downtown',
      },
    }),
    prisma.venue.upsert({
      where: { id: 'venue-mansion' },
      update: {},
      create: {
        id: 'venue-mansion',
        name: 'The Mansion',
        address: '506 Princess St, Kingston, ON',
        neighborhood: 'Downtown',
      },
    }),
  ]);
  console.log(`✅ Created ${venues.length} venues`);

  const today = new Date();

  // Helper to create event with categories
  async function createEvent(
    data: {
      title: string;
      description: string;
      date: string;
      startTime: string;
      endTime?: string;
      venueId: string;
      categories: string[];
      price?: string;
      ticketUrl?: string;
      imageUrl?: string;
      featured?: boolean;
    }
  ) {
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        venueId: data.venueId,
        price: data.price,
        ticketUrl: data.ticketUrl,
        imageUrl: data.imageUrl,
        featured: data.featured || false,
        status: 'approved',
        submittedById: admin.id,
        categories: {
          create: data.categories.map((name) => ({ name })),
        },
      },
    });
    return event;
  }

  // Delete existing events to start fresh
  await prisma.eventCategory.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.event.deleteMany({});

  // Create events
  const events = await Promise.all([
    // Today's events
    createEvent({
      title: 'Trivia Night at The Ale House',
      description: "Test your knowledge at Kingston's most popular trivia night! Teams of up to 6 people. Prizes for top 3 teams. Great food and drink specials all night.",
      date: format(today, 'yyyy-MM-dd'),
      startTime: '19:00',
      endTime: '22:00',
      venueId: 'venue-ale-house',
      categories: ['trivia'],
      price: 'Free',
    }),
    createEvent({
      title: 'Half-Price Wings Wednesday',
      description: 'All wings are half price every Wednesday! Choose from over 20 different sauces and dry rubs. Dine-in only.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '11:00',
      endTime: '23:00',
      venueId: 'venue-toucan',
      categories: ['food-deal'],
      price: 'Half-Price Wings',
    }),
    createEvent({
      title: 'Open Mic Night',
      description: 'Bring your guitar, your voice, or your poetry! Sign-up starts at 7pm. All genres and skill levels welcome.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '20:00',
      endTime: '23:30',
      venueId: 'venue-kbc',
      categories: ['concert', 'nightlife'],
      price: 'Free',
    }),

    // Tomorrow
    createEvent({
      title: 'Kingston Symphony: Holiday Classics',
      description: 'Join the Kingston Symphony for an evening of beloved holiday classics. Featuring works by Tchaikovsky, Handel, and traditional carols arranged for full orchestra.',
      date: format(addDays(today, 1), 'yyyy-MM-dd'),
      startTime: '19:30',
      endTime: '21:30',
      venueId: 'venue-grand-theatre',
      categories: ['concert', 'theatre'],
      price: '$35-75',
      ticketUrl: 'https://kingstongrand.ca',
      imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
      featured: true,
    }),
    createEvent({
      title: '$5 Burger Night',
      description: 'Every Thursday, enjoy our famous half-pound burgers for just $5. Add fries for $2 more. While supplies last!',
      date: format(addDays(today, 1), 'yyyy-MM-dd'),
      startTime: '17:00',
      endTime: '21:00',
      venueId: 'venue-tir-nan-og',
      categories: ['food-deal'],
      price: '$5 Burgers',
    }),

    // This weekend
    createEvent({
      title: "Kingston Frontenacs vs Ottawa 67's",
      description: "OHL hockey action as the Frontenacs take on the Ottawa 67's. Family-friendly atmosphere with activities for kids between periods.",
      date: format(addDays(today, 2), 'yyyy-MM-dd'),
      startTime: '19:00',
      endTime: '22:00',
      venueId: 'venue-leons-centre',
      categories: ['sports', 'family'],
      price: '$18-45',
      ticketUrl: 'https://leonscentre.com',
      imageUrl: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800',
      featured: true,
    }),
    createEvent({
      title: 'Saturday Farmers Market',
      description: 'Fresh local produce, artisan goods, baked treats, and more from over 50 local vendors. Live music and family activities.',
      date: format(addDays(today, 2), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '14:00',
      venueId: 'venue-market-square',
      categories: ['market', 'family', 'community'],
      price: 'Free Admission',
      imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
      featured: true,
    }),
    createEvent({
      title: 'Indie Rock Night: The Wilderness',
      description: 'Toronto-based indie rock band The Wilderness brings their energetic live show to Kingston. Opening act: local favorites Shoreline.',
      date: format(addDays(today, 2), 'yyyy-MM-dd'),
      startTime: '21:00',
      endTime: '01:00',
      venueId: 'venue-mansion',
      categories: ['concert', 'nightlife'],
      price: '$15',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    }),

    // Next week
    createEvent({
      title: 'Paint Night: Winter Wonderland',
      description: 'Create your own winter scene masterpiece! All supplies included. No experience necessary. Wine and snacks available for purchase.',
      date: format(addDays(today, 4), 'yyyy-MM-dd'),
      startTime: '18:30',
      endTime: '21:00',
      venueId: 'venue-kbc',
      categories: ['workshop', 'nightlife'],
      price: '$45',
      imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
    }),
    createEvent({
      title: 'Comedy Night: Stand-Up Showcase',
      description: "Laugh the night away with five of Canada's funniest up-and-coming comedians. Hosted by Kingston's own Mike Patterson.",
      date: format(addDays(today, 5), 'yyyy-MM-dd'),
      startTime: '20:00',
      endTime: '22:30',
      venueId: 'venue-grand-theatre',
      categories: ['theatre', 'nightlife'],
      price: '$25',
      imageUrl: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=800',
    }),
    createEvent({
      title: 'Jazz Brunch',
      description: 'Start your Sunday right with live jazz, bottomless mimosas, and a delicious brunch buffet. Reservations recommended.',
      date: format(addDays(today, 3), 'yyyy-MM-dd'),
      startTime: '10:00',
      endTime: '14:00',
      venueId: 'venue-tir-nan-og',
      categories: ['concert', 'food-deal'],
      price: '$35',
      imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
    }),
    createEvent({
      title: "Kids' Art Workshop",
      description: 'Creative art workshop for children ages 6-12. This week: making holiday ornaments! All materials provided.',
      date: format(addDays(today, 6), 'yyyy-MM-dd'),
      startTime: '14:00',
      endTime: '16:00',
      venueId: 'venue-market-square',
      categories: ['workshop', 'family'],
      price: '$15',
    }),
    createEvent({
      title: 'Chamber Music Concert',
      description: 'An intimate evening of chamber music featuring works by Mozart, Beethoven, and contemporary Canadian composers.',
      date: format(addDays(today, 7), 'yyyy-MM-dd'),
      startTime: '19:30',
      endTime: '21:00',
      venueId: 'venue-isabel',
      categories: ['concert'],
      price: '$20-40',
      imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800',
      featured: true,
    }),
    createEvent({
      title: 'Pub Quiz Championship',
      description: 'Monthly championship round! Top teams from weekly trivia nights compete for prizes and bragging rights.',
      date: format(addDays(today, 8), 'yyyy-MM-dd'),
      startTime: '19:00',
      endTime: '22:00',
      venueId: 'venue-ale-house',
      categories: ['trivia'],
      price: 'Free',
    }),
    createEvent({
      title: 'Winter Festival',
      description: 'Annual winter celebration featuring ice sculptures, hot chocolate, skating, and holiday market. Fun for the whole family!',
      date: format(addDays(today, 10), 'yyyy-MM-dd'),
      startTime: '11:00',
      endTime: '20:00',
      venueId: 'venue-market-square',
      categories: ['festival', 'family', 'community'],
      price: 'Free',
      featured: true,
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);
  console.log('🎉 Database seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
