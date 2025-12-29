'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, ExternalLink, Navigation, Calendar, Heart, Tag, Accessibility, UtensilsCrossed } from 'lucide-react';
import { format } from 'date-fns';
import { useEvents } from '@/contexts/EventsContext';
import EventCard from '@/components/EventCard';

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getVenueById, getEventsByVenue } = useEvents();
  
  const venue = getVenueById(id);

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">Venue Not Found</h1>
          <p className="text-muted-foreground mb-6">The venue you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/venues"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            <ArrowLeft size={18} />
            Back to Venues
          </Link>
        </div>
      </div>
    );
  }

  const venueEvents = getEventsByVenue(venue.id);
  const upcomingEvents = venueEvents.filter((e) => e.date >= format(new Date(), 'yyyy-MM-dd'));
  const pastEvents = venueEvents.filter((e) => e.date < format(new Date(), 'yyyy-MM-dd'));
  
  // Separate deals from regular events
  const upcomingDeals = upcomingEvents.filter(e => e.categories.includes('food-deal'));
  const upcomingRegularEvents = upcomingEvents.filter(e => !e.categories.includes('food-deal'));

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-secondary to-primary/80 text-white py-16 sm:py-24">
        <div className="absolute inset-0 pattern-bg opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <MapPin size={32} />
            </div>
            <div>
              <h1 className="font-display text-4xl sm:text-5xl mb-2">{venue.name}</h1>
              <p className="text-white/80 text-lg">{venue.address}</p>
              {venue.neighborhood && (
                <span className="inline-block mt-2 px-3 py-1 bg-white/10 rounded-full text-sm">
                  {venue.neighborhood}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(venue.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white text-secondary rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              <Navigation size={16} />
              Get Directions
            </a>
            {venue.website && (
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg font-medium hover:bg-white/20 transition-colors"
              >
                <ExternalLink size={16} />
                Visit Website
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Venue Stats Overview */}
        <section className="mb-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Calendar size={24} className="mx-auto text-primary mb-2" />
            <p className="text-2xl font-display text-foreground">{upcomingRegularEvents.length}</p>
            <p className="text-sm text-muted-foreground">Upcoming Events</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Tag size={24} className="mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-display text-foreground">{upcomingDeals.length}</p>
            <p className="text-sm text-muted-foreground">Active Deals</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Heart size={24} className="mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-display text-foreground">{venueEvents.reduce((sum, e) => sum + (e.likeCount || 0), 0)}</p>
            <p className="text-sm text-muted-foreground">Total Likes</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Calendar size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-display text-foreground">{pastEvents.length}</p>
            <p className="text-sm text-muted-foreground">Past Events</p>
          </div>
        </section>

        {/* Food & Drink Deals */}
        {upcomingDeals.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl sm:text-3xl text-foreground flex items-center gap-2">
                <Tag size={24} className="text-amber-500" />
                Food & Drink Deals
              </h2>
              <span className="text-muted-foreground">
                {upcomingDeals.length} deal{upcomingDeals.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingDeals.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events (non-deals) */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl sm:text-3xl text-foreground">
              Upcoming Events
            </h2>
            <span className="text-muted-foreground">
              {upcomingRegularEvents.length} event{upcomingRegularEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {upcomingRegularEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingRegularEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted rounded-2xl">
              <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">No Upcoming Events</h3>
              <p className="text-muted-foreground">Check back soon for new events at this venue.</p>
            </div>
          )}
        </section>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="font-display text-2xl text-foreground mb-6">
              Past Events
            </h2>
            <div className="space-y-3 opacity-75">
              {pastEvents.slice(0, 5).map((event) => (
                <EventCard key={event.id} event={event} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
