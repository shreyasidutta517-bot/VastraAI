import React, { useState } from 'react';
import { UserProfile, ActiveTab, WardrobeItem } from '../types.js';
import { updateProfile } from '../api.js';
import {
  Check,
  Sparkles,
  ArrowRight,
  Palette,
  Sliders,
  DollarSign,
  Calendar,
  Layers,
  Shirt,
  User,
  ExternalLink,
} from 'lucide-react';

interface ProfilePreferencesViewProps {
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
  setActiveTab: (tab: ActiveTab) => void;
  wardrobe?: WardrobeItem[];
}

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'] as const;

const STYLE_OPTIONS = [
  { id: 'Casual', label: 'Casual', desc: 'Relaxed everyday comfort, unforced style' },
  { id: 'Formal', label: 'Formal', desc: 'Clean tailoring, shirts, blazers & polished shoes' },
  { id: 'Streetwear', label: 'Streetwear', desc: 'Oversized silhouettes, sneakers, bold accents' },
  { id: 'Traditional', label: 'Traditional', desc: 'Ethnic wear, cultural kurtas, festive sarees & elegance' },
  { id: 'Party', label: 'Party', desc: 'Chic evening wear, statement pieces, textured fabrics' },
  { id: 'College', label: 'College', desc: 'Smart campus wear, layered shirts, easy movement' },
  { id: 'Minimal', label: 'Minimal', desc: 'Neutral tones, monochrome palettes, understated luxury' },
  { id: 'Sporty', label: 'Sporty', desc: 'Athleisure, performance hoodies, track chinos' },
];

const COLOR_PALETTE = [
  { name: 'Black', hex: '#1c1917' },
  { name: 'White', hex: '#ffffff', border: true },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Beige', hex: '#e7d8c9' },
  { name: 'Olive Green', hex: '#556b2f' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Pastel Blue', hex: '#bfdbfe' },
  { name: 'Terracotta', hex: '#c85a32' },
  { name: 'Cobalt Blue', hex: '#2563eb' },
  { name: 'Forest Green', hex: '#166534' },
  { name: 'Warm Tan', hex: '#d2b48c' },
  { name: 'Slate Gray', hex: '#64748b' },
];

// Grouped Preferred Clothing Categories
const CLOTHING_GROUPS = [
  {
    title: 'Western / General',
    items: ['T-Shirts', 'Shirts', 'Tops', 'Jeans', 'Trousers', 'Dresses', 'Skirts', 'Jackets'],
  },
  {
    title: 'Indian / Traditional',
    isTraditional: true,
    items: [
      'Sarees',
      'Blouses',
      'Kurtas',
      'Kurta Sets',
      'Salwar Suits',
      'Anarkalis',
      'Lehengas',
      'Dupattas',
      'Palazzo Pants',
      'Churidar',
      'Ethnic Skirts',
    ],
  },
  {
    title: 'Footwear',
    items: ['Sneakers', 'Flats', 'Heels', 'Sandals', 'Juttis', 'Ethnic Footwear'],
  },
  {
    title: 'Accessories',
    items: ['Handbags', 'Jewellery', 'Watches', 'Scarves', 'Other Accessories'],
  },
];

const TRADITIONAL_CLOTHING_ITEMS = [
  'Sarees',
  'Blouses',
  'Kurtas',
  'Kurta Sets',
  'Salwar Suits',
  'Anarkalis',
  'Lehengas',
  'Dupattas',
  'Palazzo Pants',
  'Churidar',
  'Ethnic Skirts',
  'Juttis',
  'Ethnic Footwear',
  'Jewellery',
];

const OCCASION_OPTIONS = [
  'College',
  'Casual',
  'Office',
  'Party',
  'Date',
  'Wedding',
  'Reception',
  'Festival',
  'Durga Puja',
  'Diwali',
  'Puja',
  'Family Function',
  'Traditional Ceremony',
  'Travel',
];

const BUDGET_OPTIONS = [
  'Under ₹1,000 (Budget Friendly)',
  '₹1,000 - ₹2,500 (Smart Value)',
  '₹2,500 - ₹5,000 (Premium Quality)',
  '₹5,000+ (Designer / Luxe)',
];

export const ProfilePreferencesView: React.FC<ProfilePreferencesViewProps> = ({
  profile,
  onProfileUpdated,
  setActiveTab,
  wardrobe = [],
}) => {
  const [name, setName] = useState(profile.name || '');
  const [genderProfile, setGenderProfile] = useState<string>(profile.genderProfile || '');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(profile.preferredStyles || []);
  const [selectedColors, setSelectedColors] = useState<string[]>(profile.favoriteColors || []);
  const [selectedClothing, setSelectedClothing] = useState<string[]>(
    profile.preferredClothing || profile.preferredCategories || []
  );
  const [budget, setBudget] = useState(profile.budget || BUDGET_OPTIONS[1]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(profile.preferredOccasions || []);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isTraditionalActive = selectedStyles.some((s) => s.toLowerCase() === 'traditional');

  const toggleArrayItem = (list: string[], item: string): string[] => {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  };

  const handleSelectAllTraditional = () => {
    const combined = Array.from(new Set([...selectedClothing, ...TRADITIONAL_CLOTHING_ITEMS]));
    setSelectedClothing(combined);
  };

  const handleClearTraditional = () => {
    setSelectedClothing(selectedClothing.filter((i) => !TRADITIONAL_CLOTHING_ITEMS.includes(i)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (selectedStyles.length === 0) {
      setErrorMsg('Please select at least one style preference.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      const updated = await updateProfile({
        id: profile.id,
        name: name.trim(),
        genderProfile: genderProfile || undefined,
        preferredStyles: selectedStyles,
        favoriteColors: selectedColors,
        preferredCategories: selectedClothing,
        preferredClothing: selectedClothing,
        budget,
        preferredOccasions: selectedOccasions,
      });

      onProfileUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  // Dynamic Wardrobe Summary calculation based on ACTUAL wardrobe data
  const totalWardrobeItems = wardrobe.length;
  const categoryCounts: Record<string, number> = {};
  wardrobe.forEach((item) => {
    const cat = item.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Prioritize Indian traditional items in display ordering if present
  const prioritySummaryCategories = [
    'Sarees',
    'Blouses',
    'Kurtas',
    'Kurta Sets',
    'Salwar Suits',
    'Lehengas',
    'Dupattas',
    'Tops',
    'Bottoms',
    'Dresses',
    'Footwear',
    'Accessories',
  ];

  const presentCategories = Object.keys(categoryCounts).filter((cat) => categoryCounts[cat] > 0);
  // Sort with priority categories first, then alphabetical
  presentCategories.sort((a, b) => {
    const idxA = prioritySummaryCategories.indexOf(a);
    const idxB = prioritySummaryCategories.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#E4EDFF] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4A6CF7] bg-[#EEF3FF] px-2.5 py-0.5 rounded-full border border-[#D6E2FF]">
              Personalization Engine
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#20243A]">
            User Profile & AI Style Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6482] mt-1">
            Customize the personal attributes used by Gemini to curate your fashion recommendations.
          </p>
        </div>

        <button
          id="proceed-stylist-top-btn"
          onClick={() => setActiveTab('stylist')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A6CF7] text-white text-xs font-semibold hover:bg-[#3B5BD8] transition-all shrink-0"
        >
          <span>Go to AI Stylist</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-sm">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Profile and style preferences saved successfully! Gemini will now use these inputs.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {errorMsg}
        </div>
      )}

      {/* DYNAMIC WARDROBE SUMMARY CARD */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E4EDFF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4EDFF] pb-3">
          <div className="flex items-center gap-2 text-[#20243A]">
            <Layers className="w-5 h-5 text-[#4A6CF7]" />
            <h2 className="font-display text-lg font-bold">My Wardrobe Summary</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#EEF3FF] text-[#4A6CF7] font-medium">
              Live Data
            </span>
          </div>

          <button
            id="manage-wardrobe-summary-link"
            type="button"
            onClick={() => setActiveTab('wardrobe')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A6CF7] hover:text-[#3B5BD8] transition-colors"
          >
            <span>Manage Virtual Wardrobe</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#FAFBFF] border border-[#D6E2FF] text-center shadow-xs">
            <div className="text-xs text-[#5E6482] font-medium">Total Items</div>
            <div className="text-xl font-bold text-[#20243A] font-display">{totalWardrobeItems}</div>
          </div>

          <p className="text-xs text-[#5E6482] leading-relaxed">
            Calculated dynamically from your actual wardrobe items. When you add or remove garments (like sarees or blouses),
            these counts reflect immediately.
          </p>
        </div>

        {presentCategories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
            {presentCategories.map((cat) => {
              const count = categoryCounts[cat];
              const isTraditionalCategory = [
                'Sarees',
                'Blouses',
                'Kurtas',
                'Kurta Sets',
                'Salwar Suits',
                'Lehengas',
                'Dupattas',
              ].includes(cat);

              return (
                <div
                  key={cat}
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    isTraditionalCategory
                      ? 'bg-[#FFF0F5] border-[#FAD0DF] text-[#20243A]'
                      : 'bg-white border-[#E4EDFF] text-[#20243A]'
                  }`}
                >
                  <span className="text-xs font-medium text-[#5E6482] truncate">{cat}</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold font-display">{count}</span>
                    {isTraditionalCategory && (
                      <span className="text-[10px] font-semibold text-[#E98BAF] uppercase tracking-wider">
                        Ethnic
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white border border-dashed border-[#D6E2FF] text-[#5E6482] text-xs text-center">
            No clothing items uploaded to your wardrobe yet. Head to the{' '}
            <button
              type="button"
              onClick={() => setActiveTab('wardrobe')}
              className="text-[#4A6CF7] underline font-semibold"
            >
              Virtual Wardrobe
            </button>{' '}
            tab to add your sarees, blouses, and everyday garments!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information & Gender Profile */}
        <div className="bg-white rounded-2xl p-6 border border-[#E4EDFF] shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-[#20243A] font-display text-lg font-bold">
            <Sliders className="w-5 h-5 text-[#4A6CF7]" />
            <h2>Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="user-name-input" className="block text-xs font-semibold text-[#20243A] mb-1.5">
                Full Name *
              </label>
              <input
                id="user-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aanya Sharma"
                className="w-full px-4 py-2.5 rounded-xl border border-[#D6E2FF] text-sm focus:outline-none focus:ring-2 focus:ring-[#4A6CF7] bg-[#FAFBFF]"
                required
              />
            </div>

            <div>
              <label htmlFor="budget-select" className="block text-xs font-semibold text-[#20243A] mb-1.5">
                Approximate Budget Range
              </label>
              <div className="relative">
                <select
                  id="budget-select"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D6E2FF] text-sm focus:outline-none focus:ring-2 focus:ring-[#4A6CF7] bg-[#FAFBFF] appearance-none"
                >
                  {BUDGET_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <DollarSign className="w-4 h-4 text-[#5E6482] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* GENDER / FASHION PROFILE (OPTIONAL) */}
          <div className="pt-2 border-t border-[#E4EDFF] space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#20243A]">
                <User className="w-3.5 h-3.5 text-[#5E6482]" />
                <span>Gender / Fashion Profile</span>
                <span className="text-[#5E6482] font-normal">(Optional)</span>
              </label>
              {genderProfile && (
                <button
                  type="button"
                  onClick={() => setGenderProfile('')}
                  className="text-[11px] text-[#5E6482] hover:text-[#20243A] underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {GENDER_OPTIONS.map((opt) => {
                const isSelected = genderProfile === opt;
                return (
                  <button
                    key={opt}
                    id={`gender-btn-${opt.toLowerCase().replace(/[\s\/]+/g, '-')}`}
                    type="button"
                    onClick={() => setGenderProfile(isSelected ? '' : opt)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#4A6CF7] text-white border-[#4A6CF7] shadow-sm font-semibold'
                        : 'bg-[#FAFBFF] hover:bg-[#EEF3FF] border-[#D6E2FF] text-[#20243A]'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#5E6482]">
              Optional. Passed to Gemini solely to tailor silhouette drape and fit recommendations, without making assumptions about body or personality.
            </p>
          </div>
        </div>

        {/* Section 2: AI Style Preferences (Multi-Select) */}
        <div className="bg-white rounded-2xl p-6 border border-[#E4EDFF] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#20243A] font-display text-lg font-bold">
              <Sparkles className="w-5 h-5 text-[#E98BAF]" />
              <h2>AI Style Preferences</h2>
            </div>
            <span className="text-xs text-[#5E6482]">Select all styles that fit you</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {STYLE_OPTIONS.map((style) => {
              const isSelected = selectedStyles.includes(style.id);
              const isTraditional = style.id === 'Traditional';

              return (
                <button
                  key={style.id}
                  id={`style-btn-${style.id.toLowerCase()}`}
                  type="button"
                  onClick={() => setSelectedStyles(toggleArrayItem(selectedStyles, style.id))}
                  className={`p-4 rounded-xl text-left border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? isTraditional
                        ? 'bg-[#FFF0F5] text-[#20243A] border-[#FAD0DF] shadow-xs'
                        : 'bg-[#4A6CF7] text-white border-[#4A6CF7] shadow-xs'
                      : 'bg-[#FAFBFF] hover:bg-[#EEF3FF] border-[#D6E2FF] text-[#20243A]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm flex items-center gap-1.5">
                      {style.label}
                      {isTraditional && <span className="text-[10px] text-[#E98BAF]">✨</span>}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        isSelected
                          ? isTraditional
                            ? 'bg-[#E98BAF] border-[#E98BAF] text-white'
                            : 'bg-white border-white text-[#4A6CF7]'
                          : 'border-[#D6E2FF]'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p
                    className={`text-[11px] leading-snug ${
                      isSelected
                        ? isTraditional
                          ? 'text-[#5E6482]'
                          : 'text-white/90'
                        : 'text-[#5E6482]'
                    }`}
                  >
                    {style.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {isTraditionalActive && (
            <div className="p-3 rounded-xl bg-[#FFF0F5] border border-[#FAD0DF] text-[#20243A] text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🥻</span>
                <span>
                  <strong>Traditional / Indian Wear Active:</strong> Indian ethnic garments (Sarees, Blouses, Kurtas, etc.) and accessories are highlighted below in Preferred Clothing.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSelectAllTraditional}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-[#E98BAF] hover:bg-[#DE7A9F] text-white font-semibold text-[11px] transition-colors"
              >
                Select Traditional Items
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Preferred Clothing (Grouped Multi-Select) */}
        <div className="bg-white rounded-2xl p-6 border border-[#E4EDFF] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#20243A] font-display text-lg font-bold">
              <Shirt className="w-5 h-5 text-[#4A6CF7]" />
              <h2>Preferred Clothing Categories</h2>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedClothing([])}
                className="text-[#5E6482] hover:text-[#20243A] underline"
              >
                Clear all
              </button>
              {isTraditionalActive && (
                <button
                  type="button"
                  onClick={handleClearTraditional}
                  className="text-[#E98BAF] hover:text-[#C25480] underline font-medium"
                >
                  Clear Traditional
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-[#5E6482]">
            Select the specific clothing categories you wear. Gemini prioritizes these when creating daily and occasion outfits.
          </p>

          <div className="space-y-5">
            {CLOTHING_GROUPS.map((group) => {
              const isTraditionalGroup = group.isTraditional;
              const isHighlighted = isTraditionalGroup && isTraditionalActive;

              return (
                <div
                  key={group.title}
                  className={`p-4 rounded-xl border transition-all ${
                    isHighlighted
                      ? 'bg-[#FFF0F5]/50 border-[#FAD0DF] ring-1 ring-[#E98BAF]/40'
                      : 'bg-[#FAFBFF] border-[#E4EDFF]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#20243A] flex items-center gap-1.5">
                      {isTraditionalGroup && <span className="text-[#E98BAF]">🪡</span>}
                      <span>{group.title}</span>
                      {isHighlighted && (
                        <span className="text-[10px] font-semibold text-[#C25480] bg-[#FFF0F5] px-2 py-0.5 rounded-full border border-[#FAD0DF]">
                          Traditional Focus
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] text-[#5E6482]">
                      {group.items.filter((i) => selectedClothing.includes(i)).length} of {group.items.length} selected
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => {
                      const isSelected = selectedClothing.includes(item);
                      const isItemTraditional = TRADITIONAL_CLOTHING_ITEMS.includes(item);

                      return (
                        <button
                          key={item}
                          id={`pref-clothing-${item.toLowerCase().replace(/[\s\/]+/g, '-')}`}
                          type="button"
                          onClick={() => setSelectedClothing(toggleArrayItem(selectedClothing, item))}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? isItemTraditional
                                ? 'bg-[#FFF0F5] border-[#E98BAF] text-[#C25480] font-bold shadow-2xs'
                                : 'bg-[#4A6CF7] border-[#4A6CF7] text-white font-semibold shadow-2xs'
                              : isHighlighted && isItemTraditional
                              ? 'bg-white hover:bg-[#FFF0F5] border-[#FAD0DF] text-[#C25480] font-medium'
                              : 'bg-white hover:bg-[#EEF3FF] border-[#D6E2FF] text-[#20243A]'
                          }`}
                        >
                          <span>{item}</span>
                          {isSelected ? (
                            <Check className={`w-3 h-3 ${isItemTraditional ? 'text-[#C25480]' : 'text-white'}`} />
                          ) : (
                            isHighlighted &&
                            isItemTraditional && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E98BAF]"></span>
                            )
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Favorite Color Palette */}
        <div className="bg-white rounded-2xl p-6 border border-[#E4EDFF] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#20243A] font-display text-lg font-bold">
              <Palette className="w-5 h-5 text-[#4A6CF7]" />
              <h2>Favorite Colors</h2>
            </div>
            <span className="text-xs text-[#5E6482]">Gemini prioritizes these color pairings</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {COLOR_PALETTE.map((c) => {
              const isSelected = selectedColors.includes(c.name);
              return (
                <button
                  key={c.name}
                  id={`color-btn-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                  type="button"
                  onClick={() => setSelectedColors(toggleArrayItem(selectedColors, c.name))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#20243A] text-white border-[#20243A] shadow-xs'
                      : 'bg-[#FAFBFF] hover:bg-[#EEF3FF] border-[#D6E2FF] text-[#20243A]'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full ${c.border ? 'border border-[#D6E2FF]' : ''}`}
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-[#E98BAF]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 5: Preferred Occasions (Multi-Select) */}
        <div className="bg-white rounded-2xl p-6 border border-[#E4EDFF] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#20243A] font-display text-lg font-bold">
              <Calendar className="w-5 h-5 text-[#4A6CF7]" />
              <h2>Preferred Occasions</h2>
            </div>
            <span className="text-xs text-[#5E6482]">Where you need styling most</span>
          </div>

          <p className="text-xs text-[#5E6482]">
            Select the events and moments you dress up for, including Indian cultural ceremonies and everyday activities.
          </p>

          <div className="flex flex-wrap gap-2">
            {OCCASION_OPTIONS.map((occ) => {
              const isSelected = selectedOccasions.includes(occ);
              const isTraditionalOccasion = [
                'Wedding',
                'Reception',
                'Festival',
                'Durga Puja',
                'Diwali',
                'Puja',
                'Family Function',
                'Traditional Ceremony',
              ].includes(occ);

              return (
                <button
                  key={occ}
                  id={`occ-btn-${occ.toLowerCase().replace(/[\s\/]+/g, '-')}`}
                  type="button"
                  onClick={() => setSelectedOccasions(toggleArrayItem(selectedOccasions, occ))}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? isTraditionalOccasion
                        ? 'bg-[#FFF0F5] border-[#E98BAF] text-[#C25480] font-bold'
                        : 'bg-[#4A6CF7] text-white border-[#4A6CF7] font-semibold'
                      : isTraditionalOccasion
                      ? 'bg-[#FFF0F5]/50 hover:bg-[#FFF0F5] border-[#FAD0DF] text-[#C25480]'
                      : 'bg-[#FAFBFF] hover:bg-[#EEF3FF] border-[#D6E2FF] text-[#20243A]'
                  }`}
                >
                  <span>{occ}</span>
                  {isSelected && (
                    <Check className={`w-3 h-3 ${isTraditionalOccasion ? 'text-[#C25480]' : 'text-white'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#5E6482]">
            * Changes are immediately stored in the database and injected into Gemini prompts.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="save-profile-btn"
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#4A6CF7] text-white text-sm font-semibold hover:bg-[#3B5BD8] transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <span>Saving Profile...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Save Profile & Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
