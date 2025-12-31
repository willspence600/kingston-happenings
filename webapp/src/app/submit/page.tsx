'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Tag, 
  DollarSign,
  Upload,
  Link as LinkIcon,
  Send,
  CheckCircle,
  Info,
  AlertCircle,
  Loader2,
  Plus,
  X,
  LogIn,
  Repeat
} from 'lucide-react';
import { categoryLabels, EventCategory } from '@/types/event';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventsContext';

const allCategories: EventCategory[] = [
  'live-music', 'activity-nights', 'daytime', 'sports', 'all-day',
  '19plus', 'workshop', 'concert', 'theatre', 'market', 'nightlife',
  'food-deal', 'trivia', 'festival', 'family', 'community'
];

// Generate a unique ID (compatible with older browsers)
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Generate time options for dropdown (every 15 minutes)
const generateTimeOptions = () => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      const value = `${h}:${m}`;
      
      // Format for display (12-hour with AM/PM)
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const label = `${displayHour}:${m.padStart(2, '0')} ${ampm}`;
      
      options.push({ value, label });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

// Normalize URL - add https:// if missing
const normalizeUrl = (url: string): string => {
  if (!url) return '';
  url = url.trim();
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

type PriceType = 'na' | 'free' | 'amount';
type RecurrencePattern = 'none' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface EventFormData {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venueId: string;
  newVenueName: string;
  newVenueAddress: string;
  categories: EventCategory[];
  priceType: PriceType;
  priceAmount: string;
  ticketUrl: string;
  imageFile: File | null;
  imagePreview: string;
  // Recurrence fields
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  recurrenceEndDate: string;
  // Multiple dates option
  customDates: string[];
  // All day option
  isAllDay: boolean;
}

const createEmptyForm = (): EventFormData => ({
  id: generateId(),
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  venueId: '',
  newVenueName: '',
  newVenueAddress: '',
  categories: [],
  priceType: 'na',
  priceAmount: '',
  ticketUrl: '',
  imageFile: null,
  imagePreview: '',
  isRecurring: false,
  recurrencePattern: 'none',
  recurrenceEndDate: '',
  customDates: [],
  isAllDay: false,
});

const MAX_DESCRIPTION_LENGTH = 500;

export default function SubmitEventPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { submitEvent, venues } = useEvents();
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [eventForms, setEventForms] = useState<EventFormData[]>([createEmptyForm()]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleCategoryToggle = (formId: string, category: EventCategory) => {
    setEventForms(prev => prev.map(form => {
      if (form.id !== formId) return form;
      return {
        ...form,
        categories: form.categories.includes(category)
          ? form.categories.filter(c => c !== category)
          : [...form.categories, category]
      };
    }));
  };

  const updateForm = (formId: string, updates: Partial<EventFormData>) => {
    setEventForms(prev => prev.map(form => 
      form.id === formId ? { ...form, ...updates } : form
    ));
  };

  const handleImageDrop = useCallback((formId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(formId, file);
    }
  }, []);

  const handleImageSelect = (formId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      updateForm(formId, {
        imageFile: file,
        imagePreview: e.target?.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (formId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(formId, file);
    }
  };

  const removeImage = (formId: string) => {
    updateForm(formId, { imageFile: null, imagePreview: '' });
    if (fileInputRefs.current[formId]) {
      fileInputRefs.current[formId]!.value = '';
    }
  };

  const addAnotherEvent = () => {
    setEventForms(prev => [...prev, createEmptyForm()]);
  };

  const removeEventForm = (formId: string) => {
    if (eventForms.length > 1) {
      setEventForms(prev => prev.filter(form => form.id !== formId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all forms
    for (const form of eventForms) {
      if (form.categories.length === 0) {
        setError(`Please select at least one category for "${form.title || 'untitled event'}"`);
        return;
      }

      if (!form.venueId && (!form.newVenueName || !form.newVenueAddress)) {
        setError(`Please select a venue or enter new venue details for "${form.title || 'untitled event'}"`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Submit all events
      for (const form of eventForms) {
        // Convert image to base64 data URL for storage (for demo purposes)
        // In production, you'd upload to a cloud storage service
        const imageUrl = form.imagePreview || undefined;

        // Convert price type to string
        let priceString: string | undefined;
        if (form.priceType === 'free') {
          priceString = 'Free';
        } else if (form.priceType === 'amount' && form.priceAmount) {
          priceString = `$${form.priceAmount}`;
        }
        // If 'na', priceString stays undefined (nothing shows)

        await submitEvent({
          title: form.title,
          description: form.description,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime || undefined,
          venueId: form.venueId === 'new' ? 'new' : form.venueId || undefined,
          newVenueName: form.venueId === 'new' ? form.newVenueName : undefined,
          newVenueAddress: form.venueId === 'new' ? form.newVenueAddress : undefined,
          categories: form.categories,
          price: priceString,
          ticketUrl: normalizeUrl(form.ticketUrl) || undefined,
          imageUrl,
          // Recurrence data
          isRecurring: form.isRecurring,
          recurrencePattern: form.isRecurring ? form.recurrencePattern : undefined,
          recurrenceEndDate: form.isRecurring ? form.recurrenceEndDate || undefined : undefined,
        });
      }

      setIsSubmitted(true);
    } catch (err) {
      setError('Failed to submit event(s). Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // Require login to submit events
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <LogIn size={40} className="text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground mb-4">
            Login Required
          </h1>
          <p className="text-muted-foreground mb-8">
            You need to be logged in to submit events. Create an account or log in to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login?redirect=/submit"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              Log In
            </Link>
            <Link
              href="/register?redirect=/submit"
              className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="font-display text-3xl text-foreground mb-4">
            {eventForms.length > 1 ? 'Events Submitted!' : 'Event Submitted!'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isAdmin 
              ? `Your ${eventForms.length > 1 ? 'events have' : 'event has'} been published and ${eventForms.length > 1 ? 'are' : 'is'} now live on the site.`
              : `Thank you for submitting your ${eventForms.length > 1 ? 'events' : 'event'}. Our team will review ${eventForms.length > 1 ? 'them' : 'it'} and ${eventForms.length > 1 ? 'they' : 'it'} should appear on the site within 24 hours.`
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              Back to Home
            </Link>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setEventForms([createEmptyForm()]);
              }}
              className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
            >
              Submit More Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-secondary to-primary/80 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-4">
            Submit {eventForms.length > 1 ? 'Events' : 'an Event'}
          </h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Share your event with Kingston&apos;s community. 
            {isAdmin 
              ? ' As an admin, your events will be published immediately.'
              : ' Fill out the form below and we\'ll review it within 24 hours.'
            }
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isAdmin && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-800 font-medium">Admin Mode</p>
              <p className="text-sm text-green-700">
                Events you submit will be automatically approved and published.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {eventForms.map((formData, formIndex) => (
            <div key={formData.id} className="relative">
              {eventForms.length > 1 && (
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl text-foreground">
                    Event {formIndex + 1}
                  </h2>
                  <button
                    type="button"
                    onClick={() => removeEventForm(formData.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={16} />
                    Remove
                  </button>
                </div>
              )}

              {/* Event Details */}
              <section className="bg-card border border-border rounded-xl p-6 mb-6">
                <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  Event Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor={`title-${formData.id}`} className="block text-sm font-medium text-foreground mb-2">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      id={`title-${formData.id}`}
                      required
                      value={formData.title}
                      onChange={(e) => updateForm(formData.id, { title: e.target.value })}
                      placeholder="e.g., Trivia Night at The Ale House"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor={`description-${formData.id}`} className="block text-sm font-medium text-foreground mb-2">
                      Description *
                    </label>
                    <textarea
                      id={`description-${formData.id}`}
                      required
                      rows={4}
                      maxLength={MAX_DESCRIPTION_LENGTH}
                      value={formData.description}
                      onChange={(e) => updateForm(formData.id, { description: e.target.value })}
                      placeholder="Tell people what they can expect at your event..."
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                    />
                    <div className="flex justify-end mt-1">
                      <span className={`text-xs ${formData.description.length > MAX_DESCRIPTION_LENGTH * 0.9 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Date & Time */}
              <section className="bg-card border border-border rounded-xl p-6 mb-6">
                <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2">
                  <Calendar size={20} className="text-primary" />
                  Date & Time
                </h3>
                
                {/* All Day toggle */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAllDay}
                      onChange={(e) => updateForm(formData.id, { 
                        isAllDay: e.target.checked,
                        startTime: e.target.checked ? '00:00' : '',
                        endTime: ''
                      })}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">This is an all-day event</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor={`date-${formData.id}`} className="block text-sm font-medium text-foreground mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      id={`date-${formData.id}`}
                      required
                      value={formData.date}
                      onChange={(e) => updateForm(formData.id, { date: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>

                  {!formData.isAllDay && (
                    <>
                      <div>
                        <label htmlFor={`startTime-${formData.id}`} className="block text-sm font-medium text-foreground mb-2">
                          Start Time *
                        </label>
                        <div className="relative">
                          <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                          <select
                            id={`startTime-${formData.id}`}
                            required
                            value={formData.startTime}
                            onChange={(e) => updateForm(formData.id, { startTime: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none cursor-pointer"
                          >
                            <option value="">Select time...</option>
                            {timeOptions.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor={`endTime-${formData.id}`} className="block text-sm font-medium text-foreground mb-2">
                          End Time
                        </label>
                        <div className="relative">
                          <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                          <select
                            id={`endTime-${formData.id}`}
                            value={formData.endTime}
                            onChange={(e) => updateForm(formData.id, { endTime: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none cursor-pointer"
                          >
                            <option value="">Select time...</option>
                            {timeOptions.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Recurring Event Options */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isRecurring}
                        onChange={(e) => updateForm(formData.id, { 
                          isRecurring: e.target.checked,
                          recurrencePattern: e.target.checked ? 'weekly' : 'none',
                          recurrenceEndDate: ''
                        })}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                      />
                      <Repeat size={16} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">This is a recurring event</span>
                    </label>
                  </div>

                  {formData.isRecurring && (
                    <div className="p-4 bg-muted/50 rounded-xl space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Repeat Pattern
                          </label>
                          <select
                            value={formData.recurrencePattern}
                            onChange={(e) => updateForm(formData.id, { 
                              recurrencePattern: e.target.value as RecurrencePattern,
                              customDates: []
                            })}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          >
                            <option value="weekly">Every week</option>
                            <option value="biweekly">Every 2 weeks</option>
                            <option value="monthly">Every month</option>
                            <option value="custom">Multiple specific dates</option>
                          </select>
                          {formData.date && formData.recurrencePattern !== 'custom' && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Every {formData.recurrencePattern === 'monthly' ? 'month' : ''} {dayNames[new Date(formData.date + 'T12:00:00').getDay()]}
                              {formData.recurrencePattern === 'biweekly' ? ' (every 2 weeks)' : ''}
                            </p>
                          )}
                        </div>
                        {formData.recurrencePattern !== 'custom' && (
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Until
                            </label>
                            <input
                              type="date"
                              value={formData.recurrenceEndDate}
                              onChange={(e) => updateForm(formData.id, { recurrenceEndDate: e.target.value })}
                              min={formData.date}
                              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              Leave empty for no end date (max 52 weeks)
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Custom dates picker */}
                      {formData.recurrencePattern === 'custom' && (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Select Additional Dates
                          </label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {formData.customDates.map((date, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-lg"
                              >
                                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                <button
                                  type="button"
                                  onClick={() => updateForm(formData.id, { 
                                    customDates: formData.customDates.filter((_, i) => i !== idx)
                                  })}
                                  className="hover:text-red-500"
                                >
                                  <X size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                          <input
                            type="date"
                            min={formData.date}
                            onChange={(e) => {
                              if (e.target.value && !formData.customDates.includes(e.target.value)) {
                                updateForm(formData.id, { 
                                  customDates: [...formData.customDates, e.target.value].sort()
                                });
                              }
                              e.target.value = '';
                            }}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Click dates to add them. The first date is set above.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Location */}
              <section className="bg-card border border-border rounded-xl p-6 mb-6">
                <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2">
                  <MapPin size={20} className="text-primary" />
                  Location
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor={`venue-${formData.id}`} className="block text-sm font-medium text-foreground mb-2">
                      Select a Venue *
                    </label>
                    <select
                      id={`venue-${formData.id}`}
                      value={formData.venueId}
                      onChange={(e) => updateForm(formData.id, { venueId: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                      <option value="">Choose an existing venue...</option>
                      {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.name} - {venue.neighborhood || venue.address}
                        </option>
                      ))}
                      <option value="new">+ Add a new venue</option>
                    </select>
                  </div>

                  {formData.venueId === 'new' && (
                    <div className="space-y-4 pt-4 border-t border-border">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700">
                          New venues require admin approval before they appear in the venue list.
                        </p>
                      </div>
                      <div>
                        <label htmlFor={`newVenueName-${formData.id}`} className="block text-sm font-medium text-foreground mb-2">
                          Venue Name *
                        </label>
                        <input
                          type="text"
                          id={`newVenueName-${formData.id}`}
                          value={formData.newVenueName}
                          onChange={(e) => updateForm(formData.id, { newVenueName: e.target.value })}
                          placeholder="e.g., The Ale House"
                          className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor={`newVenueAddress-${formData.id}`} className="block text-sm font-medium text-foreground mb-2">
                          Address *
                        </label>
                        <input
                          type="text"
                          id={`newVenueAddress-${formData.id}`}
                          value={formData.newVenueAddress}
                          onChange={(e) => updateForm(formData.id, { newVenueAddress: e.target.value })}
                          placeholder="e.g., 393 Princess St, Kingston, ON"
                          className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Categories */}
              <section className="bg-card border border-border rounded-xl p-6 mb-6">
                <h3 className="font-display text-xl text-foreground mb-2 flex items-center gap-2">
                  <Tag size={20} className="text-primary" />
                  Categories *
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select all that apply (at least one required)
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((category) => {
                    const isSelected = formData.categories.includes(category);
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategoryToggle(formData.id, category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-border'
                        }`}
                      >
                        {categoryLabels[category]}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Additional Info */}
              <section className="bg-card border border-border rounded-xl p-6 mb-6">
                <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2">
                  <DollarSign size={20} className="text-primary" />
                  Additional Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Price / Admission
                    </label>
                    <div className="flex flex-wrap gap-3 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`priceType-${formData.id}`}
                          value="na"
                          checked={formData.priceType === 'na'}
                          onChange={() => updateForm(formData.id, { priceType: 'na', priceAmount: '' })}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">N/A</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`priceType-${formData.id}`}
                          value="free"
                          checked={formData.priceType === 'free'}
                          onChange={() => updateForm(formData.id, { priceType: 'free', priceAmount: '' })}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Free</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`priceType-${formData.id}`}
                          value="amount"
                          checked={formData.priceType === 'amount'}
                          onChange={() => updateForm(formData.id, { priceType: 'amount' })}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Paid</span>
                      </label>
                    </div>
                    {formData.priceType === 'amount' && (
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <input
                          type="text"
                          id={`priceAmount-${formData.id}`}
                          value={formData.priceAmount}
                          onChange={(e) => updateForm(formData.id, { priceAmount: e.target.value })}
                          placeholder="e.g., 15, 20-40"
                          className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor={`ticketUrl-${formData.id}`} className="block text-sm font-medium text-foreground mb-2">
                      Ticket / Registration Link
                    </label>
                    <div className="relative">
                      <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        id={`ticketUrl-${formData.id}`}
                        value={formData.ticketUrl}
                        onChange={(e) => updateForm(formData.id, { ticketUrl: e.target.value })}
                        placeholder="e.g., ticketmaster.com/event/abc"
                        className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You can enter the link with or without https://
                    </p>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Event Image
                    </label>
                    
                    {formData.imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden">
                        <img
                          src={formData.imagePreview}
                          alt="Event preview"
                          className="w-full h-48 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(formData.id)}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleImageDrop(formData.id, e)}
                        onClick={() => fileInputRefs.current[formData.id]?.click()}
                        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                      >
                        <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-foreground font-medium mb-1">
                          Drop an image here or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF up to 5MB. Recommended: 800x600px
                        </p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[formData.id] = el; }}
                      onChange={(e) => handleFileInputChange(formData.id, e)}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </section>

              {formIndex < eventForms.length - 1 && (
                <div className="border-b-2 border-dashed border-border my-8" />
              )}
            </div>
          ))}

          {/* Add Another Event Button */}
          <button
            type="button"
            onClick={addAnotherEvent}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-border rounded-xl font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            <Plus size={20} />
            Add Another Event
          </button>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={20} />
                {isAdmin 
                  ? `Publish ${eventForms.length > 1 ? 'Events' : 'Event'}` 
                  : `Submit ${eventForms.length > 1 ? 'Events' : 'Event'} for Review`
                }
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
