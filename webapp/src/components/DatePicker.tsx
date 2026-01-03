'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  isToday,
  parseISO
} from 'date-fns';

interface DatePickerProps {
  value: string; // Format: 'yyyy-MM-dd'
  onChange: (value: string) => void;
  min?: string; // Format: 'yyyy-MM-dd'
  max?: string; // Format: 'yyyy-MM-dd'
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date',
  className = '',
  id,
  required,
  disabled
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      try {
        return startOfMonth(parseISO(value));
      } catch {
        return new Date();
      }
    }
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Update current month when value changes
  useEffect(() => {
    if (value) {
      try {
        const date = parseISO(value);
        setCurrentMonth(startOfMonth(date));
      } catch {
        // Invalid date, keep current month
      }
    }
  }, [value]);

  const selectedDate = value ? parseISO(value) : null;
  const minDate = min ? parseISO(min) : null;
  const maxDate = max ? parseISO(max) : null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    if (!minDate || today >= minDate) {
      if (!maxDate || today <= maxDate) {
        onChange(format(today, 'yyyy-MM-dd'));
      }
    }
  };

  const handleDateSelect = (date: Date) => {
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;
    
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow typing in the format yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
      try {
        const date = parseISO(inputValue);
        if (!minDate || date >= minDate) {
          if (!maxDate || date <= maxDate) {
            onChange(inputValue);
          }
        }
      } catch {
        // Invalid date, but allow typing
      }
    } else if (inputValue === '') {
      onChange('');
    }
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Calendar 
          size={16} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" 
        />
        <input
          type="text"
          id={id}
          value={value || ''}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${className}`}
        />
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-card border border-border rounded-xl shadow-lg p-4 w-80">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <button
                type="button"
                onClick={goToToday}
                className="px-2 py-1 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
              >
                Today
              </button>
            </div>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Week Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-xs font-medium text-muted-foreground text-center py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isDayToday = isToday(day);
              const isDisabled = isDateDisabled(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={isDisabled}
                  className={`
                    aspect-square p-1 rounded-lg transition-all text-sm font-medium
                    ${!isCurrentMonth ? 'text-muted-foreground/30' : 'text-foreground'}
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1' 
                      : isDayToday && !isSelected
                      ? 'bg-accent/20 text-primary font-semibold'
                      : 'hover:bg-muted'
                    }
                    ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

