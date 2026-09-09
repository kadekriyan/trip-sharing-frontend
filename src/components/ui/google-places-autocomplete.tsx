"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Navigation,
  Building2,
  Pencil,
} from "lucide-react";
import { Input } from "@/src/components/ui/input";

export interface PlaceSelection {
  address: string;
  latitude?: number;
  longitude?: number;
  placeName?: string;
}

interface GooglePlacesAutocompleteProps {
  value: string;
  placeName?: string;
  onChange: (selection: PlaceSelection) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  latitude?: number;
  longitude?: number;
}

interface PredictionItem {
  id: string;
  title: string;
  subtitle: string;
  prediction: any;
}

declare global {
  interface Window {
    google?: any;
    __googleMapsLoadingPromise?: Promise<void>;
    gm_authFailure?: () => void;
  }
}

// Global script loader helper for Places API (New)
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.importLibrary) return Promise.resolve();

  if (window.__googleMapsLoadingPromise) {
    return window.__googleMapsLoadingPromise;
  }

  window.__googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      if (window.google?.maps) {
        resolve();
      } else {
        existingScript.addEventListener("load", () => resolve());
        existingScript.addEventListener("error", (e) => reject(e));
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places&language=id&region=ID&loading=async`;
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
  placeName = "",
  onChange,
  placeholder = "Cari nama hotel, stasiun, bandara, atau alamat penjemputan...",
  disabled = false,
  required = false,
  className = "",
  latitude,
  longitude,
}: GooglePlacesAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const placesLibRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [authError, setAuthError] = useState(false);

  const [inputValue, setInputValue] = useState(value || "");
  const [selectedPlaceName, setSelectedPlaceName] = useState(placeName || "");
  const [selectedAddress, setSelectedAddress] = useState(value || "");
  const [isEditMode, setIsEditMode] = useState(!value);

  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  useEffect(() => {
    setInputValue(value || "");
    setSelectedAddress(value || "");
    if (placeName) {
      setSelectedPlaceName(placeName);
    }
    if (value && !isEditMode) {
      setIsEditMode(false);
    }
  }, [value, placeName]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Initialize Places API (New) library
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.gm_authFailure = () => {
        setAuthError(true);
        setLoadError(true);
        console.warn(
          "Google Maps Auth Failure (RefererNotAllowedMapError): Pastikan domain http://localhost:3000/* sudah ditambahkan ke HTTP referrers di Google Cloud Console."
        );
      };
    }

    if (!apiKey) return;

    let isMounted = true;
    setIsLoadingScript(true);

    loadGoogleMapsScript(apiKey)
      .then(async () => {
        if (!isMounted || !window.google?.maps) return;

        try {
          const placesLib = await window.google.maps.importLibrary("places");
          if (!isMounted) return;

          placesLibRef.current = placesLib;
          if (placesLib.AutocompleteSessionToken) {
            sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
          }
        } catch (err) {
          console.warn("Places API (New) import library warning:", err);
          if (isMounted) setLoadError(true);
        }
      })
      .catch((err) => {
        console.warn("Google Maps script load warning:", err);
        if (isMounted) setLoadError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoadingScript(false);
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // Fetch suggestions with Places API (New)
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2 || !placesLibRef.current?.AutocompleteSuggestion) {
        setPredictions([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } = placesLibRef.current;

        if (!sessionTokenRef.current && AutocompleteSessionToken) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        const request = {
          input: query,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ["id"],
          language: "id",
        };

        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        const suggestions = response?.suggestions || [];

        const formattedList: PredictionItem[] = suggestions.map((s: any) => {
          const pred = s.placePrediction;
          const main = pred?.mainText?.text || pred?.text?.text || "";
          const sub = pred?.secondaryText?.text || "";
          return {
            id: pred?.placeId || `${main}-${Math.random()}`,
            title: main,
            subtitle: sub,
            prediction: pred,
          };
        });

        setPredictions(formattedList);
        setShowDropdown(formattedList.length > 0);
      } catch (err) {
        console.warn("Places API (New) fetch error:", err);
        setPredictions([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setSelectedAddress(val);
    setSelectedPlaceName("");

    onChange({
      address: val,
      placeName: val,
      latitude: undefined,
      longitude: undefined,
    });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(val);
      }, 250);
    } else {
      setPredictions([]);
      setShowDropdown(false);
    }
  };

  const handleSelectSuggestion = async (item: PredictionItem) => {
    setIsFetchingDetails(true);
    setShowDropdown(false);

    try {
      if (item.prediction?.toPlace) {
        const place = item.prediction.toPlace();
        await place.fetchFields({
          fields: ["displayName", "formattedAddress", "location"],
        });

        const latVal = place.location?.lat;
        const lngVal = place.location?.lng;
        const lat = typeof latVal === "function" ? latVal() : latVal;
        const lng = typeof lngVal === "function" ? lngVal() : lngVal;

        const pName = place.displayName || item.title || "";
        const pAddress = place.formattedAddress || item.subtitle || pName;

        setSelectedPlaceName(pName);
        setSelectedAddress(pAddress);
        setInputValue(pName);
        setIsEditMode(false);

        onChange({
          address: pAddress,
          placeName: pName,
          latitude: typeof lat === "number" ? lat : undefined,
          longitude: typeof lng === "number" ? lng : undefined,
        });
      } else {
        const pName = item.title;
        const pAddress = item.subtitle ? `${item.title}, ${item.subtitle}` : item.title;

        setSelectedPlaceName(pName);
        setSelectedAddress(pAddress);
        setInputValue(pName);
        setIsEditMode(false);

        onChange({
          address: pAddress,
          placeName: pName,
          latitude: undefined,
          longitude: undefined,
        });
      }

      // Reset session token for subsequent searches
      if (placesLibRef.current?.AutocompleteSessionToken) {
        sessionTokenRef.current = new placesLibRef.current.AutocompleteSessionToken();
      }
    } catch (err) {
      console.warn("Place details fetch failed (falling back to text):", err);
      const pName = item.title;
      const pAddress = item.subtitle ? `${item.title}, ${item.subtitle}` : item.title;

      setSelectedPlaceName(pName);
      setSelectedAddress(pAddress);
      setInputValue(pName);
      setIsEditMode(false);

      onChange({
        address: pAddress,
        placeName: pName,
        latitude: undefined,
        longitude: undefined,
      });
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSelectedPlaceName("");
    setSelectedAddress("");
    setPredictions([]);
    setShowDropdown(false);
    setIsEditMode(true);

    onChange({
      address: "",
      placeName: "",
      latitude: undefined,
      longitude: undefined,
    });

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleStartEdit = () => {
    setIsEditMode(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  };

  const hasCoordinates = typeof latitude === "number" && typeof longitude === "number";
  const hasConfirmedSelection = !isEditMode && (selectedPlaceName || selectedAddress);

  return (
    <div ref={containerRef} className={`relative space-y-2 ${className}`}>
      {/* 1. VIEW MODE: SELECTED PLACE CARD WITH HIERARCHY */}
      {hasConfirmedSelection ? (
        <div className="p-3.5 rounded-2xl bg-white border-2 border-teal-600/30 hover:border-[#00677d] shadow-sm space-y-2.5 transition-all animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#00677d] flex items-center justify-center shrink-0 shadow-inner mt-0.5">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00677d] block">
                  Lokasi Penjemputan Dipilih
                </span>
                <h4 className="font-heading font-extrabold text-sm text-[#191c1e] truncate block">
                  {selectedPlaceName || selectedAddress}
                </h4>
                {selectedAddress && selectedAddress !== selectedPlaceName && (
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                    {selectedAddress}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartEdit}
              disabled={disabled}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-[#00677d] bg-slate-50 hover:bg-teal-50/60 text-slate-700 hover:text-[#00677d] text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 shadow-2xs"
              title="Ganti titik penjemputan"
            >
              <Pencil className="h-3 w-3" />
              <span>Ganti</span>
            </button>
          </div>

          {/* GPS Coordinates Badge */}
          {hasCoordinates && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-xl border border-emerald-200/80 w-fit">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold">Titik GPS Terkunci:</span>
              <span className="font-mono text-[10px] text-emerald-900 font-bold">
                {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* 2. EDIT / SEARCH MODE: AUTOCOMPLETE INPUT */
        <div className="space-y-1.5">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
              {isLoadingScript || isSearching || isFetchingDetails ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#00677d]" />
              ) : (
                <MapPin className="h-4 w-4 text-[#00677d]" />
              )}
            </div>

            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => {
                if (predictions.length > 0 && inputValue.trim().length >= 2) {
                  setShowDropdown(true);
                }
              }}
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

          {/* Autocomplete Predictions Dropdown (Places API New) */}
          {showDropdown && predictions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-2 bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Search className="h-3 w-3 text-[#00677d]" /> Rekomendasi Lokasi (Places API)
                </span>
                <span>Indonesia</span>
              </div>

              {predictions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left p-3 hover:bg-teal-50/60 transition-colors flex items-start gap-2.5 group"
                >
                  <div className="h-7 w-7 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-[#00677d] group-hover:text-white flex items-center justify-center shrink-0 transition-colors mt-0.5 shadow-sm">
                    <Navigation className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-slate-800 group-hover:text-[#00677d] block truncate transition-colors">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
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
