'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  ArrowRight
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { useEvents } from '@/contexts/EventsContext';
import { categoryColors, categoryLabels, EventCategory } from '@/types/event';
import EventCard from '@/components/EventCard';

export default function CalendarPage() {
  const { getEventsByDate } = useEvents();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const selectedDateEvents = selectedDate 
    ? getEventsByDate(format(selectedDate, 'yyyy-MM-dd'))
    : [];

  const getEventsForDay = (date: Date) => {
    return getEventsByDate(format(date, 'yyyy-MM-dd'));
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-muted to-background py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
            Event Calendar
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Plan ahead and discover all the events happening in Kingston this month.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
              {/* Legend at Top */}
              <div className="mb-6 pb-4 border-b border-border">
                <p className="text-sm text-muted-foreground mb-3">Event Categories</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {(Object.entries(categoryColors) as [EventCategory, string][]).map(([category, color]) => (
                    <div key={category} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-xs text-muted-foreground">
                        {categoryLabels[category]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl text-foreground">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isDayToday = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative aspect-square p-1 sm:p-2 rounded-xl transition-all
                        ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'}
                        ${isSelected ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card' : 'hover:bg-muted'}
                        ${isDayToday && !isSelected ? 'bg-accent/20' : ''}
                      `}
                    >
                      <span className={`
                        text-sm sm:text-base font-medium
                        ${isDayToday && !isSelected ? 'text-primary' : ''}
                      `}>
                        {format(day, 'd')}
                      </span>
                      
                      {/* Event indicators */}
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-primary-foreground' : categoryColors[event.categories[0]]
                              }`}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/50' : 'bg-muted-foreground'}`} />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Selected Day Events */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon size={20} className="text-primary" />
                  <h3 className="font-display text-xl text-foreground">
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a Date'}
                  </h3>
                </div>

                {selectedDate && (
                  <>
                    {selectedDateEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDateEvents.map((event) => (
                          <EventCard key={event.id} event={event} variant="compact" />
                        ))}
                        
                        <Link
                          href={`/events?date=${format(selectedDate, 'yyyy-MM-dd')}`}
                          className="flex items-center justify-center gap-2 w-full py-2 text-sm text-primary hover:underline"
                        >
                          See all events
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CalendarIcon size={32} className="mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground text-sm">
                          No events scheduled for this day.
                        </p>
                        <Link
                          href="/submit"
                          className="inline-block mt-4 text-sm text-primary hover:underline"
                        >
                          Submit an event
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-display text-primary">
                    {getEventsForDay(new Date()).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Today&apos;s Events</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-display text-secondary">
                    {days.reduce((sum, day) => sum + getEventsForDay(day).length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
