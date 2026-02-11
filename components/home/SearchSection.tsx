import React from "react";
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Autocomplete } from "@react-google-maps/api";

interface SearchSectionProps {
  isSearching: boolean;
  error: string | null;
  searchLocationInput: string;
  onSearchLocationInputChange: (value: string) => void;
  onFindNearby: () => void;
  onSearchByLocationText: (location: string) => void;
  onAutocompleteLoad: (autocomplete: google.maps.places.Autocomplete) => void;
  onPlaceChanged: () => void;
  locationInputRef: React.RefObject<HTMLInputElement>;
  onLoginRequired?: () => void;
  isLoginModalOpen?: boolean;
  disableSearchInput?: boolean;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  isSearching,
  error,
  searchLocationInput,
  onSearchLocationInputChange,
  onFindNearby,
  onSearchByLocationText,
  onAutocompleteLoad,
  onPlaceChanged,
  locationInputRef,
  onLoginRequired,
  isLoginModalOpen,
  disableSearchInput,
}) => {
  const shouldPromptLogin = onLoginRequired && !isLoginModalOpen && disableSearchInput;
  return (
    <div className='relative overflow-hidden rounded-[2rem] border border-indigo-100/80 bg-white/90 p-5 shadow-[0_20px_60px_-35px_rgba(79,70,229,0.5)] backdrop-blur md:p-7'>
      <div className='pointer-events-none absolute -top-20 -right-16 h-44 w-44 rounded-full bg-fuchsia-200/40 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-sky-200/40 blur-3xl' />

      <div className='relative z-10 mb-5 text-left'>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
          Start Search
        </p>
        <p className="mt-1 text-sm text-slate-600 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
          Find nearby restaurants or type a location to get an AI summary quickly.
        </p>
      </div>

      <div className='relative z-10 flex flex-col gap-3.5 md:flex-row md:items-stretch'>
        <button
          onClick={() => {
            if (shouldPromptLogin) {
              onLoginRequired();
              return;
            }
            onFindNearby();
          }}
          disabled={isSearching}
          className="inline-flex h-14 items-center justify-center whitespace-nowrap rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 [font-family:'Space_Grotesk',ui-sans-serif,system-ui] md:min-w-[230px] md:flex-none">
          <MapPinIcon className='w-5 h-5 mr-2' />
          {isSearching ? "Searching Near You..." : "Find Restaurants Near Me"}
        </button>
        <div className='relative flex-1'>
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={() => {
              if (shouldPromptLogin) {
                onLoginRequired();
                return;
              }
              onPlaceChanged();
            }}
            options={{
              types: ["geocode"],
              componentRestrictions: { country: "au" },
            }}>
            <input
              ref={locationInputRef}
              type='text'
              className="h-14 w-full rounded-2xl border border-indigo-100 bg-white/95 py-3 pl-4 pr-12 text-[15px] text-slate-900 shadow-inner shadow-indigo-100/40 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 placeholder:text-slate-400 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]"
              placeholder='Or enter a suburb or city'
              value={searchLocationInput}
              onChange={(e) => onSearchLocationInputChange(e.target.value)}
              onMouseDown={(event) => {
                if (disableSearchInput) {
                  event.preventDefault();
                  if (shouldPromptLogin) onLoginRequired();
                }
              }}
              onClick={() => {
                if (disableSearchInput && shouldPromptLogin) onLoginRequired();
              }}
              onFocus={() => {
                if (shouldPromptLogin) onLoginRequired();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (shouldPromptLogin) {
                    onLoginRequired();
                    return;
                  }
                  onSearchByLocationText(searchLocationInput);
                }
              }}
              readOnly={disableSearchInput}
              aria-disabled={disableSearchInput}
              disabled={isSearching}
            />
          </Autocomplete>
          <button
            onClick={() => {
              if (shouldPromptLogin) {
                onLoginRequired();
                return;
              }
              onSearchByLocationText(searchLocationInput);
            }}
            disabled={isSearching || !searchLocationInput.trim()}
            className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50'
            aria-label='Search location'>
            <MagnifyingGlassIcon className='w-5 h-5' />
          </button>
        </div>
      </div>
      {isSearching && !error && (
        <p className="pt-3 text-center text-xs text-slate-500 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
          Searching for top-rated restaurants...
        </p>
      )}
      {error && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 [font-family:'Space_Grotesk',ui-sans-serif,system-ui]">
          <InformationCircleIcon className='w-5 h-5' />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default SearchSection;
