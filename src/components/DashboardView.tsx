import React, { useState } from 'react';
import { UserProfile, WardrobeItem, SavedOutfit, OutfitRecommendation, ActiveTab } from '../types.js';
import { OutfitCard } from './OutfitCard.js';
import { getPersonalizedRecommendation, saveOutfit, sendFeedback } from '../api.js';
import {
  Sparkles,
  MessageSquare,
  Shirt,
  Bookmark,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Heart,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  profile: UserProfile;
  wardrobe: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  todayOutfit: OutfitRecommendation | null;
  onTodayOutfitUpdated: (outfit: OutfitRecommendation) => void;
  onOutfitSaved: (outfit: OutfitRecommendation) => void;
  savedOutfitIds: Set<string>;
  setActiveTab: (tab: ActiveTab) => void;
  likedCount: number;
}

const DASHBOARD_OCCASIONS = [
  'All / Default Profile',
  'Durga Puja',
  'Diwali',
  'Wedding',
  'Reception',
  'Festival',
  'Puja',
  'Traditional Ceremony',
  'Family Function',
  'College Fest',
  'Casual Traditional',
  'Campus & Lectures',
  'Evening Party',
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  wardrobe,
  savedOutfits,
  todayOutfit,
  onTodayOutfitUpdated,
  onOutfitSaved,
  savedOutfitIds,
  setActiveTab,
  likedCount,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All / Default Profile');
  const [generatingDaily, setGeneratingDaily] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);

  const handleRefreshDailyOutfit = async (overrideOccasion?: string) => {
    try {
      setGeneratingDaily(true);
      setDailyError(null);
      const occasionToUse = overrideOccasion || (selectedOccasion === 'All / Default Profile' ? undefined : selectedOccasion);
      const newRec = await getPersonalizedRecommendation(occasionToUse, profile.id);
      onTodayOutfitUpdated(newRec);
    } catch (err: any) {
      setDailyError(err.message || 'Failed to generate recommendation');
    } finally {
      setGeneratingDaily(false);
    }
  };

  const handleSaveOutfit = async (outfit: OutfitRecommendation) => {
    await saveOutfit(outfit, "Today's Recommended Outfit", profile.id);
    onOutfitSaved(outfit);
  };

  const handleFeedback = async (outfitId: string, outfitTitle: string, type: 'like' | 'dislike') => {
    await sendFeedback(outfitId, outfitTitle, type, profile.id);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4EDFF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EEF3FF] border border-[#D6E2FF] text-[#4A6CF7] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#E98BAF]" />
            <span>VastraAI Dashboard</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#20243A] tracking-tight">
            Welcome back, {profile.name} ✨
          </h1>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#5E6482]">
            <span>Primary Aesthetic:</span>
            {profile.genderProfile && profile.genderProfile !== 'Prefer not to say' && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0F5] border border-[#FAD0DF] text-[#C25480] font-semibold text-[11px]">
                {profile.genderProfile}
              </span>
            )}
            {profile.preferredStyles.map((style) => (
              <span
                key={style}
                className="px-2.5 py-0.5 rounded-full bg-[#EEF3FF] border border-[#D6E2FF] text-[#4A6CF7] font-semibold text-[11px]"
              >
                {style}
              </span>
            ))}
            <span className="text-[#D6E2FF]">•</span>
            <span className="font-medium text-[#4A6CF7] bg-[#EEF3FF] px-2.5 py-0.5 rounded-full border border-[#D6E2FF]">
              Budget: {profile.budget}
            </span>
            {profile.preferredClothing && profile.preferredClothing.length > 0 && (
              <>
                <span className="text-[#D6E2FF]">•</span>
                <span className="text-[#5E6482] text-[11px]">
                  {profile.preferredClothing.length} categories active
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Stylist & Wardrobe CTAs */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="dash-quick-stylist-btn"
            onClick={() => setActiveTab('stylist')}
            className="px-5 py-3 rounded-2xl bg-[#4A6CF7] text-white text-xs font-bold hover:bg-[#3B5BD8] transition-all flex items-center gap-2 shadow-sm"
          >
            <MessageSquare className="w-4 h-4 text-[#FFF0F5]" />
            <span>Ask AI Stylist</span>
          </button>

          <button
            id="dash-quick-wardrobe-btn"
            onClick={() => setActiveTab('wardrobe')}
            className="px-5 py-3 rounded-2xl bg-white border border-[#D6E2FF] text-[#20243A] text-xs font-bold hover:bg-[#EEF3FF] hover:text-[#4A6CF7] transition-all flex items-center gap-2 shadow-2xs"
          >
            <Shirt className="w-4 h-4 text-[#4A6CF7]" />
            <span>Virtual Wardrobe</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E4EDFF] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#5E6482] text-xs">
            <span>Wardrobe Items</span>
            <Shirt className="w-4 h-4 text-[#4A6CF7]" />
          </div>
          <p className="text-2xl font-display font-bold text-[#20243A]">{wardrobe.length}</p>
          <span className="text-[11px] text-[#5E6482] block">Cataloged garments</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E4EDFF] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#5E6482] text-xs">
            <span>Saved Outfits</span>
            <Bookmark className="w-4 h-4 text-[#E98BAF]" />
          </div>
          <p className="text-2xl font-display font-bold text-[#20243A]">{savedOutfits.length}</p>
          <span className="text-[11px] text-[#5E6482] block">Curated ensembles</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E4EDFF] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#5E6482] text-xs">
            <span>Style Likes</span>
            <Heart className="w-4 h-4 text-[#E98BAF]" />
          </div>
          <p className="text-2xl font-display font-bold text-[#20243A]">{likedCount}</p>
          <span className="text-[11px] text-[#5E6482] block">Preferences trained</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E4EDFF] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#5E6482] text-xs">
            <span>AI Model Status</span>
            <TrendingUp className="w-4 h-4 text-[#4A6CF7]" />
          </div>
          <p className="text-base font-display font-bold text-[#4A6CF7]">Gemini 3.8 Flash</p>
          <span className="text-[11px] text-[#4A6CF7] block flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A6CF7] animate-pulse" />
            Online & Ready
          </span>
        </div>
      </div>

      {/* Main Section: Today's Recommended Outfit */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#4A6CF7] block mb-0.5">
              Daily Curated Recommendation
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#20243A]">
              Today's Recommended Outfit
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="dashboard-occasion-select" className="text-xs text-[#5E6482] font-medium">
              Occasion:
            </label>
            <select
              id="dashboard-occasion-select"
              value={selectedOccasion}
              onChange={(e) => {
                const newOcc = e.target.value;
                setSelectedOccasion(newOcc);
                handleRefreshDailyOutfit(newOcc);
              }}
              className="px-3 py-1.5 rounded-xl border border-[#D6E2FF] bg-white text-xs font-medium text-[#20243A] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#4A6CF7]"
            >
              {DASHBOARD_OCCASIONS.map((occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>

            <button
              id="refresh-daily-outfit-btn"
              onClick={() => handleRefreshDailyOutfit()}
              disabled={generatingDaily}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#D6E2FF] bg-white text-[#4A6CF7] text-xs font-semibold hover:bg-[#EEF3FF] disabled:opacity-50 transition-all shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generatingDaily ? 'animate-spin' : ''}`} />
              <span>{generatingDaily ? 'Generating...' : 'Refresh AI Pick'}</span>
            </button>
          </div>
        </div>

        {dailyError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {dailyError}
          </div>
        )}

        {todayOutfit ? (
          <OutfitCard
            outfit={todayOutfit}
            isSaved={savedOutfitIds.has(todayOutfit.id)}
            onSave={handleSaveOutfit}
            onFeedback={handleFeedback}
            showSaveButton={true}
          />
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E4EDFF] text-[#5E6482]">
            <p className="text-sm">Click "Refresh AI Pick" to generate today's look!</p>
          </div>
        )}
      </section>

      {/* Two Column Grid: Wardrobe Preview & Saved Outfits Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wardrobe Preview */}
        <section className="bg-white rounded-3xl p-6 border border-[#E4EDFF] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt className="w-5 h-5 text-[#4A6CF7]" />
              <h3 className="font-display text-lg font-bold text-[#20243A]">
                Wardrobe Preview ({wardrobe.length})
              </h3>
            </div>
            <button
              id="view-all-wardrobe-btn"
              onClick={() => setActiveTab('wardrobe')}
              className="text-xs font-bold text-[#4A6CF7] hover:text-[#3B5BD8] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {wardrobe.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#E4EDFF] overflow-hidden bg-[#FAFBFF] group flex flex-col"
              >
                <div className="h-28 bg-[#EEF3FF] relative overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.itemName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#5E6482]/50">
                      <Shirt className="w-6 h-6 stroke-1" />
                    </div>
                  )}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/90 text-[#20243A]">
                    {item.category}
                  </span>
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-[#20243A] truncate">{item.itemName}</p>
                  <p className="text-[10px] text-[#5E6482]">{item.color}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <button
              id="dash-add-garment-btn"
              onClick={() => setActiveTab('wardrobe')}
              className="w-full py-2.5 rounded-xl border border-dashed border-[#D6E2FF] text-xs font-semibold text-[#4A6CF7] hover:bg-[#EEF3FF] transition-all"
            >
              + Add Garments to Wardrobe
            </button>
          </div>
        </section>

        {/* Saved Outfits Preview */}
        <section className="bg-white rounded-3xl p-6 border border-[#E4EDFF] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#E98BAF]" />
              <h3 className="font-display text-lg font-bold text-[#20243A]">
                Saved Outfits ({savedOutfits.length})
              </h3>
            </div>
            <button
              id="view-all-saved-btn"
              onClick={() => setActiveTab('saved')}
              className="text-xs font-bold text-[#4A6CF7] hover:text-[#3B5BD8] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {savedOutfits.length === 0 ? (
            <div className="p-6 text-center text-[#5E6482] text-xs">
              No saved outfits yet. Generate recommendations in the AI Stylist and save your favorites!
            </div>
          ) : (
            <div className="space-y-3">
              {savedOutfits.slice(0, 2).map((saved) => (
                <div
                  key={saved.id}
                  className="p-3.5 rounded-xl border border-[#E4EDFF] bg-[#FAFBFF] hover:bg-[#EEF3FF]/50 transition-colors flex items-start justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-sm text-[#20243A]">{saved.outfit.title}</h4>
                    <p className="text-xs text-[#5E6482] line-clamp-1 mt-0.5">
                      {saved.outfit.top} + {saved.outfit.bottom}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#5E6482]">
                      <span className="px-2 py-0.5 rounded-md bg-[#EEF3FF] text-[#4A6CF7] font-medium">
                        {saved.outfit.occasion}
                      </span>
                      <span>{saved.outfit.approximateBudget}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#5E6482] shrink-0">
                    {new Date(saved.savedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              id="dash-open-stylist-btn"
              onClick={() => setActiveTab('stylist')}
              className="w-full py-2.5 rounded-xl bg-[#4A6CF7] text-white text-xs font-semibold hover:bg-[#3B5BD8] transition-all flex items-center justify-center gap-2 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFF0F5]" />
              <span>Ask Stylist For New Suggestion</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
