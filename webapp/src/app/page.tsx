'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, Search, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import EventCard from '@/components/EventCard';
import { useEvents } from '@/contexts/EventsContext';
import { useAuth } from '@/contexts/AuthContext';
import { categoryLabels, EventCategory } from '@/types/event';

const quickCategories: EventCategory[] = [
  'concert', 'food-deal', 'trivia', 'sports', 'festival', 'family'
];

export default function HomePage() {
  const { getTodaysEvents, getFeaturedEvents, getUpcomingEvents } = useEvents();
  const { user } = useAuth();
  
  const todaysEvents = getTodaysEvents();
  const featuredEvents = getFeaturedEvents();
  const upcomingEvents = getUpcomingEvents(6);
  const today = new Date();
  
  // Get first name from user name
  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary/95 to-primary/80 text-white">
        {/* Decorative elements */}
        <div className="absolute inset-0 pattern-bg opacity-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6 animate-fade-in">
              <Sparkles size={14} className="text-accent" />
              <span>What&apos;s Happening in Kingston Today</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mb-6 animate-slide-up">
              {user && firstName ? (
                <>
                  Welcome back,{' '}
                  <span className="italic text-accent">{firstName}.</span>
                </>
              ) : (
                <>
                  Every Event.{' '}
                  <span className="italic text-accent">Every Day.</span>
                </>
              )}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-8 animate-slide-up stagger-1">
              Events and deals in Kingston, Ontario — from concerts to trivia nights, 
              food specials to festivals. Your complete guide to the Limestone City.
            </p>
            
            {/* Search/Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up stagger-2">
              <Link
                href="/events"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-secondary rounded-xl font-medium hover:bg-white/90 transition-colors"
              >
                <Search size={18} />
                Browse All Events
              </Link>
              <Link
                href="/calendar"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                <Calendar size={18} />
                View Calendar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Category Links */}
      <section className="relative -mt-8 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-2xl shadow-lg border border-border p-4 sm:p-6">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Filter by what you feel like doing today
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {quickCategories.map((category) => (
                <Link
                  key={category}
                  href={`/events?category=${category}`}
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-sm font-medium text-foreground border border-transparent hover:border-primary/20 hover:shadow-md"
                >
                  <span>{categoryLabels[category]}</span>
                  <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Today's Events */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-primary font-medium text-sm uppercase tracking-wider mb-1">
                {format(today, 'EEEE, MMMM d')}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-foreground">
                Happening Today
              </h2>
            </div>
            <Link
              href={`/events?date=${format(today, 'yyyy-MM-dd')}`}
              className="hidden sm:flex items-center gap-1 text-primary hover:underline font-medium"
            >
              See all
              <ArrowRight size={16} />
            </Link>
          </div>

          {todaysEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {todaysEvents.map((event, index) => (
                <div key={event.id} className={`animate-slide-up stagger-${index + 1}`}>
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted rounded-2xl">
              <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">No Events Today</h3>
              <p className="text-muted-foreground mb-4">Check out what&apos;s coming up this week!</p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
              >
                Browse Upcoming Events
              </Link>
            </div>
          )}

          <div className="sm:hidden mt-6 text-center">
            <Link
              href={`/events?date=${format(today, 'yyyy-MM-dd')}`}
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              See all today&apos;s events
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-16 sm:py-20 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-primary font-medium text-sm uppercase tracking-wider mb-1">
                  Don&apos;t Miss
                </p>
                <h2 className="font-display text-3xl sm:text-4xl text-foreground">
                  Featured Events
                </h2>
              </div>
              <Link
                href="/events"
                className="hidden sm:flex items-center gap-1 text-primary hover:underline font-medium"
              >
                View all
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredEvents.slice(0, 4).map((event) => (
                <EventCard key={event.id} event={event} variant="featured" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-primary font-medium text-sm uppercase tracking-wider mb-1">
                Coming Soon
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-foreground">
                Upcoming Events
              </h2>
            </div>
            <Link
              href="/events"
              className="hidden sm:flex items-center gap-1 text-primary hover:underline font-medium"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} variant="compact" />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Browse All Events
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl mb-4">
            Have an Event to Share?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Whether you&apos;re a venue, restaurant, or event organizer, we&apos;d love to help 
            you reach Kingston&apos;s event-goers.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-xl font-medium hover:bg-white/90 transition-colors"
          >
            Submit Your Event
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
