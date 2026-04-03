/**
 * My page data shapes (Supabase)
 */

/** Restaurant open history (user_place_clicks) */
export interface MyPagePlaceClick {
  place_id: string;
  restaurant_name: string;
  restaurant_address: string | null;
  image_url: string | null;
  click_count: number;
  first_clicked_at: string;
  last_clicked_at: string;
}

export interface MyPageBookmark {
  id: string;
  place_id: string;
  restaurant_name: string;
  restaurant_address: string;
  image_url: string | null;
  average_rating: number;
  sentiment: "positive" | "negative" | "mixed";
  positive_keywords: string[];
  negative_keywords: string[];
  mentioned_menu_items: string[];
  recommended_dishes: string[];
  summary: string;
  photo_urls: string[];
  created_at: string;
  is_pro_analysis: boolean;
}

export interface MyPageReview {
  id: string;
  user_id: string;
  content: string;
  rating: number;
  created_at: string;
  restaurant_name: string;
  restaurant_address: string;
  place_id: string;
  user_sentiment: "positive" | "negative" | "mixed" | null;
  mentioned_menu_items: string[] | null;
  recommended_dishes: string[] | null;
}
