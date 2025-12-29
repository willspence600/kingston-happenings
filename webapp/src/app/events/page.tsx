'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, Calendar, Loader2, DollarSign } from 'lucide-react';
import { format, parseISO, isEqual, startOfDay, getDay } from 'date-fns';
import EventCard from '@/components/EventCard';
import CategoryFilter from '@/components/CategoryFilter';
import { useEvents } from '@/contexts/EventsContext';
import { EventCategory } from '@/types/event';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function EventsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') as EventCategory | null;
  const initialDate = searchParams.get('date');

  const { getUpcomingEvents } = useEvents();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(
    initialCategory ? [initialCategory] : []
  );
  const [dateFilter, setDateFilter] = useState(initialDate || '');
  const [showFilters, setShowFilters] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number | null>(null);
  const [includePast, setIncludePast] = useState(false);

  const { events: allEventsFromContext } = useEvents();
  const upcomingEvents = getUpcomingEvents();
  
  // Use all events if includePast is true, otherwise just upcoming
  const allEvents = includePast ? allEventsFromContext : upcomingEvents;

  // Check if food-deal category is selected to show day-of-week filters
  const isFoodDealSelected = selectedCategories.includes('food-deal');

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.venue.name.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategories.length > 0) {
        const hasCategory = event.categories.some(cat => selectedCategories.includes(cat));
        if (!hasCategory) return false;
      }

      // Date filter
      if (dateFilter) {
        const eventDate = startOfDay(parseISO(event.date));
        const filterDate = startOfDay(parseISO(dateFilter));
        if (!isEqual(eventDate, filterDate)) return false;
      }

      // Free filter
      if (freeOnly) {
        if (!event.price || event.price.toLowerCase() !== 'free') return false;
      }

      // Day of week filter (for food deals)
      if (selectedDayOfWeek !== null) {
        const eventDayOfWeek = getDay(parseISO(event.date));
        if (eventDayOfWeek !== selectedDayOfWeek) return false;
      }

      return true;
    });
  }, [allEvents, searchQuery, selectedCategories, dateFilter, freeOnly, selectedDayOfWeek]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setDateFilter('');
    setFreeOnly(false);
    setSelectedDayOfWeek(null);
    setIncludePast(false);
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || dateFilter || freeOnly || selectedDayOfWeek !== null || includePast;

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events, venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className="relative">
          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-11 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none"
          />
        </div>

        {/* Filter Toggle (Mobile) */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden flex items-center justify-center gap-2 px-4 py-3 bg-card border border-border rounded-xl"
        >
          <SlidersHorizontal size={18} />
          Filters
          {selectedCategories.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {selectedCategories.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <CategoryFilter
              selected={selectedCategories}
              onChange={setSelectedCategories}
              events={allEvents}
              showCounts={true}
            />

            {/* Price & Time Filters */}
            <div className="space-y-3">
              <h3 className="font-medium text-foreground">Filters</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeOnly}
                  onChange={(e) => setFreeOnly(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <DollarSign size={14} className="text-muted-foreground" />
                <span className="text-sm text-foreground">Free events only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePast}
                  onChange={(e) => setIncludePast(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <Calendar size={14} className="text-muted-foreground" />
                <span className="text-sm text-foreground">Include past events</span>
              </label>
            </div>

            {/* Day of week filter for food deals */}
            {isFoodDealSelected && (
              <div className="space-y-3">
                <h3 className="font-medium text-foreground">Day of Week</h3>
                <div className="flex flex-wrap gap-1.5">
                  {dayNames.map((day, index) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDayOfWeek(selectedDayOfWeek === index ? null : index)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                        selectedDayOfWeek === index
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-border'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* Mobile Filters Panel */}
        {showFilters && (
          <div className="lg:hidden bg-card border border-border rounded-xl p-4 mb-4 space-y-4">
            <CategoryFilter
              selected={selectedCategories}
              onChange={setSelectedCategories}
              events={allEvents}
              showCounts={true}
            />
            <div className="pt-4 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeOnly}
                  onChange={(e) => setFreeOnly(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <DollarSign size={14} className="text-muted-foreground" />
                <span className="text-sm text-foreground">Free events only</span>
              </label>
            </div>
            {isFoodDealSelected && (
              <div className="pt-4 border-t border-border">
                <h3 className="font-medium text-foreground mb-2">Day of Week</h3>
                <div className="flex flex-wrap gap-1.5">
                  {dayNames.map((day, index) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDayOfWeek(selectedDayOfWeek === index ? null : index)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                        selectedDayOfWeek === index
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-border'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Events Grid */}
        <div className="flex-1">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="lg:hidden text-sm text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted rounded-2xl">
              <Search size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">No Events Found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms.
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function EventsLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );
}

export default function EventsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-muted to-background py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
            Browse Events
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Discover all the events happening in Kingston. Use filters to find exactly what you&apos;re looking for.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<EventsLoading />}>
          <EventsContent />
        </Suspense>
      </div>
    </div>
  );
}
