/**
 * Google Places Details 응답을 이 페이지에서 쓰기 좋게 단정한 형태
 */
export interface RestaurantDetails extends google.maps.places.PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating: number;
  user_ratings_total: number;
  photos?: google.maps.places.PlacePhoto[];
  url?: string;
}
