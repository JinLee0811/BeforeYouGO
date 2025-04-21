import { useState, useEffect } from "react";
import { useLoadScript } from "@react-google-maps/api";

const libraries: "places"[] = ["places"];

export function useGoogleMaps() {
  const [autocompleteInstance, setAutocompleteInstance] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // API 키 검증
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setApiKeyError("Google Maps API 키가 설정되지 않았습니다.");
      console.error("Google Maps API 키가 없습니다. .env.local 파일을 확인해주세요.");
      return;
    }

    // 개발 환경에서만 API 키 형식 검증
    if (process.env.NODE_ENV === "development") {
      if (!apiKey.match(/^[A-Za-z0-9_-]{39}$/)) {
        setApiKeyError("유효하지 않은 API 키 형식입니다.");
        console.error("Google Maps API 키 형식이 올바르지 않습니다.");
        return;
      }
    }
  }, []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
    language: "en",
  });

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocompleteInstance(autocomplete);
  };

  const getPlaceDetails = (placeId: string): Promise<google.maps.places.PlaceResult> => {
    return new Promise((resolve, reject) => {
      if (!isLoaded) {
        reject(new Error("Google Maps not loaded"));
        return;
      }

      if (apiKeyError) {
        reject(new Error(apiKeyError));
        return;
      }

      const service = new google.maps.places.PlacesService(document.createElement("div"));
      service.getDetails(
        {
          placeId: placeId,
          fields: ["name", "rating", "formatted_address", "photos", "price_level"],
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error("Failed to get place details"));
          }
        }
      );
    });
  };

  const geocodeLocation = async (locationText: string): Promise<{ lat: number; lng: number }> => {
    if (!isLoaded) {
      throw new Error("Google Maps not loaded");
    }

    if (apiKeyError) {
      throw new Error(apiKeyError);
    }

    const geocoder = new google.maps.Geocoder();
    const addressToGeocode = locationText.toLowerCase().includes("sydney")
      ? locationText
      : `${locationText}, Sydney, Australia`;

    const response = await geocoder.geocode({ address: addressToGeocode });
    if (response.results.length > 0) {
      return {
        lat: response.results[0].geometry.location.lat(),
        lng: response.results[0].geometry.location.lng(),
      };
    }
    throw new Error(`Could not find coordinates for "${locationText}"`);
  };

  return {
    isLoaded,
    loadError,
    apiKeyError,
    autocompleteInstance,
    onAutocompleteLoad,
    getPlaceDetails,
    geocodeLocation,
  };
}
