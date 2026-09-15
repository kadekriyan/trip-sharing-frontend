"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  Check,
  Clock,
  Info,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { getEarliestBookingDate } from "@/src/lib/utils";
import type { Trip } from "@/src/types";

interface TripCalendarPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string, matchedTrip?: Trip) => void;
  trips?: Trip[];
  minDate?: string; // YYYY-MM-DD
  pricePerPax?: number;
  className?: string;
  onClose?: () => void;
}

const MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_HEADER = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function formatDateToISO(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function TripCalendarPicker({
  selectedDate,
  onSelectDate,
  trips = [],
  minDate,
  pricePerPax,
  className = "",
  onClose,
}: TripCalendarPickerProps) {
  // Hitung batas tanggal paling awal berdasarkan cutoff jam 19:00 WIB
  const earliestBooking = useMemo(() => getEarliestBookingDate(), []);
  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(
    () => formatDateToISO(today.getFullYear(), today.getMonth(), today.getDate()),
    [today]
  );
  const effectiveMinDate = minDate || earliestBooking.dateISO;

  const initialViewDate = useMemo(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m] = selectedDate.split("-").map(Number);
      return { year: y, month: m - 1 };
    }
    return { year: today.getFullYear(), month: today.getMonth() };
  }, [selectedDate, today]);

  const [viewYear, setViewYear] = useState<number>(initialViewDate.year);
  const [viewMonth, setViewMonth] = useState<number>(initialViewDate.month);

  // Map trips by departureDate (YYYY-MM-DD)
  const tripsByDate = useMemo(() => {
    const map = new Map<string, Trip>();
    for (const trip of trips) {
      if (trip.departureDate) {
        const dateKey = trip.departureDate.split("T")[0];
        map.set(dateKey, trip);
      }
    }
    return map;
  }, [trips]);

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((prev) => prev - 1);
      setViewMonth(11);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((prev) => prev + 1);
      setViewMonth(0);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Check if we can navigate to previous month (don't go before current month)
  const canGoPrev = useMemo(() => {
    const minD = new Date(effectiveMinDate);
    const minYear = minD.getFullYear();
    const minMonth = minD.getMonth();
    return viewYear > minYear || (viewYear === minYear && viewMonth > minMonth);
  }, [viewYear, viewMonth, effectiveMinDate]);

  // Second month for desktop view (Month N + 1)
  const secondMonthInfo = useMemo(() => {
    if (viewMonth === 11) {
      return { year: viewYear + 1, month: 0 };
    }
    return { year: viewYear, month: viewMonth + 1 };
  }, [viewYear, viewMonth]);

  // Generate calendar grid for a specific year and month
  const generateMonthGrid = (year: number, month: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Monday is index 0 in our DAYS_HEADER:
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{
      day: number | null;
      dateISO: string;
      isPast: boolean;
      isSelected: boolean;
      isToday: boolean;
      trip?: Trip;
      remainingSeats?: number;
    }> = [];

    // Empty cells before 1st day of month
    for (let i = 0; i < startOffset; i++) {
      cells.push({
        day: null,
        dateISO: "",
        isPast: true,
        isSelected: false,
        isToday: false,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateISO = formatDateToISO(year, month, d);
      const isPast = dateISO < effectiveMinDate;
      const isSelected = selectedDate === dateISO;
      const isToday = dateISO === todayISO;
      const matchedTrip = tripsByDate.get(dateISO);

      let remainingSeats: number | undefined = undefined;
      if (matchedTrip) {
        const totalPax =
          matchedTrip.groups && matchedTrip.groups.length > 0
            ? matchedTrip.groups.reduce(
                (acc, g) =>
                  acc +
                  (Number(g.currentParticipants) ||
                    (Array.isArray(g.participants) ? g.participants.length : 0)),
                0
              )
            : Number(matchedTrip.currentParticipants || matchedTrip.current_participants || 0);

        const totalCap =
          matchedTrip.groups && matchedTrip.groups.length > 0
            ? matchedTrip.groups.reduce(
                (acc, g) => acc + (Number(g.capacity || g.maxParticipants) || 6),
                0
              )
            : Number(
                matchedTrip.maxParticipants ||
                  matchedTrip.max_participants ||
                  (matchedTrip.maxGroups ? matchedTrip.maxGroups * 6 : 6)
              );

        remainingSeats = Math.max(0, totalCap - totalPax);
      }

      cells.push({
        day: d,
        dateISO,
        isPast,
        isSelected,
        isToday,
        trip: matchedTrip,
        remainingSeats,
      });
    }

    return cells;
  };

  const month1Grid = useMemo(() => generateMonthGrid(viewYear, viewMonth), [viewYear, viewMonth, effectiveMinDate, selectedDate, tripsByDate]);
  const month2Grid = useMemo(
    () => generateMonthGrid(secondMonthInfo.year, secondMonthInfo.month),
    [secondMonthInfo, effectiveMinDate, selectedDate, tripsByDate]
  );

  const handleDateClick = (dateISO: string, trip?: Trip) => {
    if (dateISO < effectiveMinDate) return;
    onSelectDate(dateISO, trip);
    if (onClose) {
      onClose();
    }
  };

  const renderMonthSection = (year: number, month: number, grid: ReturnType<typeof generateMonthGrid>) => {
    return (
      <div className="w-full select-none">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center mb-2">
          {DAYS_HEADER.map((day, idx) => (
            <div
              key={day}
              className={`text-[11px] font-bold uppercase tracking-wider py-1 ${
                idx >= 5 ? "text-rose-500" : "text-slate-400"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
          {grid.map((cell, idx) => {
            if (cell.day === null) {
              return <div key={`empty-${idx}`} className="h-11 sm:h-12 w-full" />;
            }

            const { day, dateISO, isPast, isSelected, isToday, trip, remainingSeats } = cell;

            return (
              <button
                key={dateISO}
                type="button"
                disabled={isPast}
                onClick={() => handleDateClick(dateISO, trip)}
                aria-label={`Select date ${day} ${MONTH_NAMES_EN[month]} ${year}`}
                className={`group relative h-11 sm:h-12 w-full rounded-2xl transition-all duration-150 flex flex-col items-center justify-center font-sans ${
                  isPast
                    ? "text-slate-300 cursor-not-allowed pointer-events-none"
                    : isSelected
                    ? "bg-[#191c1e] text-white font-extrabold shadow-md scale-105 z-10"
                    : trip
                    ? "bg-teal-50/80 hover:bg-[#00677d] hover:text-white text-[#00677d] font-bold border border-teal-200/80 hover:shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 font-semibold"
                }`}
              >
                {/* Day Number */}
                <span className="text-xs sm:text-sm leading-none flex items-center justify-center gap-1">
                  {day}
                  {trip && !isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse group-hover:bg-white" />
                  )}
                </span>

                {/* Subtitle / Supertext indicator */}
                {isSelected ? (
                  <span className="text-[9px] text-teal-300 font-bold leading-none mt-1">
                    {trip ? "Scheduled" : "Selected"}
                  </span>
                ) : trip ? (
                  <span className="text-[9px] leading-none mt-1 opacity-90 group-hover:text-teal-100 font-bold truncate max-w-full px-0.5">
                    {remainingSeats !== undefined && remainingSeats > 0
                      ? `${remainingSeats} seats`
                      : "Group Active"}
                  </span>
                ) : isToday ? (
                  <span className="text-[9px] text-[#00677d] font-bold leading-none mt-1">
                    Today
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden p-4 sm:p-5 transition-all space-y-3 ${className}`}
    >
      {/* Cutoff Notice (After 19:00 WIB) */}
      {earliestBooking.isAfterCutoff && (
        <div className="flex items-start gap-2 p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900">
          <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-tight">
            <strong>Next-Day Booking Cutoff Closed:</strong> Bookings for tomorrow close daily at 19:00 WIB (UTC+7). The earliest selectable departure date is <strong>{earliestBooking.dateISO}</strong> (Day after tomorrow).
          </div>
        </div>
      )}

      {/* Top Header with Navigation Arrows & Month Year Display */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          className="p-2 rounded-full hover:bg-slate-100 active:scale-95 text-slate-700 disabled:opacity-20 disabled:pointer-events-none transition"
          aria-label="Previous Month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-center font-heading font-extrabold text-sm sm:text-base text-[#191c1e] flex items-center gap-1.5">
          <CalendarIcon className="h-4 w-4 text-[#00677d]" />
          <span>{MONTH_NAMES_EN[viewMonth]} {viewYear}</span>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-full hover:bg-slate-100 active:scale-95 text-slate-700 transition"
          aria-label="Next Month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid: Spacious, Non-Overlapping Layout */}
      <div className="w-full">
        {renderMonthSection(viewYear, viewMonth, month1Grid)}
      </div>

      {/* Legend / Status Indicators */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-[#191c1e] text-white flex items-center justify-center text-[9px]">
              ✓
            </span>
            <span className="font-medium">Selected</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-teal-50 border border-teal-300 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium">Scheduled Trip</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md border border-slate-200 bg-white" />
            <span className="font-medium">New Group (On-Demand)</span>
          </div>
        </div>

        {onClose && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-7 px-3 rounded-full border-slate-200 font-bold"
          >
            Close
          </Button>
        )}
      </div>

      {/* Bottom Special Offer Banner */}
      <div className="mt-3 p-2.5 rounded-2xl bg-gradient-to-r from-teal-50/80 to-emerald-50/80 border border-teal-200/60 flex items-center gap-2 text-[11px] text-teal-900">
        <Info className="h-4 w-4 text-[#00677d] shrink-0" />
        <span className="leading-tight font-medium">
          <strong>Guaranteed Departure:</strong> Join an existing group or initiate a new 6-pax fleet departure.
        </span>
      </div>
    </div>
  );
}
