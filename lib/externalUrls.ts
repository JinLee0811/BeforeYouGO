export const googleMaps = {
  jsBaseUrl:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_URL || "https://maps.googleapis.com/maps/api/js",
  placesDetailsUrl:
    process.env.GOOGLE_MAPS_PLACES_DETAILS_URL ||
    "https://maps.googleapis.com/maps/api/place/details/json",
  photoUrl:
    process.env.GOOGLE_MAPS_PHOTO_URL || "https://maps.googleapis.com/maps/api/place/photo",
};

export const getSupabaseRedirectUrl = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "")
  );
};

export const getSupabaseEmailRedirectUrl = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_EMAIL_REDIRECT_URL || getSupabaseRedirectUrl();
};
