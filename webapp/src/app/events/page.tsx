'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, X, Calendar, Loader2, ChevronDown, Utensils, MapPin, ArrowRight, Clock } from 'lucide-react';
import { format, parseISO, isEqual, startOfDay, subDays, subMonths, isToday, isTomorrow } from 'date-fns';
import EventCard from '@/components/EventCard';
import { useEvents } from '@/contexts/EventsContext';
import { EventCategory, categoryLabels, categoryColors, categoryColorsMuted, categoryColorsActive, browseCategories } from '@/types/event';

type TabType = 'all' | 'events' | 'deals';
type PastEventsRange = 'none' | 'week' | 'month' | '3months' | '6months';

// Helper to get holiday/special event for a date
function getHoliday(date: Date): string | null {
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();
  const dayOfWeek = date.getDay(); // 0 = Sunday
  
  // Fixed date holidays
  const fixedHolidays: { [key: string]: string } = {
    '1-1': "New Year's Day 🎉",
    '2-14': "Valentine's Day 💕",
    '3-17': "St. Patrick's Day ☘️",
    '4-1': "April Fools' Day 🃏",
    '5-4': 'Star Wars Day ⭐',
    '6-21': 'Summer Solstice ☀️',
    '7-1': 'Canada Day 🍁',
    '7-4': 'Independence Day 🇺🇸',
    '10-31': 'Halloween 🎃',
    '11-11': 'Remembrance Day 🌺',
    '12-24': 'Christmas Eve 🎄',
    '12-25': 'Christmas Day 🎁',
    '12-26': 'Boxing Day 📦',
    '12-31': "New Year's Eve 🥂",
  };
  
  const key = `${month}-${day}`;
  if (fixedHolidays[key]) {
    return fixedHolidays[key];
  }
  
  // Variable holidays (approximate)
  // Mother's Day - 2nd Sunday of May
  if (month === 5 && dayOfWeek === 0 && day >= 8 && day <= 14) {
    return "Mother's Day 💐";
  }
  // Father's Day - 3rd Sunday of June
  if (month === 6 && dayOfWeek === 0 && day >= 15 && day <= 21) {
    return "Father's Day 👔";
  }
  // Thanksgiving (Canada) - 2nd Monday of October
  if (month === 10 && dayOfWeek === 1 && day >= 8 && day <= 14) {
    return 'Thanksgiving 🦃';
  }
  // Labour Day - 1st Monday of September
  if (month === 9 && dayOfWeek === 1 && day <= 7) {
    return 'Labour Day 👷';
  }
  // Victoria Day - Last Monday before May 25
  if (month === 5 && dayOfWeek === 1 && day >= 18 && day <= 24) {
    return 'Victoria Day 👑';
  }
  
  return null;
}

// Helper function to get promotion tier priority
function getPromotionTierPriority(tier?: string): number {
  switch (tier) {
    case 'featured': return 3;
    case 'promoted': return 2;
    case 'standard': return 1;
    default: return 1;
  }
}

function EventsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') as EventCategory | null;
  const initialDate = searchParams.get('date');
  const tabParam = searchParams.get('tab');
  const initialTab: TabType = tabParam === 'deals' ? 'deals' : tabParam === 'all' ? 'all' : 'events';

  const { events: allEventsFromContext, getUpcomingEvents } = useEvents();
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(
    initialCategory ? [initialCategory] : []
  );
  const [dateFilter, setDateFilter] = useState(initialDate || '');
  const [freeOnly, setFreeOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [priceFilterEnabled, setPriceFilterEnabled] = useState(false);
  const [pastEventsRange, setPastEventsRange] = useState<PastEventsRange>('none');
  const [showPastDropdown, setShowPastDropdown] = useState(false);

  const upcomingEvents = getUpcomingEvents();
  const today = new Date();
  
  // Calculate date range for past events
  const getDateCutoff = () => {
    switch (pastEventsRange) {
      case 'week': return subDays(today, 7);
      case 'month': return subMonths(today, 1);
      case '3months': return subMonths(today, 3);
      case '6months': return subMonths(today, 6);
      default: return today;
    }
  };

  // Get events based on past events filter
  const eventsPool = useMemo(() => {
    if (pastEventsRange === 'none') {
      return upcomingEvents;
    }
    const cutoff = getDateCutoff();
    return allEventsFromContext.filter(event => {
      const eventDate = parseISO(event.date);
      return eventDate >= cutoff;
    });
  }, [allEventsFromContext, upcomingEvents, pastEventsRange]);

  // Separate events and deals from the pool
  const eventsOnly = useMemo(() => {
    return eventsPool.filter(event => !event.categories.includes('food-deal'));
  }, [eventsPool]);

  const dealsOnly = useMemo(() => {
    return eventsPool
      .filter(event => event.categories.includes('food-deal'))
      .sort((a, b) => {
        // Sort by sortOrder first, then by date and time
        if (a.sortOrder !== null && a.sortOrder !== undefined && b.sortOrder !== null && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        if (a.sortOrder !== null && a.sortOrder !== undefined) return -1;
        if (b.sortOrder !== null && b.sortOrder !== undefined) return 1;
        return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
      });
  }, [eventsPool]);

  // Filter events based on filters
  const filteredEvents = useMemo(() => {
    return eventsOnly.filter((event) => {
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

      // Price range filter
      if (priceFilterEnabled && !freeOnly) {
        if (event.price) {
          const priceMatch = event.price.match(/\$?(\d+)/);
          if (priceMatch) {
            const eventPrice = parseInt(priceMatch[1], 10);
            if (eventPrice > maxPrice) return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by promotion tier priority (higher first), then by date, then by time
      const aPriority = getPromotionTierPriority(a.venue?.promotionTier);
      const bPriority = getPromotionTierPriority(b.venue?.promotionTier);
      if (bPriority !== aPriority) {
        return bPriority - aPriority;
      }
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }, [eventsOnly, searchQuery, selectedCategories, dateFilter, freeOnly, priceFilterEnabled, maxPrice]);

  // Filter deals based on filters
  const filteredDeals = useMemo(() => {
    return dealsOnly.filter((event) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.venue.name.toLowerCase().includes(query);
        if (!matchesSearch) return false;
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

      // Price range filter
      if (priceFilterEnabled && !freeOnly) {
        if (event.price) {
          const priceMatch = event.price.match(/\$?(\d+)/);
          if (priceMatch) {
            const eventPrice = parseInt(priceMatch[1], 10);
            if (eventPrice > maxPrice) return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by promotion tier priority (higher first), then by date, then by time
      const aPriority = getPromotionTierPriority(a.venue?.promotionTier);
      const bPriority = getPromotionTierPriority(b.venue?.promotionTier);
      if (bPriority !== aPriority) {
        return bPriority - aPriority;
      }
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }, [dealsOnly, searchQuery, dateFilter, freeOnly, priceFilterEnabled, maxPrice]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: { [date: string]: typeof filteredEvents } = {};
    
    filteredEvents.forEach(event => {
      const dateKey = event.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // Sort events within each date group by promotion tier, then time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        const aPriority = getPromotionTierPriority(a.venue?.promotionTier);
        const bPriority = getPromotionTierPriority(b.venue?.promotionTier);
        if (bPriority !== aPriority) {
          return bPriority - aPriority;
        }
        return a.startTime.localeCompare(b.startTime);
      });
    });

    // Sort dates and return as array of [date, events] pairs
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  // Group deals by date (for deals tab)
  const dealsByDate = useMemo(() => {
    const grouped: { [date: string]: typeof filteredDeals } = {};
    
    filteredDeals.forEach(deal => {
      const dateKey = deal.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(deal);
    });

    // Sort deals within each date group by promotion tier, then time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        const aPriority = getPromotionTierPriority(a.venue?.promotionTier);
        const bPriority = getPromotionTierPriority(b.venue?.promotionTier);
        if (bPriority !== aPriority) {
          return bPriority - aPriority;
        }
        return a.startTime.localeCompare(b.startTime);
      });
    });

    // Sort dates and return as array of [date, deals] pairs
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredDeals]);

  // Group deals by venue (for deals tab)
  const dealsByVenue = useMemo(() => {
    const grouped: { [venueName: string]: typeof filteredDeals } = {};
    
    filteredDeals.forEach(deal => {
      const venueName = deal.venue.name;
      if (!grouped[venueName]) {
        grouped[venueName] = [];
      }
      grouped[venueName].push(deal);
    });

    // Sort venues alphabetically and return as array of [venue, deals] pairs
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredDeals]);

  // Get all unique dates for "All" tab (combining events and deals)
  const allDates = useMemo(() => {
    const dateSet = new Set<string>();
    filteredEvents.forEach(e => dateSet.add(e.date));
    filteredDeals.forEach(d => dateSet.add(d.date));
    return Array.from(dateSet).sort((a, b) => a.localeCompare(b));
  }, [filteredEvents, filteredDeals]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setDateFilter('');
    setFreeOnly(false);
    setMaxPrice(100);
    setPriceFilterEnabled(false);
    setPastEventsRange('none');
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || dateFilter || freeOnly || priceFilterEnabled || pastEventsRange !== 'none';

  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const pastEventsLabels: Record<PastEventsRange, string> = {
    'none': 'Include Past Events',
    'week': 'Past Week',
    'month': 'Past Month',
    '3months': 'Past 3 Months',
    '6months': 'Past 6 Months',
  };

  return (
    <>
      {/* Tabs + Search/Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 lg:pl-60">
        {/* Left - Tab Buttons (aligned with main content area) */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 rounded-xl font-semibold text-base transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                : 'bg-card text-foreground border-2 border-border hover:border-primary/50 hover:shadow-md'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-3 rounded-xl font-semibold text-base transition-all ${
              activeTab === 'events'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                : 'bg-card text-foreground border-2 border-border hover:border-primary/50 hover:shadow-md'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-6 py-3 rounded-xl font-semibold text-base transition-all ${
              activeTab === 'deals'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                : 'bg-card text-foreground border-2 border-border hover:border-primary/50 hover:shadow-md'
            }`}
          >
            Food & Drink Specials
          </button>
        </div>
        
        {/* Right - Search and Calendar Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-56">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
                placeholder={activeTab === 'deals' ? "Search specials..." : activeTab === 'all' ? "Search all..." : "Search events..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
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

            {/* Calendar Filter */}
        <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-40 pl-10 pr-3 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
          />
            </div>
          </div>
        </div>

      {/* "All" Tab - Categories sidebar + Content grouped by date */}
      {activeTab === 'all' && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Categories (same size as Events tab) */}
          <aside className="lg:w-52 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Categories Section */}
              <div>
                <h3 className="font-medium text-foreground mb-3">Categories</h3>
                <div className="space-y-1">
                  {[...browseCategories]
                    .map(category => ({
                      category,
                      count: eventsOnly.filter(e => e.categories.includes(category)).length
                    }))
                    .sort((a, b) => b.count - a.count)
                    .map(({ category, count }) => {
                      const isSelected = selectedCategories.includes(category);
                      return (
        <button
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-all ${
                            isSelected
                              ? categoryColorsActive[category]
                              : categoryColorsMuted[category]
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-white' : categoryColors[category]}`} />
                            <span className="truncate">{categoryLabels[category]}</span>
                          </span>
                          <span className={`text-xs flex-shrink-0 ${isSelected ? 'opacity-70' : 'opacity-50'}`}>
                            {count}
            </span>
        </button>
                      );
                    })}
                </div>
      </div>

              {/* Filters Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Filters</h3>
                
                {/* Free Only */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={freeOnly}
                    onChange={(e) => {
                      setFreeOnly(e.target.checked);
                      if (e.target.checked) setPriceFilterEnabled(false);
                    }}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">Free only</span>
                </label>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content - Events and Specials grouped by date */}
          <div className="flex-1">
            {allDates.length > 0 ? (
              <div className="space-y-10">
                {allDates.map((dateStr, index) => {
                  const date = parseISO(dateStr);
                  const headingLabel = isToday(date) 
                    ? 'Happening Today' 
                    : isTomorrow(date) 
                      ? 'Happening Tomorrow' 
                      : `Happening ${format(date, 'EEEE')}`;
                  const dateDisplay = format(date, 'EEEE, MMMM d');
                  const holiday = getHoliday(date);
                  
                  const eventsForDate = filteredEvents.filter(e => e.date === dateStr);
                  const dealsForDate = filteredDeals.filter(d => d.date === dateStr);
                  
                  return (
                    <div key={dateStr}>
                      {/* Date Section Header */}
                      <div className="mb-6 pb-2 border-b border-border">
                        <p className="text-primary font-medium text-base uppercase tracking-wider">
                          {dateDisplay}
                          {holiday && (
                            <span className="ml-2 normal-case tracking-normal">• {holiday}</span>
                          )}
                        </p>
                        <h3 className="font-display text-2xl text-foreground">
                          {headingLabel}
                        </h3>
                      </div>
                      
                      {/* Two columns: Events and Food & Drink Specials side by side */}
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Events Column */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
                            <Calendar size={18} className="text-primary" />
                            Events
                            <span className="text-sm font-normal text-muted-foreground">({eventsForDate.length})</span>
                          </h4>
                          {eventsForDate.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {eventsForDate.map((event) => (
                                <EventCard key={event.id} event={event} compact />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-muted rounded-xl">
                              <Calendar size={24} className="mx-auto text-muted-foreground mb-2" />
                              <p className="text-muted-foreground text-sm">No events</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Food & Drink Specials Column */}
                        <div className="lg:w-80 flex-shrink-0">
                          <h4 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
                            <Utensils size={18} className="text-primary" />
                            Food & Drink Specials
                            <span className="text-sm font-normal text-muted-foreground">({dealsForDate.length})</span>
                          </h4>
                          {dealsForDate.length > 0 ? (
            <div className="space-y-3">
                              {dealsForDate.map((deal) => (
                                <Link
                                  key={deal.id}
                                  href={`/events/${deal.id}`}
                                  className="group flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md"
                                >
                                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                    {deal.imageUrl ? (
                                      <img
                                        src={deal.imageUrl}
                                        alt={deal.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                        <Utensils size={18} className="text-primary" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 text-sm">
                                      {deal.title}
                                    </h5>
                                    <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                                      <MapPin size={10} />
                                      {deal.venue.name}
                                    </p>
                                    {deal.price && (
                                      <p className="text-primary font-medium text-xs mt-1">
                                        {deal.price}
                                      </p>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-muted rounded-xl">
                              <Utensils size={24} className="mx-auto text-muted-foreground mb-2" />
                              <p className="text-muted-foreground text-sm">No specials</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted rounded-2xl">
                <Search size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display text-xl text-foreground mb-2">
                  Nothing Found
                </h3>
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
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <aside className="lg:w-52 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Categories Section */}
              <div>
                <h3 className="font-medium text-foreground mb-3">Categories</h3>
                <div className="space-y-1">
                  {[...browseCategories]
                    .map(category => ({
                      category,
                      count: eventsOnly.filter(e => e.categories.includes(category)).length
                    }))
                    .sort((a, b) => b.count - a.count)
                    .map(({ category, count }) => {
                      const isSelected = selectedCategories.includes(category);
                      return (
                        <button
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-all ${
                            isSelected
                              ? categoryColorsActive[category]
                              : categoryColorsMuted[category]
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-white' : categoryColors[category]}`} />
                            <span className="truncate">{categoryLabels[category]}</span>
                          </span>
                          <span className={`text-xs flex-shrink-0 ${isSelected ? 'opacity-70' : 'opacity-50'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Filters Section */}
              <div className="space-y-4">
              <h3 className="font-medium text-foreground">Filters</h3>
                
                {/* Free Only */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeOnly}
                    onChange={(e) => {
                      setFreeOnly(e.target.checked);
                      if (e.target.checked) setPriceFilterEnabled(false);
                    }}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                  <span className="text-sm text-foreground">Free only</span>
              </label>

                {/* Price Range Slider */}
                {!freeOnly && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                          checked={priceFilterEnabled}
                          onChange={(e) => setPriceFilterEnabled(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                        <span className="text-sm text-foreground">Max price</span>
              </label>
                      {priceFilterEnabled && (
                        <span className="text-sm font-medium text-primary">${maxPrice}</span>
                      )}
                    </div>
                    {priceFilterEnabled && (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    )}
            </div>
                )}

                {/* Past Events Checkbox + Dropdown */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pastEventsRange !== 'none'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPastEventsRange('week');
                          setShowPastDropdown(true);
                        } else {
                          setPastEventsRange('none');
                          setShowPastDropdown(false);
                        }
                      }}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Include Past Events</span>
                  </label>
                  
                  {pastEventsRange !== 'none' && (
                    <div className="relative ml-6">
                      <button
                        onClick={() => setShowPastDropdown(!showPastDropdown)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium"
                      >
                        {pastEventsLabels[pastEventsRange]}
                        <ChevronDown size={14} className={`transition-transform ${showPastDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showPastDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowPastDropdown(false)} />
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                            {(['week', 'month', '3months', '6months'] as PastEventsRange[]).map((range) => (
                    <button
                                key={range}
                                onClick={() => {
                                  setPastEventsRange(range);
                                  setShowPastDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                                  pastEventsRange === range ? 'bg-primary/10 text-primary' : 'text-foreground'
                                }`}
                              >
                                {pastEventsLabels[range]}
                    </button>
                  ))}
                </div>
                        </>
                      )}
              </div>
            )}
                </div>

                {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
            </div>
          </aside>

          {/* Events Grid */}
          <div className="flex-1">
            {filteredEvents.length > 0 ? (
              <div className="space-y-10">
                {eventsByDate.map(([dateStr, events], index) => {
                  const date = parseISO(dateStr);
                  const headingLabel = isToday(date) 
                    ? 'Happening Today' 
                    : isTomorrow(date) 
                      ? 'Happening Tomorrow' 
                      : `Happening ${format(date, 'EEEE')}`;
                  const dateDisplay = format(date, 'EEEE, MMMM d');
                  const holiday = getHoliday(date);
                  
                  return (
                    <div key={dateStr}>
                      {/* Date Section Header */}
                      <div className="mb-4 pb-2 border-b border-border">
                        <p className="text-primary font-medium text-base uppercase tracking-wider">
                          {dateDisplay}
                          {holiday && (
                            <span className="ml-2 normal-case tracking-normal">• {holiday}</span>
                          )}
                        </p>
                        <h3 className="font-display text-2xl text-foreground">
                          {headingLabel}
                        </h3>
                      </div>
                      
                      {/* Events Grid for this date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {events.map((event) => (
                          <EventCard key={event.id} event={event} />
                  ))}
                </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted rounded-2xl">
                <Search size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display text-xl text-foreground mb-2">
                  No Events Found
                </h3>
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
      )}

      {/* Deals Tab - Grouped by Date */}
      {activeTab === 'deals' && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-52 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Filters Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Filters</h3>
                
                {/* Free Only */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={freeOnly}
                    onChange={(e) => {
                      setFreeOnly(e.target.checked);
                      if (e.target.checked) setPriceFilterEnabled(false);
                    }}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">Free only</span>
                </label>

                {/* Price Range Slider */}
                {!freeOnly && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={priceFilterEnabled}
                          onChange={(e) => setPriceFilterEnabled(e.target.checked)}
                          className="w-4 h-4 text-primary rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Max price</span>
                      </label>
                      {priceFilterEnabled && (
                        <span className="text-sm font-medium text-primary">${maxPrice}</span>
                      )}
                    </div>
                    {priceFilterEnabled && (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
            )}
          </div>
        )}

                {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                    className="w-full px-4 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
              >
                    Clear All Filters
              </button>
            )}
              </div>
            </div>
          </aside>

          {/* Deals Grid - Grouped by Date, then by Venue */}
          <div className="flex-1">
            {filteredDeals.length > 0 ? (
              <div className="space-y-10">
                {dealsByDate.map(([dateStr, dealsForDate]) => {
                  const date = parseISO(dateStr);
                  const headingLabel = isToday(date) 
                    ? 'Happening Today' 
                    : isTomorrow(date) 
                      ? 'Happening Tomorrow' 
                      : `Happening ${format(date, 'EEEE')}`;
                  const dateDisplay = format(date, 'EEEE, MMMM d');
                  const holiday = getHoliday(date);
                  
                  // Group deals for this date by venue
                  const venueGrouped: { [venueName: string]: typeof dealsForDate } = {};
                  dealsForDate.forEach(deal => {
                    const venueName = deal.venue.name;
                    if (!venueGrouped[venueName]) {
                      venueGrouped[venueName] = [];
                    }
                    venueGrouped[venueName].push(deal);
                  });
                  const venueEntries = Object.entries(venueGrouped).sort(([venueA, dealsA], [venueB, dealsB]) => {
                    // Sort by promotion tier (higher priority first), then alphabetically by venue name
                    const tierA = getPromotionTierPriority(dealsA[0]?.venue?.promotionTier);
                    const tierB = getPromotionTierPriority(dealsB[0]?.venue?.promotionTier);
                    if (tierB !== tierA) {
                      return tierB - tierA;
                    }
                    return venueA.localeCompare(venueB);
                  });
                  
                  return (
                    <div key={dateStr}>
                      {/* Date Section Header */}
                      <div className="mb-4 pb-2 border-b border-border">
                        <p className="text-primary font-medium text-base uppercase tracking-wider">
                          {dateDisplay}
                          {holiday && (
                            <span className="ml-2 normal-case tracking-normal">• {holiday}</span>
                          )}
                        </p>
                        <h3 className="font-display text-2xl text-foreground">
                          {headingLabel}
                        </h3>
                      </div>
                      
                      {/* Venue Cards - 2 columns masonry layout */}
                      <div className="columns-1 md:columns-2 gap-6">
                        {venueEntries.map(([venueName, deals]) => (
                          <div key={venueName} className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col mb-6 break-inside-avoid">
                            {/* Venue Header with Image */}
                            <div className="relative">
                              {/* Venue Image Slot - defaults to homepage banner gradient */}
                              <div className="h-20 bg-muted overflow-hidden">
                                {deals[0]?.venue.imageUrl ? (
                                  <img
                                    src={deals[0].venue.imageUrl}
                                    alt={venueName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-secondary via-secondary/95 to-primary/80 relative">
                                    <div className="absolute inset-0 pattern-bg opacity-10" />
                                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/30 rounded-full blur-2xl" />
                                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Venue Info Overlay */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                <Link 
                                  href={`/venues/${deals[0]?.venue.id}`}
                                  className="hover:underline"
                                >
                                  <h4 className="font-display text-lg text-white">{venueName}</h4>
                                </Link>
                                {deals[0]?.venue.address && (
                                  <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                                    <MapPin size={12} />
                                    {deals[0].venue.address}
                                  </p>
                                )}
                              </div>
          </div>

                            {/* Specials List */}
                            <div className="p-4 space-y-3">
                              {deals.map((deal) => (
                                <Link
                                  key={deal.id}
                                  href={`/events/${deal.id}`}
                                  className="group flex gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-all"
                                >
                                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                        {deal.imageUrl ? (
                                          <img
                                            src={deal.imageUrl}
                                            alt={deal.title}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                            <Utensils size={20} className="text-primary" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                          {deal.title}
                                        </h5>
                                        {deal.description && (
                                          <p className="text-muted-foreground text-xs line-clamp-1 mt-0.5">
                                            {deal.description}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5">
                                          {deal.price && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                                              {deal.price}
                                            </span>
                                          )}
                                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                                            <Clock size={10} />
                                            {format(parseISO(`2000-01-01T${deal.startTime}`), 'h:mm a')}
                                            {deal.endTime && ` - ${format(parseISO(`2000-01-01T${deal.endTime}`), 'h:mm a')}`}
                                          </span>
                                        </div>
                                      </div>
                                    </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted rounded-2xl">
                <Utensils size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display text-xl text-foreground mb-2">
                  No Specials Found
                </h3>
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
      )}
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
      <section className="bg-gradient-to-br from-muted to-background py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-2">
            Browse
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover all the events happening in Kingston.
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
