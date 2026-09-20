import React, { useState } from 'react';
import { WardrobeCategory, WardrobeItem } from '../types.js';
import { X, Plus, Image as ImageIcon } from 'lucide-react';

interface AddWardrobeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: WardrobeItem) => void;
  userId: string;
}

const CATEGORIES: WardrobeCategory[] = [
  'Shirts',
  'T-shirts',
  'Trousers',
  'Jeans',
  'Dresses',
  'Jackets',
  'Shoes',
  'Accessories',
];

const STYLES = ['Casual', 'Formal', 'Streetwear', 'Traditional', 'Party', 'College', 'Minimal', 'Sporty'];

const PRESET_IMAGES = [
  { label: 'White Tee', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60' },
  { label: 'Linen Shirt', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60' },
  { label: 'Blue Jeans', url: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=500&auto=format&fit=crop&q=60' },
  { label: 'Olive Chinos', url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=60' },
  { label: 'Sneakers', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60' },
  { label: 'Denim Jacket', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=60' },
];

export const AddWardrobeItemModal: React.FC<AddWardrobeItemModalProps> = ({
  isOpen,
  onClose,
  onItemAdded,
  userId,
}) => {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<WardrobeCategory>('Shirts');
  const [color, setColor] = useState('Navy Blue');
  const [style, setStyle] = useState('Casual');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setErrorMsg('Please enter an item name.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      // Call API
      const res = await fetch('/api/wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: itemName.trim(),
          category,
          color: color.trim(),
          style,
          image: imageUrl.trim() || undefined,
          userId,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save item');

      onItemAdded(data.item);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add wardrobe item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 overflow-hidden relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#E4EDFF]">
          <div>
            <h2 className="font-display text-xl font-bold text-[#20243A]">
              Add Clothing to Wardrobe
            </h2>
            <p className="text-xs text-[#5E6482] mt-0.5">
              Items added here are directly available for VastraAI to mix & match.
            </p>
          </div>
          <button
            id="close-wardrobe-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EEF3FF] text-[#5E6482] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Item Name */}
          <div>
            <label htmlFor="item-name-input" className="block text-xs font-semibold text-[#20243A] mb-1">
              Garment / Item Name *
            </label>
            <input
              id="item-name-input"
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Classic Blue Oxford Shirt"
              className="w-full px-3.5 py-2 rounded-xl border border-[#D6E2FF] text-sm focus:outline-none focus:ring-2 focus:ring-[#4A6CF7] bg-[#FAFBFF]"
              required
            />
          </div>

          {/* Category & Style */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="category-select" className="block text-xs font-semibold text-[#20243A] mb-1">
                Category *
              </label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as WardrobeCategory)}
                className="w-full px-3 py-2 rounded-xl border border-[#D6E2FF] text-sm focus:outline-none focus:ring-2 focus:ring-[#4A6CF7] bg-[#FAFBFF]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="style-select" className="block text-xs font-semibold text-[#20243A] mb-1">
                Style Tag
              </label>
              <select
                id="style-select"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D6E2FF] text-sm focus:outline-none focus:ring-2 focus:ring-[#4A6CF7] bg-[#FAFBFF]"
              >
                {STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color */}
          <div>
            <label htmlFor="color-input" className="block text-xs font-semibold text-[#20243A] mb-1">
              Color
            </label>
            <input
              id="color-input"
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Navy Blue, Off-White, Pastel Pink"
              className="w-full px-3.5 py-2 rounded-xl border border-[#D6E2FF] text-sm focus:outline-none focus:ring-2 focus:ring-[#4A6CF7] bg-[#FAFBFF]"
            />
          </div>

          {/* Image Presets & URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="image-url-input" className="block text-xs font-semibold text-[#20243A]">
                Garment Image (Optional URL or 1-Click Preset)
              </label>
            </div>

            {/* Quick preset selector for convenience */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  id={`preset-img-btn-${idx}`}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`p-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all text-left ${
                    imageUrl === preset.url
                      ? 'bg-[#4A6CF7] text-white border-[#4A6CF7]'
                      : 'bg-[#FAFBFF] hover:bg-[#EEF3FF] border-[#D6E2FF] text-[#20243A]'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-5 h-5 rounded-md object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="truncate">{preset.label}</span>
                </button>
              ))}
            </div>

            <div className="relative mt-2">
              <input
                id="image-url-input"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste any custom image URL (https://...)"
                className="w-full px-3.5 py-2 pl-9 rounded-xl border border-[#D6E2FF] text-xs focus:outline-none focus:ring-2 focus:ring-[#4A6CF7] bg-[#FAFBFF]"
              />
              <ImageIcon className="w-4 h-4 text-[#5E6482] absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              id="cancel-add-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#5E6482] hover:bg-[#EEF3FF] transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-add-wardrobe-btn"
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#4A6CF7] text-white text-xs font-semibold hover:bg-[#3B5BD8] disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Adding...' : 'Add to Wardrobe'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
