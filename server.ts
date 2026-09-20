import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, DEFAULT_USER_ID } from './server/db.js';
import {
  generatePersonalizedRecommendation,
  chatWithAIStylist,
  generateOutfitFromWardrobe,
} from './server/gemini.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================
// 1. HEALTH & STATUS ENDPOINT
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 2. USER PROFILE ENDPOINTS
// ==========================================
app.get('/api/profile', (req, res) => {
  try {
    const userId = (req.query.userId as string) || DEFAULT_USER_ID;
    const profile = db.getUser(userId);
    res.json({ success: true, profile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/profile', (req, res) => {
  try {
    const updated = db.updateUser(req.body);
    res.json({ success: true, profile: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. VIRTUAL WARDROBE ENDPOINTS
// ==========================================
app.get('/api/wardrobe', (req, res) => {
  try {
    const userId = (req.query.userId as string) || DEFAULT_USER_ID;
    const items = db.getWardrobe(userId);
    res.json({ success: true, items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/wardrobe', (req, res) => {
  try {
    const {
      itemName,
      category,
      color,
      style,
      image,
      userId,
      fabric,
      sareeType,
      occasion,
      sleeveStyle,
      neckStyle,
      notes,
    } = req.body;

    if (!itemName || !category) {
      return res.status(400).json({ success: false, error: 'Item name and category are required.' });
    }

    const newItem = db.addWardrobeItem({
      userId: userId || DEFAULT_USER_ID,
      itemName,
      category,
      color: color || 'Neutral',
      style: style || 'Casual',
      image: image || '',
      fabric,
      sareeType,
      occasion,
      sleeveStyle,
      neckStyle,
      notes,
    });
    res.status(201).json({ success: true, item: newItem });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/wardrobe/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.query.userId as string) || DEFAULT_USER_ID;
    const success = db.deleteWardrobeItem(id, userId);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. SAVED OUTFITS ENDPOINTS
// ==========================================
app.get('/api/saved-outfits', (req, res) => {
  try {
    const userId = (req.query.userId as string) || DEFAULT_USER_ID;
    const saved = db.getSavedOutfits(userId);
    res.json({ success: true, savedOutfits: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/saved-outfits', (req, res) => {
  try {
    const { outfit, notes, userId } = req.body;
    if (!outfit || !outfit.top || !outfit.bottom) {
      return res.status(400).json({ success: false, error: 'Invalid outfit payload.' });
    }
    const saved = db.saveOutfit({
      userId: userId || DEFAULT_USER_ID,
      outfit,
      notes: notes || '',
    });
    res.status(201).json({ success: true, savedOutfit: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/saved-outfits/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.query.userId as string) || DEFAULT_USER_ID;
    const success = db.deleteSavedOutfit(id, userId);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. FEEDBACK ENDPOINTS (LIKE / DISLIKE)
// ==========================================
app.get('/api/feedback', (req, res) => {
  try {
    const userId = (req.query.userId as string) || DEFAULT_USER_ID;
    const feedback = db.getFeedback(userId);
    res.json({ success: true, feedback });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/feedback', (req, res) => {
  try {
    const { outfitId, outfitTitle, feedback, userId } = req.body;
    if (!outfitId || !feedback) {
      return res.status(400).json({ success: false, error: 'OutfitId and feedback (like/dislike) required.' });
    }
    const record = db.addFeedback({
      userId: userId || DEFAULT_USER_ID,
      outfitId,
      outfitTitle: outfitTitle || 'Recommended Outfit',
      feedback,
    });
    res.json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. AI RECOMMENDATIONS & CHAT ENDPOINTS
// ==========================================

// Personalized outfit recommendation
app.post('/api/ai/recommend', async (req, res) => {
  try {
    const userId = (req.body.userId as string) || DEFAULT_USER_ID;
    const occasion = req.body.occasion as string | undefined;

    const profile = db.getUser(userId);
    const feedbackList = db.getFeedback(userId);
    const wardrobe = db.getWardrobe(userId);

    const recommendation = await generatePersonalizedRecommendation(profile, feedbackList, occasion, wardrobe);
    res.json({ success: true, recommendation });
  } catch (err: any) {
    console.error('API /api/ai/recommend error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to generate recommendation.' });
  }
});

// Interactive AI Stylist chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, userId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    const uId = userId || DEFAULT_USER_ID;
    const profile = db.getUser(uId);
    const wardrobe = db.getWardrobe(uId);
    const feedbackList = db.getFeedback(uId);

    const result = await chatWithAIStylist(
      message,
      Array.isArray(history) ? history : [],
      profile,
      wardrobe,
      feedbackList
    );

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('API /api/ai/chat error:', err);
    res.status(500).json({ success: false, error: err.message || 'Stylist chat encountered an error.' });
  }
});

// Wardrobe outfit generation ("Create Outfit From My Wardrobe")
app.post('/api/ai/wardrobe-outfit', async (req, res) => {
  try {
    const userId = (req.body.userId as string) || DEFAULT_USER_ID;
    const occasion = req.body.occasion as string | undefined;

    const profile = db.getUser(userId);
    const wardrobe = db.getWardrobe(userId);
    const feedbackList = db.getFeedback(userId);

    const outfit = await generateOutfitFromWardrobe(profile, wardrobe, feedbackList, occasion);
    res.json({ success: true, outfit });
  } catch (err: any) {
    console.error('API /api/ai/wardrobe-outfit error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to assemble outfit from wardrobe.' });
  }
});

// ==========================================
// 7. VITE SERVING & DEV MIDDLEWARE
// ==========================================
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fashion Platform server listening on port ${PORT}`);
  });
}

start();
