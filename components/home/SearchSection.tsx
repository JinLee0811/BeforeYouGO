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
    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-12 max-w-3xl mx-auto'>
      <div className='flex flex-col sm:flex-row gap-4 mb-4'>
        <button
          onClick={() => {
            if (shouldPromptLogin) {
              onLoginRequired();
              return;
            }
            onFindNearby();
          }}
          disabled={isSearching}
          className='flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap'>
          <MapPinIcon className='w-5 h-5 mr-2' />
          {isSearching ? "Searching Near You..." : "Find Restaurants Near Me"}
        </button>
        <div className='flex-1 relative'>
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
              className='w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
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
            className='absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500'
            aria-label='Search location'>
            <MagnifyingGlassIcon className='w-5 h-5' />
          </button>
        </div>
      </div>
      {isSearching && !error && (
        <p className='text-sm text-center text-gray-600 dark:text-gray-400 pt-2'>
          Searching for top-rated restaurants...
        </p>
      )}
      {error && (
        <div className='mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center justify-center gap-2'>
          <InformationCircleIcon className='w-5 h-5' />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default SearchSection;
