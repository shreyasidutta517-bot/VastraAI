/**
 * VastraAI - Your Personal AI Fashion Stylist
 * Core Data Models and Type Definitions
 */

export type GenderFashionProfile = 'Female' | 'Male' | 'Non-binary' | 'Prefer not to say';

export interface UserProfile {
  id: string;
  name: string;
  genderProfile?: GenderFashionProfile | string;
  preferredStyles: string[];
  favoriteColors: string[];
  preferredCategories: string[];
  preferredClothing?: string[];
  budget: string;
  preferredOccasions: string[];
  updatedAt: string;
}

export type WesternWardrobeCategory =
  | 'T-shirts'
  | 'Shirts'
  | 'Tops'
  | 'Trousers'
  | 'Jeans'
  | 'Dresses'
  | 'Jackets'
  | 'Skirts'
  | 'Shoes'
  | 'Accessories';

export type IndianWardrobeCategory =
  | 'Sarees'
  | 'Blouses'
  | 'Salwar Suits'
  | 'Kurtas'
  | 'Kurta Sets'
  | 'Palazzo Pants'
  | 'Churidar'
  | 'Lehengas'
  | 'Dupattas'
  | 'Anarkalis'
  | 'Ethnic Skirts'
  | 'Ethnic Bottoms'
  | 'Ethnic Footwear'
  | 'Indian Jewellery'
  | 'Other Traditional Accessories';

export type WardrobeCategory = WesternWardrobeCategory | IndianWardrobeCategory | string;

export interface WardrobeItem {
  id: string;
  userId: string;
  itemName: string;
  category: WardrobeCategory;
  color: string;
  style: string;
  image?: string;
  createdAt: string;

  // Dedicated Saree attributes
  fabric?: string; // e.g. Silk, Banarasi, Kanjeevaram, Chanderi, Georgette, Organza, Cotton
  sareeType?: string; // e.g. Banarasi, Kanjeevaram, Chanderi, Bandhani, Jamdani, Handloom, Ready-to-wear
  occasion?: string;

  // Dedicated Blouse attributes
  sleeveStyle?: string; // e.g. Sleeveless, Elbow-length, Full Sleeves, Cap Sleeves, 3/4 Sleeves
  neckStyle?: string; // e.g. Sweetheart, Boat Neck, Deep V, High Neck, Round Neck, Backless / Dori

  // Additional styling notes
  notes?: string;
}

export interface WhyThisOutfitReason {
  styleReason?: string;
  occasionReason?: string;
  wardrobeReason?: string;
  colorReason?: string;
  budgetReason?: string;
  points?: string[];
}

export interface OutfitRecommendation {
  id: string;
  title: string;
  top: string;
  bottom: string;
  clothingPieces?: string[];
  footwear: string;
  accessories: string;
  suggestedColors: string[];
  occasion: string;
  approximateBudget: string;
  explanation: string;
  source: 'ai_stylist' | 'wardrobe' | 'daily_pick';
  usesWardrobeItems?: boolean;
  wardrobeItemNames?: string[];
  whyThisOutfit?: WhyThisOutfitReason;
  createdAt: string;
}

export interface SavedOutfit {
  id: string;
  userId: string;
  outfit: OutfitRecommendation;
  savedAt: string;
  notes?: string;
}

export interface FeedbackRecord {
  id: string;
  userId: string;
  outfitId: string;
  outfitTitle?: string;
  feedback: 'like' | 'dislike';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  outfit?: OutfitRecommendation;
}

export type ActiveTab =
  | 'landing'
  | 'dashboard'
  | 'profile'
  | 'preferences'
  | 'stylist'
  | 'wardrobe'
  | 'saved';
