export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  createdAt: Date;
  updatedAt: Date;
  settings: UserSettings;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    reviewResponse: boolean;
    newRestaurant: boolean;
  };
  language: string;
  theme: "light" | "dark" | "system";
}

export interface UserActivity {
  reviews: number;
  savedPlaces: number;
  collections: number;
  averageRating: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  restaurantCount: number;
  thumbnailUrl?: string;
}

export interface SavedPlace {
  id: string;
  placeId: string;
  name: string;
  address: string;
  savedAt: Date;
  collectionIds: string[];
  note?: string;
}
