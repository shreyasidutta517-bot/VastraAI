import React, { useState } from 'react';
import { OutfitRecommendation } from '../types.js';
import {
  Heart,
  ThumbsDown,
  Bookmark,
  Check,
  Sparkles,
  Shirt,
  Footprints,
  Layers,
  Tag,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface OutfitCardProps {
  outfit: OutfitRecommendation;
  isSaved?: boolean;
  userFeedback?: 'like' | 'dislike';
  onSave?: (outfit: OutfitRecommendation) => Promise<void> | void;
  onFeedback?: (outfitId: string, outfitTitle: string, type: 'like' | 'dislike') => Promise<void> | void;
  showSaveButton?: boolean;
  className?: string;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  isSaved = false,
  userFeedback,
  onSave,
  onFeedback,
  showSaveButton = true,
  className = '',
}) => {
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<'like' | 'dislike' | undefined>(userFeedback);

  const handleSave = async () => {
    if (saving || isSaved || justSaved || !onSave) return;
    try {
      setSaving(true);
      await onSave(outfit);
      setJustSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFeedbackClick = async (type: 'like' | 'dislike') => {
    const nextFeedback = currentFeedback === type ? undefined : type;
    setCurrentFeedback(nextFeedback);
    if (onFeedback && nextFeedback) {
      await onFeedback(outfit.id, outfit.title, nextFeedback);
    }
  };

  const why = outfit.whyThisOutfit;
  const usesWardrobe = Boolean(
    outfit.usesWardrobeItems ||
    (outfit.wardrobeItemNames && outfit.wardrobeItemNames.length > 0)
  );

  return (
    <div
      id={`outfit-card-${outfit.id}`}
      className={`bg-white rounded-2xl border border-[#E4EDFF] hover:border-[#4A6CF7]/40 shadow-xs hover:shadow-sm transition-all duration-300 overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-5 pb-4 border-b border-[#E8EDFB] bg-[#FAFBFF]/80">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF3FF] text-[#4A6CF7] border border-[#D6E2FF]">
                <Sparkles className="w-3 h-3 text-[#E98BAF]" />
                {outfit.source === 'wardrobe' || usesWardrobe ? 'Wardrobe Assembled' : 'AI Curated'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF0F5] text-[#C25480] border border-[#FAD0DF]">
                {outfit.occasion}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF3FF] text-[#4A6CF7] border border-[#D6E2FF]">
                {outfit.approximateBudget}
              </span>
            </div>
            <h3 className="font-display text-lg font-bold text-[#20243A] leading-snug">
              {outfit.title}
            </h3>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {showSaveButton && (
              <button
                id={`save-btn-${outfit.id}`}
                onClick={handleSave}
                disabled={isSaved || justSaved || saving}
                title={isSaved || justSaved ? 'Saved to collection' : 'Save outfit'}
                className={`p-2 px-3 rounded-xl transition-all text-xs flex items-center gap-1.5 font-medium ${
                  isSaved || justSaved
                    ? 'bg-[#4A6CF7] text-white'
                    : 'bg-[#EEF3FF] hover:bg-[#D6E2FF] text-[#4A6CF7]'
                }`}
              >
                {isSaved || justSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Outfit Breakdown Grid */}
      <div className="p-5 space-y-4 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {/* Top / Upper Piece */}
          <div className="p-3 rounded-xl bg-[#FAFBFF] border border-[#E8EDFB]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5E6482] uppercase tracking-wider mb-1">
              <Shirt className="w-3.5 h-3.5 text-[#4A6CF7]" />
              <span>Top / Upper Piece</span>
            </div>
            <p className="font-medium text-[#20243A]">{outfit.top}</p>
          </div>

          {/* Bottom / Lower Piece */}
          <div className="p-3 rounded-xl bg-[#FAFBFF] border border-[#E8EDFB]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5E6482] uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5 text-[#4A6CF7]" />
              <span>Bottom / Drape</span>
            </div>
            <p className="font-medium text-[#20243A]">{outfit.bottom}</p>
          </div>

          {/* Footwear */}
          <div className="p-3 rounded-xl bg-[#FAFBFF] border border-[#E8EDFB]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5E6482] uppercase tracking-wider mb-1">
              <Footprints className="w-3.5 h-3.5 text-[#E98BAF]" />
              <span>Footwear</span>
            </div>
            <p className="font-medium text-[#20243A]">{outfit.footwear}</p>
          </div>

          {/* Accessories */}
          <div className="p-3 rounded-xl bg-[#FAFBFF] border border-[#E8EDFB]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5E6482] uppercase tracking-wider mb-1">
              <Tag className="w-3.5 h-3.5 text-[#E98BAF]" />
              <span>Accessories / Jewellery</span>
            </div>
            <p className="font-medium text-[#20243A]">{outfit.accessories}</p>
          </div>
        </div>

        {/* Color Palette Suggestions */}
        {outfit.suggestedColors && outfit.suggestedColors.length > 0 && (
          <div>
            <span className="text-xs font-medium text-[#5E6482] block mb-1.5">Color Harmony:</span>
            <div className="flex flex-wrap gap-1.5">
              {outfit.suggestedColors.map((color, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF3FF] text-[#20243A] border border-[#D6E2FF]"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Wardrobe Items Included (if assembled from wardrobe) */}
        {outfit.wardrobeItemNames && outfit.wardrobeItemNames.length > 0 && (
          <div className="p-3 rounded-xl bg-[#FFF0F5] border border-[#FAD0DF] text-xs">
            <span className="font-semibold text-[#C25480] block mb-1">
              Pieces used from your virtual wardrobe:
            </span>
            <ul className="list-disc list-inside text-[#A33B65] space-y-0.5">
              {outfit.wardrobeItemNames.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          </div>
        )}

        {/* "Why this outfit?" Reasoning Section */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#FAFBFF] to-[#FFF7FA] border border-[#E0EAFF] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#EEF3FF] flex items-center justify-center text-[#4A6CF7]">
                <HelpCircle className="w-3.5 h-3.5 text-[#4A6CF7]" />
              </div>
              <span className="text-xs font-bold text-[#20243A] uppercase tracking-wider">
                Why this outfit?
              </span>
            </div>
            {usesWardrobe && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C25480] bg-[#FFF0F5] px-2 py-0.5 rounded-full border border-[#FAD0DF]">
                <CheckCircle2 className="w-3 h-3 text-[#E98BAF]" />
                Wardrobe Owned
              </span>
            )}
          </div>

          <ul className="space-y-2 text-xs text-[#20243A]">
            {/* Preferred Style */}
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#4A6CF7] shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold text-[#20243A]">Matches your preferred style:</strong>{' '}
                <span className="text-[#5E6482]">
                  {why?.styleReason || 'Curated specifically in harmony with your style preferences and silhouette choice.'}
                </span>
              </span>
            </li>

            {/* Selected Occasion */}
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#4A6CF7] shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold text-[#20243A]">Suitable for the selected occasion:</strong>{' '}
                <span className="text-[#5E6482]">
                  {why?.occasionReason || `Designed to look polished and appropriate for ${outfit.occasion}.`}
                </span>
              </span>
            </li>

            {/* Wardrobe Items */}
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#4A6CF7] shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold text-[#20243A]">Uses items from your wardrobe:</strong>{' '}
                <span className="text-[#5E6482]">
                  {why?.wardrobeReason ||
                    (usesWardrobe && outfit.wardrobeItemNames?.length
                      ? `Features ${outfit.wardrobeItemNames.join(', ')} already cataloged in your wardrobe.`
                      : 'Styled to pair naturally with your existing collection.')}
                </span>
              </span>
            </li>

            {/* Preferred Colours */}
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#4A6CF7] shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold text-[#20243A]">Matches your preferred colours:</strong>{' '}
                <span className="text-[#5E6482]">
                  {why?.colorReason ||
                    (outfit.suggestedColors?.length
                      ? `Combines ${outfit.suggestedColors.join(', ')} for flattering harmony.`
                      : 'Harmonious colour palette coordinated with your preferences.')}
                </span>
              </span>
            </li>

            {/* Budget */}
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#4A6CF7] shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold text-[#20243A]">Fits your budget:</strong>{' '}
                <span className="text-[#5E6482]">
                  {why?.budgetReason ||
                    (outfit.approximateBudget
                      ? `Estimated at ${outfit.approximateBudget}, matching your spending preference.`
                      : 'Fits comfortably within your target budget.')}
                </span>
              </span>
            </li>
          </ul>
        </div>

        {/* AI Stylist Note */}
        {outfit.explanation && (
          <div className="pt-0.5">
            <p className="text-xs text-[#5E6482] leading-relaxed italic bg-[#FAFBFF] p-3 rounded-xl border border-[#E8EDFB]">
              "{outfit.explanation}"
            </p>
          </div>
        )}
      </div>

      {/* Footer / Feedback Controls */}
      <div className="px-5 py-3 bg-[#FAFBFF] border-t border-[#E8EDFB] flex items-center justify-between text-xs text-[#5E6482]">
        <span className="font-medium">Feedback helps Gemini personalize your taste:</span>
        <div className="flex items-center gap-1.5">
          <button
            id={`like-btn-${outfit.id}`}
            onClick={() => handleFeedbackClick('like')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
              currentFeedback === 'like'
                ? 'bg-[#FFF0F5] border-[#FAD0DF] text-[#C25480] font-semibold'
                : 'border-[#D6E2FF] hover:bg-white text-[#5E6482]'
            }`}
            title="Like this recommendation"
          >
            <Heart
              className={`w-3.5 h-3.5 ${currentFeedback === 'like' ? 'fill-[#E98BAF] text-[#E98BAF]' : ''}`}
            />
            <span>{currentFeedback === 'like' ? 'Liked' : 'Like'}</span>
          </button>

          <button
            id={`dislike-btn-${outfit.id}`}
            onClick={() => handleFeedbackClick('dislike')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
              currentFeedback === 'dislike'
                ? 'bg-slate-200 border-slate-300 text-slate-800 font-semibold'
                : 'border-[#D6E2FF] hover:bg-white text-[#5E6482]'
            }`}
            title="Dislike this recommendation"
          >
            <ThumbsDown
              className={`w-3.5 h-3.5 ${currentFeedback === 'dislike' ? 'fill-slate-600 text-slate-700' : ''}`}
            />
            <span>{currentFeedback === 'dislike' ? 'Disliked' : 'Dislike'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
