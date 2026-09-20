import fs from 'fs';
import path from 'path';
import { UserProfile, WardrobeItem, SavedOutfit, FeedbackRecord } from '../src/types.js';

interface DatabaseSchema {
  users: Record<string, UserProfile>;
  wardrobe: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  feedback: FeedbackRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'fashion_db.json');

// Default initial user for student project demo
const DEFAULT_USER_ID = 'user_student_1';

const INITIAL_PROFILE: UserProfile = {
  id: DEFAULT_USER_ID,
  name: 'Aanya Sharma',
  genderProfile: 'Female',
  preferredStyles: ['Traditional', 'Casual', 'College', 'Minimal'],
  favoriteColors: ['Crimson Red', 'Royal Blue', 'Gold', 'Beige', 'Black', 'Emerald Green'],
  preferredCategories: [
    'Sarees',
    'Blouses',
    'Kurtas',
    'Palazzo Pants',
    'Dupattas',
    'T-shirts',
    'Jeans',
    'Indian Jewellery',
    'Ethnic Footwear',
  ],
  preferredClothing: [
    'Sarees',
    'Blouses',
    'Kurtas',
    'Palazzo Pants',
    'Dupattas',
    'T-shirts',
    'Jeans',
    'Indian Jewellery',
    'Ethnic Footwear',
  ],
  budget: '₹1,500 - ₹3,500',
  preferredOccasions: ['Durga Puja', 'Wedding', 'Festival', 'College Fest', 'Casual Traditional', 'Party'],
  updatedAt: new Date().toISOString(),
};

// Initial realistic wardrobe items to demonstrate "Create Outfit From My Wardrobe" immediately with both Western and Indian Traditional
const INITIAL_WARDROBE: WardrobeItem[] = [
  // Dedicated Sarees & Blouses
  {
    id: 'w_saree_1',
    userId: DEFAULT_USER_ID,
    itemName: 'Crimson Red Banarasi Katan Silk Saree',
    category: 'Sarees',
    color: 'Crimson Red',
    style: 'Traditional',
    fabric: 'Banarasi Katan Silk',
    sareeType: 'Banarasi Handloom',
    occasion: 'Wedding / Durga Puja',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_blouse_1',
    userId: DEFAULT_USER_ID,
    itemName: 'Antique Gold Zari Embroidered Blouse',
    category: 'Blouses',
    color: 'Antique Gold',
    style: 'Embroidered',
    sleeveStyle: 'Elbow-length',
    neckStyle: 'Sweetheart Neck',
    occasion: 'Wedding / Festive',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_saree_2',
    userId: DEFAULT_USER_ID,
    itemName: 'Pastel Pink Chanderi Silk Saree',
    category: 'Sarees',
    color: 'Pastel Pink',
    style: 'Traditional',
    fabric: 'Chanderi Silk Cotton',
    sareeType: 'Chanderi Handloom',
    occasion: 'Puja / College Fest',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_blouse_2',
    userId: DEFAULT_USER_ID,
    itemName: 'Emerald Green Brocade Blouse',
    category: 'Blouses',
    color: 'Emerald Green',
    style: 'Brocade',
    sleeveStyle: 'Cap Sleeves',
    neckStyle: 'Boat Neck',
    occasion: 'Festival / Party',
    image: 'https://images.unsplash.com/photo-1605705656874-42b7e2895696?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },

  // Indian Traditional Garments & Accessories
  {
    id: 'w_kurta_1',
    userId: DEFAULT_USER_ID,
    itemName: 'Mustard Yellow Embroidered Chanderi Kurta',
    category: 'Kurtas',
    color: 'Mustard Yellow',
    style: 'Traditional',
    occasion: 'Festival / Puja',
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_palazzo_1',
    userId: DEFAULT_USER_ID,
    itemName: 'Ivory Flared Silk Palazzo Pants',
    category: 'Palazzo Pants',
    color: 'Ivory White',
    style: 'Traditional',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_dupatta_1',
    userId: DEFAULT_USER_ID,
    itemName: 'Maroon Phulkari Embroidered Silk Dupatta',
    category: 'Dupattas',
    color: 'Maroon',
    style: 'Traditional',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_jewel_1',
    userId: DEFAULT_USER_ID,
    itemName: 'Handcrafted Kundan Pearl Jhumkas',
    category: 'Indian Jewellery',
    color: 'Gold & Pearl',
    style: 'Traditional',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_shoe_eth_1',
    userId: DEFAULT_USER_ID,
    itemName: 'Embellished Zari Mojari Juttis',
    category: 'Ethnic Footwear',
    color: 'Champagne Gold',
    style: 'Traditional',
    image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },

  // Western / Everyday Garments
  {
    id: 'w_1',
    userId: DEFAULT_USER_ID,
    itemName: 'Relaxed Beige Linen Shirt',
    category: 'Shirts',
    color: 'Beige',
    style: 'Minimal',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_2',
    userId: DEFAULT_USER_ID,
    itemName: 'Classic Black Oversized T-Shirt',
    category: 'T-shirts',
    color: 'Black',
    style: 'Streetwear',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_3',
    userId: DEFAULT_USER_ID,
    itemName: 'Light Wash Straight-Fit Jeans',
    category: 'Jeans',
    color: 'Light Blue',
    style: 'Casual',
    image: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_4',
    userId: DEFAULT_USER_ID,
    itemName: 'Olive Green Pleated Chino Trousers',
    category: 'Trousers',
    color: 'Olive Green',
    style: 'Casual',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_5',
    userId: DEFAULT_USER_ID,
    itemName: 'Minimalist White Leather Sneakers',
    category: 'Shoes',
    color: 'White',
    style: 'Minimal',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_7',
    userId: DEFAULT_USER_ID,
    itemName: 'Canvas Messenger Tote Bag',
    category: 'Accessories',
    color: 'Off-White',
    style: 'College',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_SAVED_OUTFITS: SavedOutfit[] = [
  {
    id: 'saved_trad_1',
    userId: DEFAULT_USER_ID,
    savedAt: new Date(Date.now() - 43200000).toISOString(),
    notes: 'Saved for Durga Puja Ashtami celebration & Bengali wedding',
    outfit: {
      id: 'rec_init_trad',
      title: 'Royal Banarasi & Gold Embroidered Saree Ensemble',
      top: 'Antique Gold Zari Embroidered Blouse (Sweetheart Neck, Elbow Sleeves)',
      bottom: 'Crimson Red Banarasi Katan Silk Saree with golden zari drape',
      footwear: 'Embellished Zari Mojari Juttis',
      accessories: 'Handcrafted Kundan Pearl Jhumkas & Bangles',
      suggestedColors: ['Crimson Red', 'Antique Gold', 'Emerald accents'],
      occasion: 'Durga Puja / Wedding',
      approximateBudget: '₹0 (Wardrobe Owned)',
      explanation:
        'A timeless traditional pairing uniting the rich crimson Banarasi silk drape with an antique gold embroidered blouse, elevated by handcrafted kundan jhumkas for festive grandeur.',
      source: 'wardrobe',
      wardrobeItemNames: [
        'Crimson Red Banarasi Katan Silk Saree',
        'Antique Gold Zari Embroidered Blouse',
        'Handcrafted Kundan Pearl Jhumkas',
        'Embellished Zari Mojari Juttis',
      ],
      createdAt: new Date(Date.now() - 43200000).toISOString(),
    },
  },
  {
    id: 'saved_1',
    userId: DEFAULT_USER_ID,
    savedAt: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Perfect for college presentation day',
    outfit: {
      id: 'rec_init_1',
      title: 'Smart Campus Casual Ensemble',
      top: 'Relaxed Beige Linen Shirt with rolled sleeves',
      bottom: 'Olive Green Pleated Chino Trousers',
      footwear: 'Minimalist White Leather Sneakers',
      accessories: 'Canvas Messenger Tote Bag & Matte Metal Watch',
      suggestedColors: ['Beige', 'Olive Green', 'White', 'Earth tones'],
      occasion: 'College & Seminars',
      approximateBudget: '₹2,200 (Wardrobe Owned)',
      explanation:
        'The earth-toned balance of warm beige and muted olive creates an effortless academic aesthetic, while crisp white sneakers keep it active and modern.',
      source: 'wardrobe',
      wardrobeItemNames: [
        'Relaxed Beige Linen Shirt',
        'Olive Green Pleated Chino Trousers',
        'Minimalist White Leather Sneakers',
        'Canvas Messenger Tote Bag',
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.readFromDisk();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private readFromDisk(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure traditional wardrobe items and gender profile exist if upgraded
        const hasSaree = parsed.wardrobe?.some((item: any) => item.category === 'Sarees');
        if (!hasSaree && Array.isArray(parsed.wardrobe)) {
          const tradItems = INITIAL_WARDROBE.filter(
            (i) =>
              i.category === 'Sarees' ||
              i.category === 'Blouses' ||
              i.category === 'Kurtas' ||
              i.category === 'Palazzo Pants' ||
              i.category === 'Dupattas' ||
              i.category === 'Indian Jewellery' ||
              i.category === 'Ethnic Footwear'
          );
          parsed.wardrobe = [...tradItems, ...parsed.wardrobe];
          if (parsed.users?.[DEFAULT_USER_ID] && !parsed.users[DEFAULT_USER_ID].genderProfile) {
            parsed.users[DEFAULT_USER_ID].genderProfile = 'Female';
          }
          // Also add traditional saved outfit if not present
          if (parsed.savedOutfits && !parsed.savedOutfits.some((s: any) => s.id === 'saved_trad_1')) {
            parsed.savedOutfits.unshift(INITIAL_SAVED_OUTFITS[0]);
          }
          this.writeToDisk(parsed);
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error reading database file, resetting to initial seed:', err);
    }

    const initial: DatabaseSchema = {
      users: {
        [DEFAULT_USER_ID]: INITIAL_PROFILE,
      },
      wardrobe: INITIAL_WARDROBE,
      savedOutfits: INITIAL_SAVED_OUTFITS,
      feedback: [
        {
          id: 'fb_1',
          userId: DEFAULT_USER_ID,
          outfitId: 'rec_init_1',
          outfitTitle: 'Smart Campus Casual Ensemble',
          feedback: 'like',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
    };
    this.writeToDisk(initial);
    return initial;
  }

  private writeToDisk(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to database:', err);
    }
  }

  // Users Collection
  getUser(userId: string = DEFAULT_USER_ID): UserProfile {
    if (!this.data.users[userId]) {
      this.data.users[userId] = {
        ...INITIAL_PROFILE,
        id: userId,
      };
      this.writeToDisk(this.data);
    }
    const user = this.data.users[userId];
    if (!user.preferredClothing && user.preferredCategories) {
      user.preferredClothing = [...user.preferredCategories];
    }
    if (!user.preferredCategories && user.preferredClothing) {
      user.preferredCategories = [...user.preferredClothing];
    }
    return user;
  }

  updateUser(profile: Partial<UserProfile> & { id?: string }): UserProfile {
    const userId = profile.id || DEFAULT_USER_ID;
    const existing = this.getUser(userId);
    const preferredClothing =
      profile.preferredClothing || profile.preferredCategories || existing.preferredClothing || existing.preferredCategories || [];
    const preferredCategories =
      profile.preferredCategories || profile.preferredClothing || existing.preferredCategories || existing.preferredClothing || [];
    const updated: UserProfile = {
      ...existing,
      ...profile,
      preferredClothing,
      preferredCategories,
      id: userId,
      updatedAt: new Date().toISOString(),
    };
    this.data.users[userId] = updated;
    this.writeToDisk(this.data);
    return updated;
  }

  // Wardrobe Collection
  getWardrobe(userId: string = DEFAULT_USER_ID): WardrobeItem[] {
    return this.data.wardrobe.filter((item) => item.userId === userId);
  }

  addWardrobeItem(item: Omit<WardrobeItem, 'id' | 'createdAt'> & { id?: string }): WardrobeItem {
    const newItem: WardrobeItem = {
      id: item.id || `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: item.userId || DEFAULT_USER_ID,
      itemName: item.itemName,
      category: item.category,
      color: item.color,
      style: item.style,
      image: item.image,
      fabric: item.fabric,
      sareeType: item.sareeType,
      occasion: item.occasion,
      sleeveStyle: item.sleeveStyle,
      neckStyle: item.neckStyle,
      notes: item.notes,
      createdAt: new Date().toISOString(),
    };
    this.data.wardrobe.unshift(newItem);
    this.writeToDisk(this.data);
    return newItem;
  }

  deleteWardrobeItem(itemId: string, userId: string = DEFAULT_USER_ID): boolean {
    const initialLen = this.data.wardrobe.length;
    this.data.wardrobe = this.data.wardrobe.filter(
      (item) => !(item.id === itemId && item.userId === userId)
    );
    const deleted = this.data.wardrobe.length < initialLen;
    if (deleted) {
      this.writeToDisk(this.data);
    }
    return deleted;
  }

  // Saved Outfits Collection
  getSavedOutfits(userId: string = DEFAULT_USER_ID): SavedOutfit[] {
    return this.data.savedOutfits.filter((item) => item.userId === userId);
  }

  saveOutfit(outfitData: Omit<SavedOutfit, 'id' | 'savedAt'>): SavedOutfit {
    const newSaved: SavedOutfit = {
      id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: outfitData.userId || DEFAULT_USER_ID,
      outfit: outfitData.outfit,
      savedAt: new Date().toISOString(),
      notes: outfitData.notes,
    };
    this.data.savedOutfits.unshift(newSaved);
    this.writeToDisk(this.data);
    return newSaved;
  }

  deleteSavedOutfit(savedId: string, userId: string = DEFAULT_USER_ID): boolean {
    const initialLen = this.data.savedOutfits.length;
    this.data.savedOutfits = this.data.savedOutfits.filter(
      (item) => !(item.id === savedId && item.userId === userId)
    );
    const deleted = this.data.savedOutfits.length < initialLen;
    if (deleted) {
      this.writeToDisk(this.data);
    }
    return deleted;
  }

  // Feedback Collection
  getFeedback(userId: string = DEFAULT_USER_ID): FeedbackRecord[] {
    return this.data.feedback.filter((fb) => fb.userId === userId);
  }

  addFeedback(
    feedback: Omit<FeedbackRecord, 'id' | 'createdAt'>
  ): FeedbackRecord {
    // Check if user already gave feedback for this outfit
    const existingIndex = this.data.feedback.findIndex(
      (fb) => fb.userId === feedback.userId && fb.outfitId === feedback.outfitId
    );

    const record: FeedbackRecord = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: feedback.userId || DEFAULT_USER_ID,
      outfitId: feedback.outfitId,
      outfitTitle: feedback.outfitTitle,
      feedback: feedback.feedback,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.data.feedback[existingIndex] = record;
    } else {
      this.data.feedback.unshift(record);
    }

    this.writeToDisk(this.data);
    return record;
  }
}

export const db = new Database();
export { DEFAULT_USER_ID };
