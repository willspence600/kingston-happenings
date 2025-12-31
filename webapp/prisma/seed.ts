import { PrismaClient } from '@prisma/client';
import { addDays, format } from 'date-fns';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also try .env

const prisma = new PrismaClient();

// All demo events will have IDs starting with 'demo-' for easy removal
const DEMO_PREFIX = 'demo-';

async function main() {
  console.log('🌱 Starting database seed with demo events...');

  // Create venues (these are real Kingston venues, not demos)
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
  console.log(`✅ Created/updated ${venues.length} venues`);

  const today = new Date();

  // Helper to create demo event with categories
  async function createDemoEvent(
    id: string,
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
    const fullId = DEMO_PREFIX + id;
    
    // Delete existing if present
    await prisma.eventCategory.deleteMany({ where: { eventId: fullId } });
    await prisma.like.deleteMany({ where: { eventId: fullId } });
    await prisma.event.deleteMany({ where: { id: fullId } });
    
    const event = await prisma.event.create({
      data: {
        id: fullId,
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
        categories: {
          create: data.categories.map((name) => ({ name })),
        },
      },
    });
    return event;
  }

  // Create demo events
  const events = await Promise.all([
    // Today's events (6 total: 3 events + 3 food deals)
    createDemoEvent('trivia-ale-house', {
      title: 'Trivia Night at The Ale House',
      description: "Test your knowledge at Kingston's most popular trivia night! Teams of up to 6 people. Prizes for top 3 teams. Great food and drink specials all night.",
      date: format(today, 'yyyy-MM-dd'),
      startTime: '19:00',
      endTime: '22:00',
      venueId: 'venue-ale-house',
      categories: ['trivia'],
      price: 'Free',
      imageUrl: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800',
    }),
    createDemoEvent('open-mic-kbc', {
      title: 'Open Mic Night',
      description: 'Bring your guitar, your voice, or your poetry! Sign-up starts at 7pm. All genres and skill levels welcome.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '20:00',
      endTime: '23:30',
      venueId: 'venue-kbc',
      categories: ['concert', 'nightlife'],
      price: 'Free',
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    }),
    createDemoEvent('yoga-waterfront', {
      title: 'Sunset Yoga at the Waterfront',
      description: 'Join us for a relaxing evening yoga session overlooking Lake Ontario. All levels welcome. Bring your own mat.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '18:00',
      endTime: '19:00',
      venueId: 'venue-market-square',
      categories: ['workshop', 'community'],
      price: '$15',
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    }),
    createDemoEvent('live-jazz-mansion', {
      title: 'Live Jazz: The Blue Notes',
      description: 'Kingston\'s favorite jazz quartet performs classics and originals. Perfect backdrop for dinner and drinks.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '21:00',
      endTime: '00:00',
      venueId: 'venue-mansion',
      categories: ['concert', 'nightlife'],
      price: '$10',
      imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800',
    }),
    
    // Today's Food & Drink Specials (4 total)
    createDemoEvent('wings-wednesday', {
      title: 'Half-Price Wings Wednesday',
      description: 'All wings are half price every Wednesday! Choose from over 20 different sauces and dry rubs. Dine-in only.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '11:00',
      endTime: '23:00',
      venueId: 'venue-toucan',
      categories: ['food-deal'],
      price: 'Half-Price Wings',
    }),
    createDemoEvent('happy-hour-tir', {
      title: 'Happy Hour: $5 Pints',
      description: 'All draft beers just $5 during happy hour! Plus $2 off appetizers. The best special on the waterfront.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '16:00',
      endTime: '19:00',
      venueId: 'venue-tir-nan-og',
      categories: ['food-deal'],
      price: '$5 Pints',
    }),
    createDemoEvent('taco-tuesday', {
      title: '$3 Taco Tuesday',
      description: 'Every Tuesday, all tacos are just $3! Choose from beef, chicken, fish, or veggie. Margarita specials all day.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '11:00',
      endTime: '22:00',
      venueId: 'venue-ale-house',
      categories: ['food-deal'],
      price: '$3 Tacos',
    }),
    createDemoEvent('pizza-special', {
      title: 'Late Night Pizza Special',
      description: 'Half-price pizzas after 9pm! Perfect for post-show dining. Dine-in or takeout available.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '21:00',
      endTime: '01:00',
      venueId: 'venue-kbc',
      categories: ['food-deal'],
      price: '50% Off Pizza',
    }),
    createDemoEvent('kbc-burger-special', {
      title: 'Brewmaster Burger Deal',
      description: 'Our signature burger with a pint of house-brewed beer for just $15! Available all day. Choose from our selection of craft beers.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '11:00',
      endTime: '22:00',
      venueId: 'venue-kbc',
      categories: ['food-deal'],
      price: '$15 Burger & Pint',
    }),
    createDemoEvent('kbc-appetizer-hour', {
      title: 'Appetizer Hour Special',
      description: 'All appetizers are $8 during happy hour! Perfect for sharing. Try our famous nachos, wings, or loaded fries.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '15:00',
      endTime: '18:00',
      venueId: 'venue-kbc',
      categories: ['food-deal'],
      price: '$8 Appetizers',
    }),
    createDemoEvent('kbc-beer-flight', {
      title: 'Craft Beer Flight Deal',
      description: 'Sample 4 of our house-brewed beers for just $12! Get a taste of our seasonal brews and classic favorites.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '12:00',
      endTime: '23:00',
      venueId: 'venue-kbc',
      categories: ['food-deal'],
      price: '$12 Beer Flight',
    }),
    createDemoEvent('toucan-pint-special', {
      title: 'Pint of the Day',
      description: 'Our featured pint is just $6 all day! Rotating selection of local and craft beers. Ask your server for today\'s selection.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '11:00',
      endTime: '23:00',
      venueId: 'venue-toucan',
      categories: ['food-deal'],
      price: '$6 Pint',
    }),
    createDemoEvent('toucan-brunch-special', {
      title: 'Weekend Brunch Special',
      description: 'Brunch favorites with a side of home fries and toast. Includes coffee or tea. Available until 2pm.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '14:00',
      venueId: 'venue-toucan',
      categories: ['food-deal'],
      price: '$12 Brunch',
    }),
    createDemoEvent('toucan-share-platter', {
      title: 'Share Platter Deal',
      description: 'Perfect for groups! Mix and match from our selection of appetizers. Choose any 3 items for $25. Great for sharing with friends.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '16:00',
      endTime: '22:00',
      venueId: 'venue-toucan',
      categories: ['food-deal'],
      price: '$25 Share Platter',
    }),
    createDemoEvent('ale-house-wings', {
      title: 'Wing Night Special',
      description: '50% off all wings after 8pm! Choose from traditional, boneless, or vegan options. Perfect for sharing.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '20:00',
      endTime: '23:00',
      venueId: 'venue-ale-house',
      categories: ['food-deal'],
      price: '50% Off Wings',
    }),
    createDemoEvent('tir-nan-og-burger', {
      title: 'Burger & Beer Combo',
      description: 'Gourmet burger with your choice of side and a pint of craft beer for $18. Available all day long.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '11:30',
      endTime: '22:00',
      venueId: 'venue-tir-nan-og',
      categories: ['food-deal'],
      price: '$18 Combo',
    }),
    createDemoEvent('mansion-wine-wednesday', {
      title: 'Wine Wednesday',
      description: 'Half-price bottles of wine all night! Perfect pairing with our dinner menu. Selection changes weekly.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '17:00',
      endTime: '23:00',
      venueId: 'venue-mansion',
      categories: ['food-deal'],
      price: '50% Off Wine',
    }),
    createDemoEvent('kbc-taco-tuesday', {
      title: 'Taco & Tequila Special',
      description: 'Build your own tacos for $4 each, plus $2 off all tequila cocktails. Fresh ingredients daily.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '17:00',
      endTime: '22:00',
      venueId: 'venue-kbc',
      categories: ['food-deal'],
      price: '$4 Tacos',
    }),
    createDemoEvent('ale-house-sunday-brunch', {
      title: 'Weekend Brunch Buffet',
      description: 'All-you-can-eat brunch buffet with pancakes, eggs, bacon, fresh fruit, and more. Bottomless coffee included!',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '10:00',
      endTime: '14:00',
      venueId: 'venue-ale-house',
      categories: ['food-deal'],
      price: '$22 Brunch',
    }),
    createDemoEvent('tir-nan-og-fish-fry', {
      title: 'Fish & Chips Friday',
      description: 'Fresh battered fish with hand-cut fries and coleslaw. A waterfront classic! Available all day.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '11:30',
      endTime: '21:00',
      venueId: 'venue-tir-nan-og',
      categories: ['food-deal'],
      price: '$16 Fish & Chips',
    }),

    // Additional Today's Events (6 more)
    createDemoEvent('comedy-night-ale-house', {
      title: 'Comedy Night',
      description: 'Local comedians take the stage! Laughs guaranteed. 18+ event. Doors at 7pm, show at 8pm.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '20:00',
      endTime: '23:00',
      venueId: 'venue-ale-house',
      categories: ['nightlife', '19plus'],
      price: '$12',
      imageUrl: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?w=800',
    }),
    createDemoEvent('art-workshop-isabel', {
      title: 'Watercolor Painting Workshop',
      description: 'Learn basic watercolor techniques in this beginner-friendly workshop. All materials provided. No experience needed!',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '14:00',
      endTime: '16:30',
      venueId: 'venue-isabel',
      categories: ['workshop', 'community'],
      price: '$25',
      imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
    }),
    createDemoEvent('dance-class-market-square', {
      title: 'Latin Dance Class',
      description: 'Learn salsa and bachata in this fun, energetic class. No partner needed. All skill levels welcome.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '19:00',
      endTime: '20:30',
      venueId: 'venue-market-square',
      categories: ['workshop', 'community'],
      price: '$15',
      imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
    }),
    createDemoEvent('acoustic-night-toucan', {
      title: 'Acoustic Sessions',
      description: 'Intimate acoustic performances from local singer-songwriters. Cozy atmosphere perfect for listening.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '20:30',
      endTime: '23:00',
      venueId: 'venue-toucan',
      categories: ['live-music', 'nightlife'],
      price: 'Free',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    }),
    createDemoEvent('karaoke-night-kbc', {
      title: 'Karaoke Night',
      description: 'Grab the mic and sing your heart out! Thousands of songs to choose from. Prizes for best performances.',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '21:00',
      endTime: '01:00',
      venueId: 'venue-kbc',
      categories: ['nightlife', 'community'],
      price: 'Free',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    }),
    createDemoEvent('poetry-reading-mansion', {
      title: 'Poetry Reading Night',
      description: 'Local poets share their work in this intimate setting. Open mic slots available. Come listen or share your own!',
      date: format(today, 'yyyy-MM-dd'),
      startTime: '19:30',
      endTime: '21:30',
      venueId: 'venue-mansion',
      categories: ['community', 'workshop'],
      price: 'Free',
      imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    }),

    // Tomorrow
    createDemoEvent('symphony-holiday', {
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
    createDemoEvent('burger-night', {
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
    createDemoEvent('frontenacs-game', {
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
    createDemoEvent('farmers-market', {
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
    createDemoEvent('indie-rock-night', {
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
    createDemoEvent('paint-night', {
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
    createDemoEvent('comedy-night', {
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
    createDemoEvent('jazz-brunch', {
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
    createDemoEvent('kids-art', {
      title: "Kids' Art Workshop",
      description: 'Creative art workshop for children ages 6-12. This week: making holiday ornaments! All materials provided.',
      date: format(addDays(today, 6), 'yyyy-MM-dd'),
      startTime: '14:00',
      endTime: '16:00',
      venueId: 'venue-market-square',
      categories: ['workshop', 'family'],
      price: '$15',
    }),
    createDemoEvent('chamber-music', {
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
    createDemoEvent('pub-quiz-championship', {
      title: 'Pub Quiz Championship',
      description: 'Monthly championship round! Top teams from weekly trivia nights compete for prizes and bragging rights.',
      date: format(addDays(today, 8), 'yyyy-MM-dd'),
      startTime: '19:00',
      endTime: '22:00',
      venueId: 'venue-ale-house',
      categories: ['trivia'],
      price: 'Free',
    }),
    createDemoEvent('winter-festival', {
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

  console.log(`✅ Created ${events.length} demo events`);
  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('💡 To remove demo events, run: npm run db:clear-demos');
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
