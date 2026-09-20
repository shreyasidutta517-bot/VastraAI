import React, { useState } from 'react';
import { WardrobeItem, WardrobeCategory, OutfitRecommendation } from '../types.js';
import { deleteWardrobeItem } from '../api.js';
import { AddWardrobeItemModal } from './AddWardrobeItemModal.js';
import { WardrobeOutfitModal } from './WardrobeOutfitModal.js';
import { Plus, Trash2, Sparkles, Filter, Shirt, Search, Tag } from 'lucide-react';

interface VirtualWardrobeViewProps {
  wardrobe: WardrobeItem[];
  onWardrobeUpdated: (updated: WardrobeItem[]) => void;
  userId: string;
  onOutfitSaved: (outfit: OutfitRecommendation) => void;
  savedOutfitIds: Set<string>;
}

const CATEGORY_TABS = [
  'All',
  'Shirts',
  'T-shirts',
  'Jeans',
  'Trousers',
  'Jackets',
  'Shoes',
  'Accessories',
  'Dresses',
];

export const VirtualWardrobeView: React.FC<VirtualWardrobeViewProps> = ({
  wardrobe,
  onWardrobeUpdated,
  userId,
  onOutfitSaved,
  savedOutfitIds,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOutfitModalOpen, setIsOutfitModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredItems = wardrobe.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.style.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this garment from your wardrobe?')) return;
    try {
      setDeletingId(itemId);
      const success = await deleteWardrobeItem(itemId, userId);
      if (success) {
        onWardrobeUpdated(wardrobe.filter((item) => item.id !== itemId));
      }
    } catch (err) {
      console.error('Delete wardrobe error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleItemAdded = (newItem: WardrobeItem) => {
    onWardrobeUpdated([newItem, ...wardrobe]);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Main Call-to-Action */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4EDFF] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF3FF] border border-[#D6E2FF] text-[#4A6CF7] text-xs font-semibold mb-2">
            <Shirt className="w-3.5 h-3.5 text-[#4A6CF7]" />
            <span>Virtual Wardrobe • {wardrobe.length} Pieces</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#20243A]">
            My Digital Wardrobe
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6482] mt-1 max-w-xl">
            Keep track of your real clothes. VastraAI uses these exact garments to assemble harmonious combinations when you ask to create an outfit from your wardrobe.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="add-clothing-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-[#D6E2FF] bg-white text-[#20243A] text-xs font-semibold hover:bg-[#EEF3FF] hover:text-[#4A6CF7] transition-all flex items-center gap-2 shadow-2xs"
          >
            <Plus className="w-4 h-4 text-[#4A6CF7]" />
            <span>Add Garment</span>
          </button>

          <button
            id="create-outfit-wardrobe-btn"
            onClick={() => setIsOutfitModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#4A6CF7] text-white text-xs font-semibold hover:bg-[#3B5BD8] transition-all flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#FFF0F5]" />
            <span>Create Outfit From My Wardrobe</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((cat) => {
              const isActive = activeCategory === cat;
              const count =
                cat === 'All' ? wardrobe.length : wardrobe.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  id={`filter-cat-${cat.toLowerCase()}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#4A6CF7] text-white shadow-xs font-semibold'
                      : 'bg-white border border-[#D6E2FF] text-[#5E6482] hover:bg-[#EEF3FF] hover:text-[#4A6CF7]'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-[#3B5BD8] text-white' : 'bg-[#EEF3FF] text-[#4A6CF7]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <input
              id="wardrobe-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, color, style..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#D6E2FF] bg-white text-[#20243A] focus:outline-none focus:ring-2 focus:ring-[#4A6CF7]"
            />
            <Search className="w-3.5 h-3.5 text-[#5E6482] absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Wardrobe Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-[#D6E2FF] space-y-3">
          <Shirt className="w-10 h-10 text-[#5E6482]/50 mx-auto stroke-1" />
          <h3 className="font-display text-lg font-bold text-[#20243A]">No items found</h3>
          <p className="text-xs text-[#5E6482] max-w-sm mx-auto">
            {searchQuery
              ? `No wardrobe items matching "${searchQuery}".`
              : `Your ${activeCategory === 'All' ? 'wardrobe' : activeCategory} is currently empty.`}
          </p>
          <button
            id="empty-add-garment-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A6CF7] text-white text-xs font-semibold hover:bg-[#3B5BD8] transition-all mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Garment</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              id={`wardrobe-item-${item.id}`}
              className="bg-white rounded-2xl border border-[#E4EDFF] shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group hover:border-[#4A6CF7]/40"
            >
              {/* Garment Image Area */}
              <div className="h-44 bg-[#EEF3FF] relative overflow-hidden flex items-center justify-center">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.itemName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#5E6482]/50 space-y-1">
                    <Shirt className="w-8 h-8 stroke-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{item.category}</span>
                  </div>
                )}

                {/* Category & Style Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-xs text-[#20243A] shadow-2xs">
                    {item.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#20243A]/80 backdrop-blur-xs text-white">
                    {item.style}
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  id={`delete-item-${item.id}`}
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  title="Remove from wardrobe"
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-white/90 backdrop-blur-xs text-stone-500 hover:text-rose-600 hover:bg-white shadow-2xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Item Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-[#20243A] line-clamp-1 mb-1">
                    {item.itemName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#5E6482]">
                    <span className="inline-block w-2.5 h-2.5 rounded-full border border-[#D6E2FF] bg-[#EEF3FF]" />
                    <span>Color: {item.color}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8EDFB] mt-3 flex items-center justify-between text-[11px] text-[#5E6482]">
                  <span>Available for AI</span>
                  <span className="text-[#4A6CF7] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4A6CF7]" />
                    In Wardrobe
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddWardrobeItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={handleItemAdded}
        userId={userId}
      />

      <WardrobeOutfitModal
        isOpen={isOutfitModalOpen}
        onClose={() => setIsOutfitModalOpen(false)}
        wardrobe={wardrobe}
        userId={userId}
        onOutfitSaved={onOutfitSaved}
        savedOutfitIds={savedOutfitIds}
      />
    </div>
  );
};
