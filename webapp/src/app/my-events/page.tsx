'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Calendar, ArrowRight, FileText, Clock, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventsContext';
import EventCard from '@/components/EventCard';
import { format, parseISO } from 'date-fns';
import { categoryLabels, categoryColors, EventCategory } from '@/types/event';

interface SubmittedEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime?: string;
  price?: string;
  imageUrl?: string;
  status: string;
  createdAt: string;
  venue: { id: string; name: string; address: string };
  categories: string[];
  likeCount: number;
}

export default function MyEventsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { events, userLikes } = useEvents();
  const [activeTab, setActiveTab] = useState<'liked' | 'submitted'>('liked');
  const [submittedEvents, setSubmittedEvents] = useState<SubmittedEvent[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch submitted events when tab changes or user is organizer
  useEffect(() => {
    if (user && (user.role === 'organizer' || user.role === 'admin')) {
      setLoadingSubmissions(true);
      fetch('/api/events/my-submissions')
        .then(res => res.json())
        .then(data => {
          if (data.events) {
            setSubmittedEvents(data.events);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingSubmissions(false));
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const likedEvents = events.filter(event => userLikes.includes(event.id));
  const isOrganizer = user.role === 'organizer' || user.role === 'admin';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle size={12} />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <AlertTriangle size={12} />
            Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle size={12} />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-muted to-background py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            {activeTab === 'liked' ? (
              <Heart size={32} className="text-primary" />
            ) : (
              <FileText size={32} className="text-primary" />
            )}
            <h1 className="font-display text-4xl sm:text-5xl text-foreground">
              My Events
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {activeTab === 'liked' 
              ? "Events you've saved for later. Never miss out on what interests you."
              : "Events you've submitted. Track their approval status here."
            }
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        {isOrganizer && (
          <div className="flex gap-2 mb-8 border-b border-border">
            <button
              onClick={() => setActiveTab('liked')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'liked'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Heart size={18} />
              Liked Events
              {activeTab === 'liked' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('submitted')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'submitted'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText size={18} />
              My Submissions
              {submittedEvents.filter(e => e.status === 'pending').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                  {submittedEvents.filter(e => e.status === 'pending').length}
                </span>
              )}
              {activeTab === 'submitted' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        )}

        {/* Liked Events Tab */}
        {activeTab === 'liked' && (
          <>
            {likedEvents.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-6">
                  {likedEvents.length} saved event{likedEvents.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {likedEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Heart size={64} className="mx-auto text-muted-foreground mb-4" />
                <h2 className="font-display text-2xl text-foreground mb-2">No Saved Events Yet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  When you find events you&apos;re interested in, click the heart icon to save them here.
                </p>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Browse Events
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </>
        )}

        {/* Submitted Events Tab */}
        {activeTab === 'submitted' && (
          <>
            {loadingSubmissions ? (
              <div className="text-center py-16">
                <Loader2 size={32} className="animate-spin text-primary mx-auto" />
              </div>
            ) : submittedEvents.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-muted-foreground">
                    {submittedEvents.length} submitted event{submittedEvents.length !== 1 ? 's' : ''}
                  </p>
                  <Link
                    href="/submit"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Submit New Event
                  </Link>
                </div>
                <div className="space-y-4">
                  {submittedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-card border border-border rounded-xl overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                          {/* Event Image */}
                          <div className="w-full lg:w-40 h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {event.imageUrl ? (
                              <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                                <Calendar size={28} className="text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Event Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {getStatusBadge(event.status)}
                              {event.categories.slice(0, 2).map((cat) => (
                                <span
                                  key={cat}
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${categoryColors[cat as EventCategory]}`}
                                >
                                  {categoryLabels[cat as EventCategory]}
                                </span>
                              ))}
                            </div>
                            
                            <h3 className="font-display text-lg text-foreground mb-1">
                              {event.title}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {format(parseISO(event.date), 'EEE, MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {format(parseISO(`2000-01-01T${event.startTime}`), 'h:mm a')}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              Submitted {format(parseISO(event.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
                            </p>
                          </div>

                          {/* Actions */}
                          {event.status === 'approved' && (
                            <div className="flex-shrink-0">
                              <Link
                                href={`/events/${event.id}`}
                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                              >
                                View Event
                                <ArrowRight size={16} />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <FileText size={64} className="mx-auto text-muted-foreground mb-4" />
                <h2 className="font-display text-2xl text-foreground mb-2">No Submitted Events Yet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Share your events with Kingston&apos;s community. Submit your first event now!
                </p>
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Submit an Event
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
