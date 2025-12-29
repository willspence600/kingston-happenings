# Kingston Happenings Web App

A modern event discovery platform for Kingston, Ontario. Find concerts, food deals, trivia nights, and everything happening in the Limestone City.

## Features

- **Homepage** - Today's events at a glance with featured and upcoming events
- **Browse Events** - Filter by category, search, and date
- **Calendar View** - Monthly calendar with event indicators
- **Venue Directory** - Explore Kingston's venues and their events
- **Submit Events** - Form for organizers to submit new events
- **User Authentication** - Login/Register UI (ready for backend integration)

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom theme
- **Fonts**: DM Serif Display + Outfit
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Date Handling**: date-fns

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   ├── events/            # Events browse + detail pages
│   ├── calendar/          # Calendar view
│   ├── venues/            # Venues directory + detail pages
│   ├── submit/            # Event submission form
│   ├── about/             # About page
│   ├── login/             # Login page
│   └── register/          # Registration page
├── components/            # Reusable components
│   ├── Navigation.tsx     # Header navigation
│   ├── Footer.tsx         # Site footer
│   ├── EventCard.tsx      # Event display card
│   └── CategoryFilter.tsx # Category filter buttons
├── data/                  # Mock data
│   └── mockData.ts        # Sample events and venues
└── types/                 # TypeScript types
    └── event.ts           # Event, Venue, User types
```

## Design System

### Colors
- **Primary**: Warm terracotta (#C45D35) - Kingston's historic limestone inspiration
- **Secondary**: Deep forest green (#2D4A3E) - Lake Ontario and nature
- **Accent**: Soft peach (#E8A87C) - Sunset over the waterfront

### Typography
- **Display**: DM Serif Display - Elegant headings
- **Body**: Outfit - Clean, modern body text

## Event Categories

- Concerts
- Food & Drink Deals
- Trivia Nights
- Theatre & Arts
- Sports
- Festivals
- Markets
- Workshops & Classes
- Nightlife
- Family Friendly
- Community Events

## Backend Integration Notes

The UI is designed for easy backend integration:

1. **Events**: Replace `mockData.ts` functions with API calls
2. **Authentication**: Wire up login/register forms to auth provider
3. **Event Submission**: Connect form to POST endpoint
4. **Favorites**: Add user preference storage
5. **Search**: Connect to backend search/filter API

## Related

- [Event Scraper](/scraper) - Python scraper for discovering Kingston events
