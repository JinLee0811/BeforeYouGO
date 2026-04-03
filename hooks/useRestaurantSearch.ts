import { useState, useRef } from "react";
import { Restaurant } from "@/types/restaurant";

export const useRestaurantSearch = (isLoaded: boolean) => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchLocationInput, setSearchLocationInput] = useState("");
  const [searchQuery, setSearchQuery] = useState<string | { lat: number; lng: number } | null>(
    null
  );
  const [hasSearched, setHasSearched] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [autocompleteInstance, setAutocompleteInstance] =
    useState<google.maps.places.Autocomplete | null>(null);

  const findNearby = () => {
    if (isSearching) return;
    setError(null);
    setIsSearching(true);
    setRestaurants([]);
    setHasSearched(true);
    setSearchQuery(null);
    setSearchLocationInput("");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setSearchQuery(coords);
          fetchRestaurants(coords);
        },
        (geoError) => {
          console.error("Geolocation error:", geoError);
          let message = "Could not get your location. Please ensure location services are enabled.";
          if (geoError.code === geoError.PERMISSION_DENIED) {
            message = "Location permission denied. Please enable it in your browser settings.";
          } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
            message = "Location information is unavailable.";
          } else if (geoError.code === geoError.TIMEOUT) {
            message = "Getting location timed out. Please try again.";
          }
          setError(message);
          setIsSearching(false);
          setHasSearched(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setIsSearching(false);
      setHasSearched(false);
    }
  };

  const searchByLocationText = async (locationText: string) => {
    if (isSearching) return;
    if (!locationText.trim()) {
      setError("Please enter a location to search.");
      return;
    }
    setIsSearching(true);
    setRestaurants([]);
    setError(null);
    setHasSearched(true);
    setSearchQuery(locationText);

    try {
      const geocoder = new google.maps.Geocoder();
      const addressToGeocode = locationText.toLowerCase().includes("australia")
        ? locationText
        : `${locationText}, Australia`;
      const response = await geocoder.geocode({
        address: addressToGeocode,
        language: "en",
      });

      if (response.results.length > 0) {
        const coords = {
          lat: response.results[0].geometry.location.lat(),
          lng: response.results[0].geometry.location.lng(),
        };
        fetchRestaurants(coords);
      } else {
        setError(
          `Could not find coordinates for "${locationText}". Please try a different location.`
        );
        setIsSearching(false);
      }
    } catch (error) {
      console.error("Error geocoding location:", error);
      setError("Failed to geocode location. Please try again.");
      setIsSearching(false);
    }
  };

  const fetchRestaurants = (coords: { lat: number; lng: number }) => {
    try {
      if (!isLoaded) {
        setError("Map service not ready, please wait a moment.");
        setIsSearching(false);
        return;
      }
      const service = new google.maps.places.PlacesService(document.createElement("div"));
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(coords.lat, coords.lng),
        type: "restaurant",
        rankBy: google.maps.places.RankBy.DISTANCE,
        language: "en",
      };

      service.nearbySearch(request, async (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const getPlaceDetails = (placeId: string): Promise<boolean> => {
            return new Promise((resolve) => {
              service.getDetails(
                {
                  placeId: placeId,
                  fields: ["opening_hours"],
                },
                (placeDetails, detailsStatus) => {
                  if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                    resolve(placeDetails.opening_hours?.isOpen() || false);
                  } else {
                    resolve(false);
                  }
                }
              );
            });
          };

          const filteredPlaces = results.filter(
            (place) => place.rating && place.rating >= 4.0 && place.place_id
          );
          const basePlaces =
            filteredPlaces.length > 0
              ? filteredPlaces
              : results.filter((place) => place.place_id);
          const restaurantPromises = basePlaces.map(async (place) => {
            let distance = 0;
            try {
              const hasCoords =
                Number.isFinite(coords.lat) && Number.isFinite(coords.lng);
              const placeLatLng = place.geometry?.location;
              if (
                hasCoords &&
                placeLatLng &&
                typeof placeLatLng.lat === "function" &&
                typeof placeLatLng.lng === "function" &&
                google.maps.geometry?.spherical?.computeDistanceBetween
              ) {
                const origin = new google.maps.LatLng(coords.lat, coords.lng);
                const destination = new google.maps.LatLng(
                  placeLatLng.lat(),
                  placeLatLng.lng()
                );
                distance = google.maps.geometry.spherical.computeDistanceBetween(
                  origin,
                  destination
                );
              }
            } catch (error) {
              console.error("Error calculating distance:", error);
            }

            const isOpenNow = place.place_id ? await getPlaceDetails(place.place_id) : false;

            return {
              id: place.place_id!,
              name: place.name || "",
              rating: place.rating || 0,
              reviewCount: place.user_ratings_total || 0,
              priceLevel: (place.price_level || 0).toString(),
              imageUrl: place.photos
                ? place.photos[0].getUrl({ maxWidth: 400 })
                : "/placeholder-restaurant.jpg",
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              },
              address: place.vicinity || "",
              categories: place.types || [],
              distance,
              isOpenNow,
            };
          });

          try {
            const filteredResults = (await Promise.all(restaurantPromises))
              .sort((a, b) => {
                if (Math.abs(b.rating - a.rating) >= 0.1) {
                  return b.rating - a.rating;
                }
                return a.distance - b.distance;
              })
              .slice(0, 20);

            setRestaurants(filteredResults);
            if (filteredResults.length === 0) {
              setError("No restaurants found nearby. Try a different location?");
            } else {
              setError(null);
            }
          } catch (error) {
            console.error("Error processing restaurant details:", error);
            setError("Error processing restaurant details. Please try again.");
          }
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setRestaurants([]);
          setError("No restaurants found nearby. Try searching a different location.");
        } else {
          setError("Error searching restaurants. Please try again later.");
          console.error("Places API error:", status);
        }
        setIsSearching(false);
      });
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setError("An unexpected error occurred while searching. Please try again.");
      setIsSearching(false);
    }
  };

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocompleteInstance(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocompleteInstance !== null) {
      const place = autocompleteInstance.getPlace();
      const locationName = place.name || place.formatted_address || "";
      if (locationName) {
        setSearchLocationInput(locationName);
        searchByLocationText(locationName);
      } else {
        setError("Could not get location details from selected place.");
      }
    }
  };

  return {
    isSearching,
    error,
    restaurants,
    searchLocationInput,
    searchQuery,
    hasSearched,
    locationInputRef,
    autocompleteInstance,
    setSearchLocationInput,
    findNearby,
    searchByLocationText,
    onAutocompleteLoad,
    onPlaceChanged,
  };
};
