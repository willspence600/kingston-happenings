'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  FileText,
  AlertTriangle,
  Loader2,
  Building,
  Trash2,
  Ban,
  Repeat
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventsContext';
import { categoryLabels, categoryColors, EventCategory } from '@/types/event';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';

interface PendingVenue {
  id: string;
  name: string;
  address: string;
  status: string;
  createdAt: string;
}

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'confirm' | 'warning';
  confirmText: string;
  onConfirm: () => void;
}

interface ToastState {
  isVisible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

const initialModalState: ModalState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'confirm',
  confirmText: 'Confirm',
  onConfirm: () => {},
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { pendingEvents, events, approveEvent, rejectEvent, refreshPendingEvents, refreshEvents, isLoading: eventsLoading } = useEvents();
  const [pendingVenues, setPendingVenues] = useState<PendingVenue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(initialModalState);
  const [toast, setToast] = useState<ToastState>({ isVisible: false, message: '', type: 'success' });
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);
  const [clickedApproveId, setClickedApproveId] = useState<string | null>(null);
  const [clickedRejectId, setClickedRejectId] = useState<string | null>(null);

  const fetchPendingVenues = useCallback(async () => {
    setLoadingVenues(true);
    try {
      const res = await fetch('/api/venues?status=pending');
      if (res.ok) {
        const data = await res.json();
        setPendingVenues(data.venues || []);
      }
    } catch (error) {
      console.error('Failed to fetch pending venues:', error);
    } finally {
      setLoadingVenues(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/login');
    }
  }, [isAdmin, authLoading, router]);

  // Refresh pending events and venues when admin loads the page
  useEffect(() => {
    if (isAdmin) {
      refreshPendingEvents();
      fetchPendingVenues();
    }
  }, [isAdmin, refreshPendingEvents, fetchPendingVenues]);

  if (authLoading || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const closeModal = () => setModal(initialModalState);
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ isVisible: true, message, type });
  };

  // Double-click to approve: first click shows confirmation state, second click approves
  const handleApproveClick = async (eventId: string, parentEventId?: string) => {
    if (clickedApproveId === eventId) {
      // Second click - actually approve
      setProcessingEventId(eventId);
      setClickedApproveId(null);
      
      // If this is a recurring event parent, approve all related events
      if (parentEventId) {
        try {
          const res = await fetch(`/api/events/approve-recurring/${parentEventId}`, { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            showToast(`Approved ${data.count} recurring events`, 'success');
            await refreshPendingEvents();
            await refreshEvents();
          }
        } catch (error) {
          showToast('Failed to approve events', 'error');
        }
      } else {
        await approveEvent(eventId);
        showToast('Event approved', 'success');
      }
      setProcessingEventId(null);
    } else {
      // First click - show confirmation state
      setClickedApproveId(eventId);
      setClickedRejectId(null);
      // Reset after 3 seconds if not clicked again
      setTimeout(() => setClickedApproveId(prev => prev === eventId ? null : prev), 3000);
    }
  };

  // Double-click to reject
  const handleRejectClick = async (eventId: string, parentEventId?: string) => {
    if (clickedRejectId === eventId) {
      // Second click - show modal for destructive action
      setModal({
        isOpen: true,
        title: 'Reject Event',
        message: parentEventId 
          ? 'This will reject ALL instances of this recurring event. This action cannot be undone.'
          : 'This event will be permanently deleted. This action cannot be undone.',
        type: 'warning',
        confirmText: 'Reject',
        onConfirm: async () => {
          setProcessingEventId(eventId);
          if (parentEventId) {
            try {
              const res = await fetch(`/api/events/reject-recurring/${parentEventId}`, { method: 'POST' });
              if (res.ok) {
                const data = await res.json();
                showToast(`Rejected ${data.count} recurring events`, 'info');
                await refreshPendingEvents();
              }
            } catch (error) {
              showToast('Failed to reject events', 'error');
            }
          } else {
            await rejectEvent(eventId);
            showToast('Event rejected', 'info');
          }
          setProcessingEventId(null);
        },
      });
      setClickedRejectId(null);
    } else {
      // First click - show confirmation state
      setClickedRejectId(eventId);
      setClickedApproveId(null);
      setTimeout(() => setClickedRejectId(prev => prev === eventId ? null : prev), 3000);
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    setModal({
      isOpen: true,
      title: 'Cancel Event',
      message: 'This event will be marked as cancelled but not deleted. Users will see it as cancelled.',
      type: 'warning',
      confirmText: 'Cancel Event',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/events/${eventId}/cancel`, { method: 'POST' });
          if (res.ok) {
            showToast('Event marked as cancelled', 'success');
            await refreshEvents();
          }
        } catch (error) {
          showToast('Failed to cancel event', 'error');
        }
      },
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setModal({
      isOpen: true,
      title: 'Delete Event',
      message: 'This event will be permanently deleted. This action cannot be undone.',
      type: 'warning',
      confirmText: 'Delete',
      onConfirm: async () => {
        setDeletingEventId(eventId);
        try {
          const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
          if (res.ok) {
            await refreshEvents();
            await refreshPendingEvents();
          }
        } catch (error) {
          console.error('Failed to delete event:', error);
        } finally {
          setDeletingEventId(null);
        }
      },
    });
  };

  const handleApproveVenue = (venueId: string) => {
    setModal({
      isOpen: true,
      title: 'Approve Venue',
      message: 'This venue will be available for event submissions. Are you sure you want to approve it?',
      type: 'confirm',
      confirmText: 'Approve',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/venues/${venueId}/approve`, { method: 'POST' });
          if (res.ok) {
            await fetchPendingVenues();
          }
        } catch (error) {
          console.error('Failed to approve venue:', error);
        }
      },
    });
  };

  const handleRejectVenue = (venueId: string) => {
    setModal({
      isOpen: true,
      title: 'Reject Venue',
      message: 'This venue will be permanently deleted. This action cannot be undone.',
      type: 'warning',
      confirmText: 'Reject',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/venues/${venueId}/reject`, { method: 'POST' });
          if (res.ok) {
            await fetchPendingVenues();
          }
        } catch (error) {
          console.error('Failed to reject venue:', error);
        }
      },
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-red-900 to-red-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={32} />
            <h1 className="font-display text-4xl">Admin Dashboard</h1>
          </div>
          <p className="text-white/80">
            Manage events, venues, approve submissions, and monitor the platform.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertTriangle size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-display text-foreground">{pendingEvents.length}</p>
                <p className="text-sm text-muted-foreground">Pending Events</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Building size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-display text-foreground">{pendingVenues.length}</p>
                <p className="text-sm text-muted-foreground">Pending Venues</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-display text-foreground">{events.length}</p>
                <p className="text-sm text-muted-foreground">Published Events</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-display text-foreground">—</p>
                <p className="text-sm text-muted-foreground">Registered Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Venues */}
        {pendingVenues.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
              <Building size={24} className="text-amber-500" />
              Pending Venue Submissions
            </h2>

            <div className="space-y-4">
              {pendingVenues.map((venue) => (
                <div
                  key={venue.id}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg text-foreground mb-1">
                        {venue.name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin size={14} />
                        {venue.address}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveVenue(venue.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check size={18} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectVenue(venue.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X size={18} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pending Events */}
        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
            <AlertTriangle size={24} className="text-orange-500" />
            Pending Event Submissions
          </h2>

          {pendingEvents.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Check size={48} className="mx-auto text-green-500 mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">No events pending approval.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Event Image */}
                      <div className="w-full lg:w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {event.imageUrl ? (
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                            <Calendar size={32} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {event.categories.map((cat) => (
                            <span
                              key={cat}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${categoryColors[cat as EventCategory]}`}
                            >
                              {categoryLabels[cat as EventCategory]}
                            </span>
                          ))}
                        </div>
                        
                        <h3 className="font-display text-xl text-foreground mb-2">
                          {event.title}
                        </h3>
                        
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {format(parseISO(event.date), 'EEE, MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {format(parseISO(`2000-01-01T${event.startTime}`), 'h:mm a')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {event.venue.name}
                          </span>
                        </div>
                        
                        {event.price && (
                          <p className="mt-2 text-sm font-medium text-primary">
                            {event.price}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApproveClick(event.id, event.parentEventId)}
                          disabled={processingEventId === event.id}
                          className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            clickedApproveId === event.id
                              ? 'bg-green-700 text-white ring-2 ring-green-400'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          } disabled:opacity-50`}
                        >
                          {processingEventId === event.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Check size={18} />
                          )}
                          {clickedApproveId === event.id ? 'Click to confirm' : (event.parentEventId ? 'Approve All' : 'Approve')}
                        </button>
                        <button
                          onClick={() => handleRejectClick(event.id, event.parentEventId)}
                          disabled={processingEventId === event.id}
                          className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            clickedRejectId === event.id
                              ? 'bg-red-700 text-white ring-2 ring-red-400'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          } disabled:opacity-50`}
                        >
                          <X size={18} />
                          {clickedRejectId === event.id ? 'Click to confirm' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Published Events (with delete option) */}
        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
            <FileText size={24} className="text-green-500" />
            Published Events
          </h2>

          {events.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">No Published Events</h3>
              <p className="text-muted-foreground">Events will appear here once approved.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                          <Calendar size={16} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(event.date), 'MMM d, yyyy')} • {event.venue.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/events/${event.id}`}
                      className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleCancelEvent(event.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Ban size={14} />
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      disabled={deletingEventId === event.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingEventId === event.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {events.length > 10 && (
                <div className="text-center pt-4">
                  <Link
                    href="/events"
                    className="text-primary hover:underline font-medium"
                  >
                    View all {events.length} events →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="font-display text-2xl text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/events"
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <FileText size={24} className="text-primary mb-3" />
              <h3 className="font-medium text-foreground mb-1">View All Events</h3>
              <p className="text-sm text-muted-foreground">Browse and manage published events</p>
            </Link>
            <Link
              href="/venues"
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <MapPin size={24} className="text-primary mb-3" />
              <h3 className="font-medium text-foreground mb-1">Manage Venues</h3>
              <p className="text-sm text-muted-foreground">View and edit venue listings</p>
            </Link>
            <Link
              href="/submit"
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <Calendar size={24} className="text-primary mb-3" />
              <h3 className="font-medium text-foreground mb-1">Add Event</h3>
              <p className="text-sm text-muted-foreground">Create a new event directly</p>
            </Link>
          </div>
        </section>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        onConfirm={modal.onConfirm}
      />

      {/* Toast notifications */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}
