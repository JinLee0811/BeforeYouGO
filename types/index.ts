export interface Review {
  text: string;
  rating: number;
  date: string;
}

// Base analysis result type
export interface AnalysisResult {
  sentiment: string;
  summary: string;
  average_rating: number;
  photo_urls?: string[]; // Optional: Might be added later
}

export interface BasicSummaryResult extends AnalysisResult {
  review_count: number;
  fromCache: boolean;
}

// Detailed result adds more fields to the base
export interface DetailedAnalysisResult extends AnalysisResult {
  positive_keywords: string[];
  negative_keywords: string[];
  mentioned_menu_items: string[];
  recommended_dishes: string[];
  is_pro_analysis: boolean;
}

export interface ApiResponse<T = BasicSummaryResult | DetailedAnalysisResult> {
  success: boolean;
  data?: T;
  error?: string;
  fromCache?: boolean;
}

// Bookmark type (ensure all fields match Supabase table)
export interface Bookmark {
  id: number;
  user_id: string;
  place_id: string;
  restaurant_name: string;
  sentiment: string;
  summary: string;
  average_rating: number;
  review_count?: number;
  positive_keywords?: string[];
  negative_keywords?: string[];
  mentioned_menu_items?: string[];
  recommended_dishes?: string[];
  photo_urls?: string[];
  is_pro_analysis: boolean;
  created_at: string;
}
