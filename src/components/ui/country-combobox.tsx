"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, Globe, X } from "lucide-react";
import { COUNTRIES, Country } from "@/src/data/countries";
import { cn } from "@/src/lib/utils";

export interface CountryComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  error?: boolean;
  name?: string;
  required?: boolean;
}

export function CountryCombobox({
  value = "Indonesia",
  onChange,
  placeholder = "Select Nationality...",
  disabled = false,
  className,
  id,
  error = false,
  name,
  required = false,
}: CountryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Find the currently selected country object
  const selectedCountry = useMemo(() => {
    if (!value) return null;
    return (
      COUNTRIES.find(
        (c) =>
          c.name.toLowerCase() === value.toLowerCase() ||
          c.code.toLowerCase() === value.toLowerCase()
      ) || { name: value, code: "", flag: "🌐" }
    );
  }, [value]);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      return COUNTRIES;
    }
    const q = searchQuery.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (country: Country) => {
    onChange(country.name);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form validation if needed */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border bg-slate-50 px-3 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#00a3c4]/20",
          isOpen
            ? "border-[#00677d] ring-2 ring-[#00a3c4]/20 bg-white"
            : error
            ? "border-red-400 bg-red-50/20 text-red-900"
            : "border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-100/50",
          disabled && "cursor-not-allowed opacity-50 bg-slate-100"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedCountry ? (
            <>
              <span className="text-base leading-none select-none">
                {selectedCountry.flag}
              </span>
              <span className="truncate">{selectedCountry.name}</span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-400 truncate">{placeholder}</span>
            </>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180 text-[#00677d]"
          )}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[240px] rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code..."
                className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-7 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#00677d] focus:outline-none focus:ring-1 focus:ring-[#00677d]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Country List */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 overscroll-contain divide-y divide-transparent text-xs"
          >
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No country found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredCountries.map((country, idx) => {
                const isSelected =
                  selectedCountry?.name.toLowerCase() ===
                  country.name.toLowerCase();
                const isIndonesia = country.code === "ID";

                return (
                  <button
                    key={`${country.code}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(country)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors",
                      isSelected
                        ? "bg-[#00677d]/10 text-[#00677d] font-bold"
                        : "text-slate-700 hover:bg-slate-100 font-medium",
                      !searchQuery && isIndonesia && !isSelected && "bg-slate-50/80 font-semibold text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base leading-none select-none">
                        {country.flag}
                      </span>
                      <span className="truncate">{country.name}</span>
                      {country.code && (
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          ({country.code})
                        </span>
                      )}
                      {!searchQuery && isIndonesia && (
                        <span className="text-[9px] font-bold text-[#00677d] bg-[#00677d]/10 px-1.5 py-0.5 rounded ml-1">
                          Default
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-[#00677d] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
