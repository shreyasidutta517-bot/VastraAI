import React, { useState } from 'react';
import { OutfitRecommendation, WardrobeItem } from '../types.js';
import { createOutfitFromWardrobe, saveOutfit, sendFeedback } from '../api.js';
import { OutfitCard } from './OutfitCard.js';
import { Sparkles, X, RefreshCw, Layers } from 'lucide-react';

interface WardrobeOutfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardrobe: WardrobeItem[];
  userId: string;
  onOutfitSaved: (outfit: OutfitRecommendation) => void;
  savedOutfitIds: Set<string>;
}

const OCCASIONS = [
  'Wedding',
  'Reception',
  'Festival',
  'Puja',
  'Diwali',
  'Durga Puja',
  'Traditional Ceremony',
  'Family Function',
  'College Fest',
  'Casual Traditional',
  'Formal Traditional',
  'Campus & Lectures',
  'Casual Weekend Hangout',
  'Evening Party / Dinner',
  'Presentation / Semi-Formal',
  'Outdoor Travel / Cafe',
];

export const WardrobeOutfitModal: React.FC<WardrobeOutfitModalProps> = ({
  isOpen,
  onClose,
  wardrobe,
  userId,
  onOutfitSaved,
  savedOutfitIds,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState(OCCASIONS[0]);
  const [loading, setLoading] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<OutfitRecommendation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (wardrobe.length === 0) {
      setErrorMsg('Please add at least 2 wardrobe items (e.g. a shirt and trousers) first.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const outfit = await createOutfitFromWardrobe(selectedOccasion, userId);
      setGeneratedOutfit(outfit);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assemble outfit from wardrobe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 overflow-hidden relative max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E4EDFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EEF3FF] text-[#4A6CF7] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#E98BAF]" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-[#20243A]">
                Create Outfit From My Wardrobe
              </h2>
              <p className="text-xs text-[#5E6482]">
                VastraAI combines items you already own into a coherent look.
              </p>
            </div>
          </div>
          <button
            id="close-wardrobe-outfit-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EEF3FF] text-[#5E6482] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Occasion Selection & Trigger */}
        <div className="p-4 rounded-2xl bg-[#FAFBFF] border border-[#D6E2FF] space-y-3">
          <label htmlFor="wardrobe-occasion-select" className="block text-xs font-semibold text-[#20243A]">
            Select Target Occasion for this Outfit:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              id="wardrobe-occasion-select"
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#D6E2FF] text-xs font-medium bg-white text-[#20243A] focus:outline-none focus:ring-2 focus:ring-[#4A6CF7]"
            >
              {OCCASIONS.map((occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>

            <button
              id="generate-wardrobe-outfit-btn"
              onClick={handleGenerate}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#4A6CF7] text-white font-semibold text-xs hover:bg-[#3B5BD8] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Matching items...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#FFF0F5]" />
                  <span>Assemble Outfit</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#5E6482]">
            <Layers className="w-3.5 h-3.5 text-[#4A6CF7]" />
            <span>Scanning your {wardrobe.length} cataloged wardrobe garments.</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Generated Outfit Result */}
        {generatedOutfit && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-[#20243A] uppercase tracking-wider block">
              Assembled Wardrobe Combination:
            </span>
            <OutfitCard
              outfit={generatedOutfit}
              isSaved={savedOutfitIds.has(generatedOutfit.id)}
              onSave={async (outfit) => {
                await saveOutfit(outfit, 'Assembled from Virtual Wardrobe', userId);
                onOutfitSaved(outfit);
              }}
              onFeedback={async (id, title, type) => {
                await sendFeedback(id, title, type, userId);
              }}
              showSaveButton={true}
            />
          </div>
        )}

        {/* Empty state / instructions before first generate */}
        {!generatedOutfit && !loading && (
          <div className="p-8 text-center text-[#5E6482] space-y-2 border border-dashed border-[#D6E2FF] rounded-2xl bg-white">
            <Sparkles className="w-8 h-8 text-[#E98BAF] mx-auto" />
            <p className="text-sm font-medium text-[#20243A]">
              Ready to assemble an outfit from what you already own
            </p>
            <p className="text-xs text-[#5E6482] max-w-sm mx-auto">
              Select an occasion above and click "Assemble Outfit" to let VastraAI coordinate your wardrobe items into a stylish set.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
