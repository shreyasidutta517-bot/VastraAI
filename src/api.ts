import { UserProfile, WardrobeItem, SavedOutfit, FeedbackRecord, OutfitRecommendation } from './types.js';

const BASE_URL = '/api';

export async function fetchHealth(): Promise<{ status: string; geminiConfigured: boolean }> {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}

// User Profile
export async function fetchProfile(userId?: string): Promise<UserProfile> {
  const url = userId ? `${BASE_URL}/profile?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/profile`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch profile');
  return data.profile;
}

export async function updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update profile');
  return data.profile;
}

// Wardrobe
export async function fetchWardrobe(userId?: string): Promise<WardrobeItem[]> {
  const url = userId ? `${BASE_URL}/wardrobe?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/wardrobe`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch wardrobe');
  return data.items;
}

export async function addWardrobeItem(item: {
  itemName: string;
  category: string;
  color: string;
  style: string;
  image?: string;
  userId?: string;
  fabric?: string;
  sareeType?: string;
  sleeveStyle?: string;
  neckStyle?: string;
  occasion?: string;
  notes?: string;
}): Promise<WardrobeItem> {
  const res = await fetch(`${BASE_URL}/wardrobe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to add wardrobe item');
  return data.item;
}

export async function deleteWardrobeItem(id: string, userId?: string): Promise<boolean> {
  const url = userId ? `${BASE_URL}/wardrobe/${id}?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/wardrobe/${id}`;
  const res = await fetch(url, { method: 'DELETE' });
  const data = await res.json();
  return data.success;
}

// Saved Outfits
export async function fetchSavedOutfits(userId?: string): Promise<SavedOutfit[]> {
  const url = userId ? `${BASE_URL}/saved-outfits?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/saved-outfits`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch saved outfits');
  return data.savedOutfits;
}

export async function saveOutfit(outfit: OutfitRecommendation, notes?: string, userId?: string): Promise<SavedOutfit> {
  const res = await fetch(`${BASE_URL}/saved-outfits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outfit, notes, userId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to save outfit');
  return data.savedOutfit;
}

export async function deleteSavedOutfit(id: string, userId?: string): Promise<boolean> {
  const url = userId ? `${BASE_URL}/saved-outfits/${id}?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/saved-outfits/${id}`;
  const res = await fetch(url, { method: 'DELETE' });
  const data = await res.json();
  return data.success;
}

// Feedback
export async function fetchFeedback(userId?: string): Promise<FeedbackRecord[]> {
  const url = userId ? `${BASE_URL}/feedback?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/feedback`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch feedback');
  return data.feedback;
}

export async function sendFeedback(
  outfitId: string,
  outfitTitle: string,
  feedback: 'like' | 'dislike',
  userId?: string
): Promise<FeedbackRecord> {
  const res = await fetch(`${BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outfitId, outfitTitle, feedback, userId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to send feedback');
  return data.record;
}

// AI Functions
export async function getPersonalizedRecommendation(occasion?: string, userId?: string): Promise<OutfitRecommendation> {
  const res = await fetch(`${BASE_URL}/ai/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ occasion, userId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to generate recommendation');
  return data.recommendation;
}

export async function askAIStylist(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userId?: string
): Promise<{ reply: string; outfit?: OutfitRecommendation }> {
  const res = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, userId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'AI Stylist error');
  return data;
}

export async function createOutfitFromWardrobe(occasion?: string, userId?: string): Promise<OutfitRecommendation> {
  const res = await fetch(`${BASE_URL}/ai/wardrobe-outfit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ occasion, userId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create outfit from wardrobe');
  return data.outfit;
}
