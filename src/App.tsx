/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, UserProfile, WardrobeItem, SavedOutfit, FeedbackRecord, OutfitRecommendation } from './types.js';
import {
  fetchProfile,
  fetchWardrobe,
  fetchSavedOutfits,
  fetchFeedback,
  getPersonalizedRecommendation,
  sendFeedback,
} from './api.js';
import { Navbar } from './components/Navbar.js';
import { LandingView } from './components/LandingView.js';
import { DashboardView } from './components/DashboardView.js';
import { ProfilePreferencesView } from './components/ProfilePreferencesView.js';
import { AIStylistView } from './components/AIStylistView.js';
import { VirtualWardrobeView } from './components/VirtualWardrobeView.js';
import { SavedOutfitsView } from './components/SavedOutfitsView.js';
import { VastraLogoMark } from './components/VastraLogo.js';
import { RefreshCw } from 'lucide-react';

const FALLBACK_PROFILE: UserProfile = {
  id: 'user_student_1',
  name: 'Aanya Sharma',
  preferredStyles: ['Casual', 'Minimal', 'College', 'Streetwear'],
  favoriteColors: ['Black', 'Navy Blue', 'White', 'Beige', 'Olive Green'],
  preferredCategories: ['T-shirts', 'Shirts', 'Jeans', 'Trousers', 'Jackets', 'Shoes'],
  budget: '₹1500 - ₹3000',
  preferredOccasions: ['College', 'Daily Casual', 'Party', 'Weekend Outing'],
  updatedAt: new Date().toISOString(),
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [profile, setProfile] = useState<UserProfile>(FALLBACK_PROFILE);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([]);
  const [todayOutfit, setTodayOutfit] = useState<OutfitRecommendation | null>(null);

  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const [profData, wardrobeData, savedData, fbData] = await Promise.all([
          fetchProfile().catch(() => FALLBACK_PROFILE),
          fetchWardrobe().catch(() => []),
          fetchSavedOutfits().catch(() => []),
          fetchFeedback().catch(() => []),
        ]);

        setProfile(profData);
        setWardrobe(wardrobeData);
        setSavedOutfits(savedData);
        setFeedbackList(fbData);

        // Fetch initial daily recommendation
        try {
          const rec = await getPersonalizedRecommendation(undefined, profData.id);
          setTodayOutfit(rec);
        } catch (err) {
          console.warn('Initial daily rec load error:', err);
        }
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadData();
  }, []);

  const handleProfileUpdated = (updated: UserProfile) => {
    setProfile(updated);
  };

  const handleOutfitSaved = (newOutfit: OutfitRecommendation) => {
    // Check if already in savedOutfits
    if (!savedOutfits.some((s) => s.outfit.id === newOutfit.id)) {
      const newSaved: SavedOutfit = {
        id: `saved_${Date.now()}`,
        userId: profile.id,
        outfit: newOutfit,
        savedAt: new Date().toISOString(),
      };
      setSavedOutfits((prev) => [newSaved, ...prev]);
    }
  };

  const handleGlobalFeedback = async (
    outfitId: string,
    outfitTitle: string,
    type: 'like' | 'dislike'
  ) => {
    try {
      const record = await sendFeedback(outfitId, outfitTitle, type, profile.id);
      setFeedbackList((prev) => {
        const filtered = prev.filter((f) => f.outfitId !== outfitId);
        return [record, ...filtered];
      });
    } catch (err) {
      console.error('Feedback record error:', err);
    }
  };

  const savedOutfitIds = new Set(savedOutfits.map((s) => s.outfit.id));
  const likedCount = feedbackList.filter((f) => f.feedback === 'like').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFF] text-[#20243A]">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedOutfits.length}
        wardrobeCount={wardrobe.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {loadingInitial ? (
          <div className="py-24 text-center space-y-4">
            <div className="inline-block animate-pulse">
              <VastraLogoMark
                size={40}
                withContainer={true}
                containerClassName="w-14 h-14 rounded-2xl shadow-xs mx-auto"
                idPrefix="loading-mark"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#20243A]">
                Loading <span>Vastra</span><span className="text-[#4A6CF7]">AI</span>...
              </p>
              <p className="text-xs text-[#5E6482] mt-0.5">Connecting your style profile and AI Stylist</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'landing' && (
              <LandingView
                onGetStarted={() => setActiveTab('preferences')}
                onTryStylist={() => setActiveTab('stylist')}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                profile={profile}
                wardrobe={wardrobe}
                savedOutfits={savedOutfits}
                todayOutfit={todayOutfit}
                onTodayOutfitUpdated={setTodayOutfit}
                onOutfitSaved={handleOutfitSaved}
                savedOutfitIds={savedOutfitIds}
                setActiveTab={setActiveTab}
                likedCount={likedCount}
              />
            )}

            {activeTab === 'preferences' && (
              <ProfilePreferencesView
                profile={profile}
                wardrobe={wardrobe}
                onProfileUpdated={handleProfileUpdated}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'stylist' && (
              <AIStylistView
                profile={profile}
                onOutfitSaved={handleOutfitSaved}
                savedOutfitIds={savedOutfitIds}
              />
            )}

            {activeTab === 'wardrobe' && (
              <VirtualWardrobeView
                wardrobe={wardrobe}
                onWardrobeUpdated={setWardrobe}
                userId={profile.id}
                onOutfitSaved={handleOutfitSaved}
                savedOutfitIds={savedOutfitIds}
              />
            )}

            {activeTab === 'saved' && (
              <SavedOutfitsView
                savedOutfits={savedOutfits}
                onSavedOutfitsUpdated={setSavedOutfits}
                userId={profile.id}
                setActiveTab={setActiveTab}
                onFeedback={handleGlobalFeedback}
              />
            )}
          </>
        )}
      </main>

      {/* Modern Fashion Platform Footer */}
      <footer className="border-t border-[#E8EDFB] bg-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5E6482]">
          <div className="flex items-center gap-2">
            <VastraLogoMark size={16} idPrefix="footer-mark" />
            <span className="font-bold text-[#20243A]">
              <span>Vastra</span><span className="text-[#4A6CF7]">AI</span>
            </span>
            <span className="text-[#D6E2FF]">•</span>
            <span>Your Personal AI Fashion Stylist</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Style that feels uniquely yours</span>
            <span className="text-[#D6E2FF]">•</span>
            <span className="text-[#4A6CF7] font-medium">Powered by Gemini 3.8</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
