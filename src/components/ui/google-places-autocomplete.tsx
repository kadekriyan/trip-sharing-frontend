"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/src/components/ui/input";

export interface PlaceSelection {
  address: string;
  latitude?: number;
  longitude?: number;
  placeName?: string;
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (selection: PlaceSelection) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  latitude?: number;
  longitude?: number;
}

declare global {
  interface Window {
    google?: any;
    __googleMapsLoadingPromise?: Promise<void>;
    gm_authFailure?: () => void;
  }
}

// Global script loader helper to prevent duplicate script tags
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();

  if (window.__googleMapsLoadingPromise) {
    return window.__googleMapsLoadingPromise;
  }

  window.__googleMapsLoadingPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      if (window.google?.maps?.places) {
        resolve();
      } else {
        existingScript.addEventListener("load", () => resolve());
        existingScript.addEventListener("error", (e) => reject(e));
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=id&region=ID`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return window.__googleMapsLoadingPromise;
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Cari nama hotel, stasiun, bandara, atau alamat penjemputan...",
  disabled = false,
  required = false,
  className = "",
  latitude,
  longitude,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    // Hook into Google Maps auth failure callback (e.g. RefererNotAllowedMapError)
    if (typeof window !== "undefined") {
      window.gm_authFailure = () => {
        setAuthError(true);
        setLoadError(true);
        console.warn(
          "Google Maps Auth Failure (RefererNotAllowedMapError): Pastikan domain http://localhost:3000/* sudah ditambahkan ke HTTP referrers di Google Cloud Console."
        );
      };
    }

    if (!apiKey) {
      // If no API key provided, allow manual typing without google maps
      return;
    }

    let isMounted = true;
    setIsLoadingScript(true);

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!isMounted || !inputRef.current || !window.google?.maps?.places) return;

        // Initialize Google Autocomplete on the input
        if (!autocompleteRef.current) {
          const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: "id" },
            fields: ["formatted_address", "geometry", "name", "place_id", "address_components"],
            types: ["geocode", "establishment"],
          });

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place) return;

            let formatted = place.formatted_address || "";
            if (place.name && !formatted.includes(place.name)) {
              formatted = `${place.name}, ${formatted}`;
            }
            if (!formatted && place.name) {
              formatted = place.name;
            }

            const lat = place.geometry?.location?.lat();
            const lng = place.geometry?.location?.lng();

            setInputValue(formatted);
            onChange({
              address: formatted,
              latitude: typeof lat === "function" ? lat() : lat,
              longitude: typeof lng === "function" ? lng() : lng,
              placeName: place.name,
            });
          });

          autocompleteRef.current = autocomplete;
        }
      })
      .catch((err) => {
        console.warn("Google Maps Places API load warning (fallback to manual typing):", err);
        if (isMounted) setLoadError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoadingScript(false);
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey, onChange]);

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange({
      address: val,
      latitude: undefined,
      longitude: undefined,
    });
  };

  const handleClear = () => {
    setInputValue("");
    onChange({
      address: "",
      latitude: undefined,
      longitude: undefined,
    });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const hasCoordinates = typeof latitude === "number" && typeof longitude === "number";

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
          {isLoadingScript ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#00677d]" />
          ) : (
            <MapPin className="h-4 w-4 text-[#00677d]" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleManualChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="pl-9 pr-9 text-xs bg-slate-50 border-slate-200 h-10 font-medium focus:bg-white transition-colors"
        />

        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
            title="Hapus lokasi"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Coordinate & Status Badges */}
      {hasCoordinates && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 animate-in fade-in">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold">Titik GPS Terkunci:</span>
          <span className="font-mono text-[10px] text-emerald-800">
            {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
          </span>
        </div>
      )}

      {/* Auth / Referrer Warning or Manual Mode Notice */}
      {authError && (
        <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/80 animate-in fade-in">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Google Maps API: Referrer Belum Diizinkan</span>
            <span className="text-[10px] text-amber-700 block leading-relaxed">
              Domain <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono text-[10px]">localhost:3000</code> belum didaftarkan pada HTTP referrers di Google Cloud Console. Mode pengetikan alamat manual aktif.
            </span>
          </div>
        </div>
      )}

      {loadError && !authError && !hasCoordinates && inputValue && (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
          <span>Mode input manual aktif (Alamat tetap tersimpan pada pesanan).</span>
        </div>
      )}
    </div>
  );
}
