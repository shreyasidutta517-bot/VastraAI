/**
 * Gemini Generative AI Integration for Fashion Recommendations
 *
 * College Project Viva Notes:
 * 1. Utilizes Google GenAI SDK (@google/genai) with 'gemini-3.8-flash'.
 * 2. Employs prompt engineering with structured context injection (Profile + Feedback + Wardrobe).
 * 3. Uses JSON schema mode (responseMimeType: "application/json") for reliable parsing.
 * 4. Implements fallback heuristics in case of network unavailability or missing credentials.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { UserProfile, WardrobeItem, FeedbackRecord, OutfitRecommendation } from '../src/types.js';

// Lazy initialization of Gemini SDK
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Format feedback records into a human-readable guidance string for the AI prompt
 */
function summarizeFeedback(feedbackList: FeedbackRecord[]): string {
  if (!feedbackList || feedbackList.length === 0) {
    return 'No previous feedback recorded yet. Follow the general style preferences.';
  }

  const liked = feedbackList.filter((f) => f.feedback === 'like').map((f) => f.outfitTitle || 'An outfit');
  const disliked = feedbackList.filter((f) => f.feedback === 'dislike').map((f) => f.outfitTitle || 'An outfit');

  let summary = '';
  if (liked.length > 0) {
    summary += `User previously LIKED styles similar to: ${liked.slice(0, 4).join(', ')}. `;
  }
  if (disliked.length > 0) {
    summary += `User previously DISLIKED styles similar to: ${disliked.slice(0, 4).join(', ')}. Avoid these patterns.`;
  }
  return summary || 'Standard preference weighting.';
}

const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

/**
 * Execute Gemini content generation with multi-model fallback and retry.
 * Handles 503 "model is experiencing high demand" by trying alternate available models.
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: string;
    config?: any;
  }
): Promise<string> {
  let lastError: any = null;

  for (let i = 0; i < CANDIDATE_MODELS.length; i++) {
    const model = CANDIDATE_MODELS[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      const message = String(err?.message || err);
      const isTransient =
        status === 503 ||
        status === 429 ||
        message.includes('503') ||
        message.includes('high demand') ||
        message.includes('UNAVAILABLE') ||
        message.includes('RESOURCE_EXHAUSTED');

      if (isTransient) {
        console.warn(`[Gemini Resilience] Model '${model}' experienced high demand (503/transient). Trying fallback model...`);
      } else {
        console.warn(`[Gemini Resilience] Model '${model}' notice: ${message}. Trying alternate...`);
      }

      if (i < CANDIDATE_MODELS.length - 1) {
        // Brief exponential backoff before fallback attempt
        await new Promise((resolve) => setTimeout(resolve, 350 * (i + 1)));
      }
    }
  }

  throw lastError || new Error('All candidate Gemini models were temporarily unavailable.');
}

/**
 * Robust JSON extraction and parser for LLM responses
 */
function cleanAndParseJson(text: string): any {
  if (!text || typeof text !== 'string') return {};
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/\s*```/g, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return {};
  }
}

/**
 * 1. Personalized Outfit Recommendation (Daily / Occasion-based)
 */
export async function generatePersonalizedRecommendation(
  profile: UserProfile,
  feedbackList: FeedbackRecord[],
  customOccasion?: string,
  wardrobe?: WardrobeItem[]
): Promise<OutfitRecommendation> {
  const ai = getGeminiClient();
  const feedbackContext = summarizeFeedback(feedbackList);
  const targetOccasion = customOccasion || (profile.preferredOccasions?.[0] || 'College / Casual');

  const preferredClothingList = (profile.preferredClothing && profile.preferredClothing.length > 0)
    ? profile.preferredClothing
    : (profile.preferredCategories || []);
  const preferredOccasionsList = profile.preferredOccasions || [];
  const preferredStylesList = profile.preferredStyles || [];
  const favoriteColorsList = profile.favoriteColors || [];
  const userWardrobe = wardrobe || [];

  const isTraditional =
    targetOccasion.toLowerCase().includes('puja') ||
    targetOccasion.toLowerCase().includes('diwali') ||
    targetOccasion.toLowerCase().includes('wedding') ||
    targetOccasion.toLowerCase().includes('reception') ||
    targetOccasion.toLowerCase().includes('festival') ||
    targetOccasion.toLowerCase().includes('traditional') ||
    targetOccasion.toLowerCase().includes('ceremony') ||
    targetOccasion.toLowerCase().includes('durga') ||
    preferredClothingList.some((c) =>
      ['sarees', 'blouses', 'kurtas', 'kurta sets', 'salwar suits', 'lehengas', 'anarkalis'].includes(c.toLowerCase())
    ) ||
    preferredStylesList.some((s) => s.toLowerCase().includes('traditional'));

  const wardrobeItemsSummary =
    userWardrobe.length > 0
      ? `Total Owned Items: ${userWardrobe.length}
Items:
${userWardrobe
  .map(
    (w) =>
      `- [${w.category}] "${w.itemName}" (Color: ${w.color}, Style: ${w.style}${w.fabric ? `, Fabric: ${w.fabric}` : ''}${
        w.sareeType ? `, Type: ${w.sareeType}` : ''
      }${w.neckStyle ? `, Neckline: ${w.neckStyle}` : ''}${w.sleeveStyle ? `, Sleeves: ${w.sleeveStyle}` : ''}${
        w.occasion ? `, Occasion: ${w.occasion}` : ''
      }${w.notes ? `, Notes: ${w.notes}` : ''})`
  )
  .join('\n')}`
      : 'No wardrobe items uploaded yet.';

  if (!ai) {
    // Intelligent fallback if API key is not configured in local environment
    return getFallbackRecommendation(
      profile,
      targetOccasion,
      'Generated using fashion heuristic engine (Gemini API key not configured in .env)',
      userWardrobe
    );
  }

  const prompt = `
You are VastraAI's master personal fashion stylist specializing in both modern contemporary wear and authentic Indian traditional fashion.
Recommend a genuinely personalized, complete, elegant, and culturally accurate outfit tailored specifically for this user.

USER PROFILE:
- Name: ${profile.name}
- Gender / Fashion Profile: ${profile.genderProfile || 'Not specified (Versatile)'}
- Preferred Styles: ${preferredStylesList.join(', ')}
- Preferred Clothing Categories: ${preferredClothingList.join(', ')}
- Preferred Occasions: ${preferredOccasionsList.join(', ')}
- Favorite Colours: ${favoriteColorsList.join(', ')}
- Target Occasion: ${targetOccasion}
- Budget: ${profile.budget}

ACTUAL ITEMS AVAILABLE IN THE USER'S WARDROBE:
${wardrobeItemsSummary}

USER TASTE & FEEDBACK HISTORY:
${feedbackContext}

CORE PERSONALIZATION & WARDROBE PRIORITIZATION RULES:
1. WARDROBE PRIORITIZATION (CRITICAL):
- When recommending an outfit, PRIORITIZE items that the user already owns in their wardrobe whenever appropriate!
- Example: If the user owns a red Banarasi saree and a gold embroidered blouse (or matching pieces in their wardrobe list) and asks for or selects a wedding/festive outfit:
  * You MUST recognize that these items can be combined together!
  * Set the top to the owned blouse and the bottom to the owned saree drape.
  * Curate and recommend suitable jewellery (accessories), footwear, and complementary accents around them.
  * If the user already owns matching jewellery or footwear in their wardrobe (e.g., Kundan Jhumkas, Embellished Mojaris), prioritize those as well!
  * Set "usesWardrobeItems": true, and list the exact names of all owned items in "wardrobeItemNames".
- If the user owns one matching piece (e.g., a Kurta or Jeans/Shirt) suitable for the occasion, pair it with complementary pieces from their wardrobe or recommend a new piece within their budget.
- If no wardrobe items are suitable for ${targetOccasion}, design a fresh curated outfit matching their preferred styles, colors, and budget, setting "usesWardrobeItems": false and "wardrobeItemNames": [].

2. INDIAN / TRADITIONAL CLOTHING COMBINATIONS:
Support authentic Indian traditional pairings:
- Saree + Blouse:
  * Top: Complementary Blouse (specify neck design like Sweetheart, Boat Neck, V-Neck, Deep Neck, and sleeve style like Elbow-length, Sleeveless, Cap, plus fabric like Raw Silk, Brocade, Velvet).
  * Bottom: Saree (specify weave/fabric like Banarasi, Kanjeevaram, Chanderi, Georgette, Organza with drape details).
- Saree + Blouse + Jewellery + Footwear:
  * Combine Saree and Blouse with authentic Indian Jewellery (Kundan Jhumkas, Chandbalis, Chokers, Bangles, Maang Tikka) and Footwear (Embellished Mojaris, Juttis, Kolhapuri heels).
- Kurta + Bottom + Dupatta:
  * Top: Handloom / Embroidered Kurta.
  * Bottom: Flared Palazzo Pants, Churidar, or Salwar.
  * Accessories: Flowing Dupatta (e.g. Phulkari, Banarasi Zari, Chiffon, Organza) + Jhumkas/Jewellery.
  * Footwear: Handcrafted Juttis or Mojaris.
- Kurta Set:
  * Coordinated Kurta and bottom set with matching/complementary accents.
- Salwar Suit:
  * Classic Kameez paired with Salwar and Dupatta.
- Anarkali:
  * Flared Anarkali paired with Churidar, Dupatta, and statement earrings.
- Lehenga:
  * Festive Lehenga skirt paired with matching or contrasting Blouse/Choli, Dupatta, and statement jewellery.
- Traditional Accessories:
  * Kundan, Polki, Temple jewellery, Jhumkas, Chandbalis, Maang Tikka, Bangles, Potli bags.
- For Male Indian Traditional:
  * Silk/Linen Kurta with Churidar/Dhoti, Embroidered Nehru/Modi Jacket, Mojaris, and Pocket Square/Brooch.

3. WESTERN CLOTHING COMBINATIONS:
When the occasion or style is Western / Everyday / Campus / Party:
- T-shirt + Jeans or Trousers + Sneakers + Casual accessories (backpack, watch).
- Shirt + Chino Trousers + Loafers/Sneakers + Belt/Watch.
- Casual or Cocktail Dress + Flats/Heels + Clutch + Minimalist jewellery.
- Layered Jacket + Top + Bottom.

4. "WHY THIS OUTFIT?" REASONING REQUIREMENT:
Provide clear, simple reasoning in a dedicated "whyThisOutfit" object:
- styleReason: Explains how this matches their preferred style (${preferredStylesList.join(', ')}).
- occasionReason: Explains why it is suitable for the selected occasion (${targetOccasion}).
- wardrobeReason: Explicitly states whether and how it uses items from their wardrobe (e.g., "Combines your owned Crimson Red Banarasi Saree and Antique Gold Blouse" or "Recommends new pieces tailored to your collection").
- colorReason: Explains how it matches their favorite colours (${favoriteColorsList.join(', ')}).
- budgetReason: Explains how it fits their budget (${profile.budget}).
- points: 4-5 concise bullet strings formatted directly for display:
  * "Matches your preferred [Style] style"
  * "Suitable for the selected [Occasion] occasion"
  * "Uses items from your wardrobe ([Item Names])" OR "Coordinates new pieces with your collection"
  * "Matches your preferred [Colours] colours"
  * "Fits your budget ([Budget details])"

5. WHY THIS OUTFIT SUITS THE USER:
- "explanation": A friendly, natural 2-sentence styling summary explaining why this combination flatters the user and works aesthetically.
`;

  try {
    const responseText = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Outfit name' },
            top: { type: Type.STRING, description: 'Top clothing piece (or Blouse / Kurta / Shirt)' },
            bottom: { type: Type.STRING, description: 'Bottom clothing piece (or Saree drape / Palazzo / Jeans / Lehenga)' },
            clothingPieces: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of main clothing pieces comprising the outfit',
            },
            footwear: { type: Type.STRING, description: 'Specific footwear' },
            accessories: { type: Type.STRING, description: '1-2 accessories or jewellery' },
            suggestedColors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Color palette names',
            },
            occasion: { type: Type.STRING, description: 'Matching occasion' },
            approximateBudget: { type: Type.STRING, description: 'Estimated budget in INR or ₹0 (Wardrobe Owned)' },
            explanation: { type: Type.STRING, description: 'Why this outfit suits the user' },
            usesWardrobeItems: { type: Type.BOOLEAN, description: 'Whether the recommendation uses items from their wardrobe' },
            wardrobeItemNames: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exact names of items used from the user wardrobe',
            },
            whyThisOutfit: {
              type: Type.OBJECT,
              properties: {
                styleReason: { type: Type.STRING, description: 'Matches your preferred style' },
                occasionReason: { type: Type.STRING, description: 'Suitable for the selected occasion' },
                wardrobeReason: { type: Type.STRING, description: 'Uses items from your wardrobe' },
                colorReason: { type: Type.STRING, description: 'Matches your preferred colours' },
                budgetReason: { type: Type.STRING, description: 'Fits your budget' },
                points: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Bullet points explaining why this outfit suits the user',
                },
              },
              required: ['styleReason', 'occasionReason', 'wardrobeReason', 'colorReason', 'budgetReason', 'points'],
            },
          },
          required: [
            'title',
            'top',
            'bottom',
            'footwear',
            'accessories',
            'suggestedColors',
            'occasion',
            'approximateBudget',
            'explanation',
            'usesWardrobeItems',
            'wardrobeItemNames',
            'whyThisOutfit',
          ],
        },
      },
    });

    const parsed = cleanAndParseJson(responseText);
    const usesWardrobe = Boolean(
      parsed.usesWardrobeItems || (parsed.wardrobeItemNames && parsed.wardrobeItemNames.length > 0)
    );
    const wardrobeItemsUsed: string[] = Array.isArray(parsed.wardrobeItemNames) ? parsed.wardrobeItemNames : [];

    const defaultTop = isTraditional ? 'Antique Gold Zari Embroidered Blouse' : 'Classic Relaxed Shirt';
    const defaultBottom = isTraditional ? 'Crimson Red Banarasi Silk Saree' : 'Tailored Chino Trousers';

    const normalizedWhyThisOutfit = {
      styleReason:
        parsed.whyThisOutfit?.styleReason ||
        `Matches your preferred ${preferredStylesList.join(' & ') || 'Traditional'} style`,
      occasionReason:
        parsed.whyThisOutfit?.occasionReason || `Suitable for the selected ${targetOccasion} occasion`,
      wardrobeReason:
        parsed.whyThisOutfit?.wardrobeReason ||
        (usesWardrobe && wardrobeItemsUsed.length > 0
          ? `Uses items from your wardrobe: ${wardrobeItemsUsed.join(', ')}`
          : usesWardrobe
          ? 'Combines owned pieces from your virtual wardrobe'
          : 'Coordinates new pieces with your style collection'),
      colorReason:
        parsed.whyThisOutfit?.colorReason ||
        `Matches your preferred colours (${favoriteColorsList.slice(0, 3).join(', ')})`,
      budgetReason:
        parsed.whyThisOutfit?.budgetReason ||
        (usesWardrobe
          ? 'Fits your budget (utilizes your owned wardrobe items to save cost)'
          : `Fits your budget (${parsed.approximateBudget || profile.budget})`),
      points:
        Array.isArray(parsed.whyThisOutfit?.points) && parsed.whyThisOutfit.points.length > 0
          ? parsed.whyThisOutfit.points
          : [
              `Matches your preferred ${preferredStylesList[0] || 'chosen'} style`,
              `Suitable for the selected ${targetOccasion} occasion`,
              usesWardrobe && wardrobeItemsUsed.length > 0
                ? `Uses items from your wardrobe (${wardrobeItemsUsed.slice(0, 2).join(' & ')})`
                : 'Curated to match your personal aesthetic',
              `Matches your preferred ${favoriteColorsList.slice(0, 2).join(' and ')} colours`,
              usesWardrobe
                ? 'Fits your budget by styling your owned wardrobe items'
                : `Fits within your ${profile.budget} budget`,
            ],
    };

    return {
      id: `rec_${Date.now()}`,
      title: parsed.title || 'Curated Style Ensemble',
      top: parsed.top || defaultTop,
      bottom: parsed.bottom || defaultBottom,
      clothingPieces: Array.isArray(parsed.clothingPieces) && parsed.clothingPieces.length > 0
        ? parsed.clothingPieces
        : [parsed.top || defaultTop, parsed.bottom || defaultBottom],
      footwear: parsed.footwear || (isTraditional ? 'Embellished Zari Mojari Juttis' : 'Minimalist Sneakers'),
      accessories: parsed.accessories || (isTraditional ? 'Handcrafted Kundan Pearl Jhumkas & Bangles' : 'Classic wrist watch'),
      suggestedColors: parsed.suggestedColors || favoriteColorsList.slice(0, 3),
      occasion: parsed.occasion || targetOccasion,
      approximateBudget: parsed.approximateBudget || (usesWardrobe ? '₹0 (Wardrobe Owned)' : profile.budget),
      explanation: parsed.explanation || 'Harmonious color balance tailored specifically to your style preferences and wardrobe.',
      source: 'ai_stylist',
      usesWardrobeItems: usesWardrobe,
      wardrobeItemNames: wardrobeItemsUsed,
      whyThisOutfit: normalizedWhyThisOutfit,
      createdAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.warn('[AI Stylist] Upstream API spike, smoothly serving heuristic recommendation:', err?.message || err);
    return getFallbackRecommendation(
      profile,
      targetOccasion,
      'Curated via intelligent style matcher during high-demand peak.',
      userWardrobe
    );
  }
}

/**
 * 2. AI Stylist Interactive Chat
 */
export async function chatWithAIStylist(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  profile: UserProfile,
  wardrobe: WardrobeItem[],
  feedbackList: FeedbackRecord[]
): Promise<{ reply: string; outfit?: OutfitRecommendation }> {
  const ai = getGeminiClient();
  const feedbackContext = summarizeFeedback(feedbackList);
  const wardrobeSummary = wardrobe
    .map((w) => {
      let desc = `${w.itemName} (${w.category}, ${w.color}, ${w.style}`;
      if (w.fabric) desc += `, ${w.fabric}`;
      if (w.sareeType) desc += `, ${w.sareeType}`;
      if (w.sleeveStyle) desc += `, ${w.sleeveStyle}`;
      if (w.neckStyle) desc += `, ${w.neckStyle}`;
      desc += ')';
      return desc;
    })
    .join('; ');

  if (!ai) {
    return getFallbackChatResponse(message, profile, wardrobe);
  }

  const systemInstruction = `
You are "AI Personal Stylist", an approachable, chic, and culturally knowledgeable fashion advisor designed for a personalized fashion platform.
You excel equally in contemporary everyday fashion and authentic Indian traditional clothing (Sarees, Blouses, Kurtas, Lehengas, Salwar Suits, and festive ensembles).

USER PROFILE:
- Name: ${profile.name}
- Gender / Fashion Profile: ${profile.genderProfile || 'Not specified (Neutral/Versatile)'}
- Preferred Styles: ${profile.preferredStyles.join(', ')}
- Preferred Clothing: ${(profile.preferredClothing || profile.preferredCategories || []).join(', ')}
- Preferred Occasions: ${(profile.preferredOccasions || []).join(', ')}
- Colors: ${profile.favoriteColors.join(', ')}
- Budget: ${profile.budget}

USER WARDROBE ITEMS AVAILABLE:
${wardrobeSummary || 'No wardrobe items uploaded yet.'}

USER FEEDBACK MEMORY:
${feedbackContext}

CULTURAL & INDIAN FASHION EXPERTISE:
- Respect the user's Gender / Fashion Profile (${profile.genderProfile || 'neutral'}).
- Sarees and Blouses: Treat Sarees and Blouses as separate pieces that pair together. Suggest contrasting or complementary pairings (e.g. Red Banarasi saree with Gold or Emerald Green blouse; sweetheart or boat necklines; elbow-length sleeves).
- Fabric Knowledge: Articulate pairing rules for Silk, Banarasi, Kanjeevaram, Chanderi, Georgette, Chiffon, Cotton Handloom, and Brocade.
- Indian Festivals & Occasions:
  * Durga Puja (Ashtami classic red-and-white or Banarasi silk saree, chic Kurta-sets for pandal hopping)
  * Diwali (Festive bright silks, mustard yellow, royal blue, brocade details)
  * Weddings / Reception / Sangeet (Grand Banarasi/Kanjeevaram sarees, embroidered blouses, or festive lehengas)
- Traditional Accessories & Footwear: Recommend Kundan Jhumkas, Chandbalis, Chokers, Bangles, and traditional footwear like Mojaris, Juttis, or Kolhapuris.
- SAREE + BLOUSE CONSULTATION & MATCHING:
  * Saree and Blouse are separate wardrobe items that combine into one outfit (e.g., Red Banarasi Saree + Gold Embroidered Blouse + Kundan Jewellery + Ethnic Footwear).
  * If the user asks "Which blouse should I wear with this saree?" or asks for blouse recommendations:
    1. Check the user's actual Blouses in their wardrobe items listed above!
    2. If they have blouses in their wardrobe, recommend the specific blouse by name, color, neckline, and sleeve style from their wardrobe, explaining why the contrast works.
    3. Suggest complementary jewellery and footwear.
    4. If they have no matching blouse uploaded, advise on the ideal contrasting color, fabric, and neckline to pair.
- WARDROBE PRIORITIZATION IN RECOMMENDATIONS:
  * When the user asks for outfit recommendations or "what should I wear?", actively prioritize items they already own in their wardrobe!
  * For example: If they ask for a wedding outfit and own a red Banarasi saree and a gold embroidered blouse, recognize that these can be combined into a regal ensemble and suggest suitable jewellery, footwear, and accessories around them!
  * Support combinations: Saree + blouse, Saree + blouse + jewellery + footwear, Kurta + bottom + dupatta, Kurta set, Salwar suit, Anarkali, Lehenga, traditional accessories, and western combinations.

GOALS:
- Be concise, friendly, and practical (under 130 words).
- If the user asks for an outfit recommendation, outfit ideas, or "what to wear", provide your friendly conversational styling advice AND generate a structured outfit proposal inside a JSON block tagged with \`\`\`outfit-json ... \`\`\`.
- The structured JSON should match:
{
  "title": "...",
  "top": "...",
  "bottom": "...",
  "clothingPieces": ["..."],
  "footwear": "...",
  "accessories": "...",
  "suggestedColors": ["..."],
  "occasion": "...",
  "approximateBudget": "...",
  "explanation": "...",
  "usesWardrobeItems": true,
  "wardrobeItemNames": ["..."],
  "whyThisOutfit": {
    "styleReason": "Matches your preferred style...",
    "occasionReason": "Suitable for the selected occasion...",
    "wardrobeReason": "Uses items from your wardrobe...",
    "colorReason": "Matches your preferred colours...",
    "budgetReason": "Fits your budget...",
    "points": [
      "Matches your preferred style",
      "Suitable for the selected occasion",
      "Uses items from your wardrobe",
      "Matches your preferred colours",
      "Fits your budget"
    ]
  }
}
`;

  try {
    const conversationPrompt = `
${history.slice(-4).map((h) => `${h.role === 'user' ? 'User' : 'Stylist'}: ${h.content}`).join('\n')}
User: ${message}
Stylist:
`;

    const fullText = await generateContentWithRetry(ai, {
      contents: conversationPrompt,
      config: {
        systemInstruction,
      },
    });

    // Check if there's an embedded outfit JSON block
    const jsonMatch = fullText.match(/```(?:outfit-json|json)?\s*([\s\S]*?)\s*```/);
    let outfit: OutfitRecommendation | undefined;
    let cleanReply = fullText;

    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = cleanAndParseJson(jsonMatch[1]);
        if (parsed.top && parsed.bottom) {
          const usesWardrobe = Boolean(
            parsed.usesWardrobeItems || (parsed.wardrobeItemNames && parsed.wardrobeItemNames.length > 0)
          );
          const wardrobeItemsUsed: string[] = Array.isArray(parsed.wardrobeItemNames) ? parsed.wardrobeItemNames : [];

          const whyThisOutfit = {
            styleReason:
              parsed.whyThisOutfit?.styleReason ||
              `Matches your preferred ${profile.preferredStyles.join(' & ') || 'Traditional'} style`,
            occasionReason:
              parsed.whyThisOutfit?.occasionReason || `Suitable for ${parsed.occasion || 'the requested occasion'}`,
            wardrobeReason:
              parsed.whyThisOutfit?.wardrobeReason ||
              (usesWardrobe && wardrobeItemsUsed.length > 0
                ? `Uses items from your wardrobe: ${wardrobeItemsUsed.join(', ')}`
                : usesWardrobe
                ? 'Combines pieces from your wardrobe'
                : 'Coordinates styled pieces matching your wardrobe collection'),
            colorReason:
              parsed.whyThisOutfit?.colorReason ||
              `Matches your preferred colours (${profile.favoriteColors.slice(0, 3).join(', ')})`,
            budgetReason:
              parsed.whyThisOutfit?.budgetReason ||
              (usesWardrobe ? 'Fits your budget (uses owned wardrobe items)' : `Within your ${profile.budget} budget`),
            points:
              Array.isArray(parsed.whyThisOutfit?.points) && parsed.whyThisOutfit.points.length > 0
                ? parsed.whyThisOutfit.points
                : [
                    `Matches your preferred style`,
                    `Suitable for the selected occasion`,
                    usesWardrobe
                      ? `Uses items from your wardrobe`
                      : 'Styled to complement your personal aesthetic',
                    `Matches your preferred colours`,
                    `Fits your budget`,
                  ],
          };

          outfit = {
            id: `rec_chat_${Date.now()}`,
            title: parsed.title || 'Stylist Pick',
            top: parsed.top,
            bottom: parsed.bottom,
            clothingPieces: Array.isArray(parsed.clothingPieces) && parsed.clothingPieces.length > 0
              ? parsed.clothingPieces
              : [parsed.top, parsed.bottom],
            footwear: parsed.footwear || 'Ethnic Mojaris / Footwear',
            accessories: parsed.accessories || 'Subtle accents',
            suggestedColors: parsed.suggestedColors || profile.favoriteColors.slice(0, 3),
            occasion: parsed.occasion || 'Everyday',
            approximateBudget: parsed.approximateBudget || (usesWardrobe ? '₹0 (Wardrobe Owned)' : profile.budget),
            explanation: parsed.explanation || 'Curated specifically for your request.',
            source: 'ai_stylist',
            usesWardrobeItems: usesWardrobe,
            wardrobeItemNames: wardrobeItemsUsed,
            whyThisOutfit,
            createdAt: new Date().toISOString(),
          };
          cleanReply = fullText.replace(/```(?:outfit-json|json)?[\s\S]*?```/, '').trim();
        }
      } catch (parseErr) {
        console.warn('Could not parse embedded outfit JSON:', parseErr);
      }
    }

    return {
      reply: cleanReply || "Here's a curated outfit tailored to your preferences!",
      outfit,
    };
  } catch (err: any) {
    console.warn('[AI Stylist Chat] Serving fallback chat response due to temporary demand spike:', err?.message || err);
    return getFallbackChatResponse(message, profile, wardrobe);
  }
}

/**
 * 3. Wardrobe-based Outfit Generation ("Create Outfit From My Wardrobe")
 */
export async function generateOutfitFromWardrobe(
  profile: UserProfile,
  wardrobe: WardrobeItem[],
  feedbackList: FeedbackRecord[],
  targetOccasion?: string
): Promise<OutfitRecommendation> {
  const ai = getGeminiClient();
  const feedbackContext = summarizeFeedback(feedbackList);
  const occasion = targetOccasion || 'Campus & Everyday Outing';

  if (!wardrobe || wardrobe.length === 0) {
    throw new Error('Your wardrobe is currently empty. Add at least a top, bottom, and shoes to generate an outfit!');
  }

  const isTraditionalOccasion =
    occasion.toLowerCase().includes('puja') ||
    occasion.toLowerCase().includes('diwali') ||
    occasion.toLowerCase().includes('wedding') ||
    occasion.toLowerCase().includes('reception') ||
    occasion.toLowerCase().includes('festival') ||
    occasion.toLowerCase().includes('traditional') ||
    occasion.toLowerCase().includes('ceremony');

  const wardrobeListStr = wardrobe
    .map((item) => {
      let desc = `- [ID: ${item.id}] ${item.itemName} (Category: ${item.category}, Color: ${item.color}, Style: ${item.style}`;
      if (item.fabric) desc += `, Fabric: ${item.fabric}`;
      if (item.sareeType) desc += `, Saree Type: ${item.sareeType}`;
      if (item.sleeveStyle) desc += `, Sleeve: ${item.sleeveStyle}`;
      if (item.neckStyle) desc += `, Neck: ${item.neckStyle}`;
      if (item.occasion) desc += `, Occasion: ${item.occasion}`;
      desc += ')';
      return desc;
    })
    .join('\n');

  if (!ai) {
    return getFallbackWardrobeRecommendation(profile, wardrobe, occasion);
  }

  const prompt = `
You are an intelligent wardrobe coordinator.
The user wants you to create a complete outfit COMBINATION strictly using the clothing items currently available in their Virtual Wardrobe.

USER'S VIRTUAL WARDROBE:
${wardrobeListStr}

USER PROFILE & STYLES:
- Gender / Fashion Profile: ${profile.genderProfile || 'Not specified'}
- Styles: ${profile.preferredStyles.join(', ')}
- Colors: ${profile.favoriteColors.join(', ')}
- Target Occasion: ${occasion}

FEEDBACK PREFERENCES:
${feedbackContext}

COMBINATION RULES:
1. You MUST select actual items that exist in the user's wardrobe list above for top, bottom, and footwear (or dresses/sarees if applicable).
2. CRITICAL SAREE & BLOUSE PAIRING RULE:
   - Note that Sarees and Blouses are separate items in the wardrobe.
   - If you select a Saree, you MUST pair it with a complementary Blouse from the wardrobe as the top, and the Saree as the bottom/drape. Do NOT pair a Saree with a western shirt or denim jacket!
   - Match Indian Jewellery and Ethnic Footwear (Mojaris, Juttis) from the wardrobe to complete the traditional ensemble.
3. CRITICAL KURTA PAIRING RULE:
   - When choosing a Kurta, pair with matching Palazzo Pants, Churidar, or Ethnic Bottoms, and a Dupatta from the wardrobe if present.
4. For Western / Everyday occasions (Campus, Casual, Party): Pair shirts/t-shirts with jeans/trousers and sneakers/shoes.
5. If an accessory or footwear is not present in the wardrobe, you may recommend one that compliments the set, but clearly emphasize owned items.
6. List the exact names of the wardrobe items used in the "wardrobeItemNames" array.
7. Give a clear explanation of why this combination works together (silhouette, color harmony, cultural appropriateness).
8. Approximate budget should be "₹0 (Wardrobe Owned)".
9. Provide "whyThisOutfit" object detailing reasons for style, occasion, wardrobe, colors, and budget.
`;

  try {
    const responseText = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Outfit title' },
            top: { type: Type.STRING, description: 'Top garment chosen from wardrobe (or Blouse / Kurta)' },
            bottom: { type: Type.STRING, description: 'Bottom garment chosen from wardrobe (or Saree drape / Palazzo)' },
            clothingPieces: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of pieces forming the outfit',
            },
            footwear: { type: Type.STRING, description: 'Footwear chosen from wardrobe' },
            accessories: { type: Type.STRING, description: 'Accessories or styling touch' },
            suggestedColors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            occasion: { type: Type.STRING },
            explanation: { type: Type.STRING },
            wardrobeItemNames: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exact names of the selected wardrobe items',
            },
            whyThisOutfit: {
              type: Type.OBJECT,
              properties: {
                styleReason: { type: Type.STRING },
                occasionReason: { type: Type.STRING },
                wardrobeReason: { type: Type.STRING },
                colorReason: { type: Type.STRING },
                budgetReason: { type: Type.STRING },
                points: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['styleReason', 'occasionReason', 'wardrobeReason', 'colorReason', 'budgetReason', 'points'],
            },
          },
          required: [
            'title',
            'top',
            'bottom',
            'footwear',
            'accessories',
            'suggestedColors',
            'occasion',
            'explanation',
            'wardrobeItemNames',
          ],
        },
      },
    });

    const parsed = cleanAndParseJson(responseText);
    const wardrobeItemsUsed: string[] = Array.isArray(parsed.wardrobeItemNames) ? parsed.wardrobeItemNames : [];

    const whyThisOutfit = {
      styleReason:
        parsed.whyThisOutfit?.styleReason ||
        `Matches your preferred ${profile.preferredStyles.join(' & ') || 'Personal'} style`,
      occasionReason:
        parsed.whyThisOutfit?.occasionReason || `Suitable for ${parsed.occasion || occasion}`,
      wardrobeReason:
        parsed.whyThisOutfit?.wardrobeReason ||
        (wardrobeItemsUsed.length > 0
          ? `Uses 100% owned items from your wardrobe: ${wardrobeItemsUsed.join(', ')}`
          : 'Assembled entirely from your virtual wardrobe collection'),
      colorReason:
        parsed.whyThisOutfit?.colorReason ||
        `Combines tones that harmonize with your preferred palette (${profile.favoriteColors.slice(0, 3).join(', ')})`,
      budgetReason:
        parsed.whyThisOutfit?.budgetReason || 'Fits your budget: ₹0 spent by styling items you already own',
      points:
        Array.isArray(parsed.whyThisOutfit?.points) && parsed.whyThisOutfit.points.length > 0
          ? parsed.whyThisOutfit.points
          : [
              `Matches your preferred style`,
              `Suitable for ${occasion}`,
              `Uses items from your wardrobe (${wardrobeItemsUsed.slice(0, 2).join(' & ') || 'Owned items'})`,
              `Matches your preferred colours`,
              `Fits your budget: ₹0 (Uses owned wardrobe items)`,
            ],
    };

    return {
      id: `rec_wardrobe_${Date.now()}`,
      title: parsed.title || 'Wardrobe Combination',
      top: parsed.top,
      bottom: parsed.bottom,
      clothingPieces: Array.isArray(parsed.clothingPieces) && parsed.clothingPieces.length > 0
        ? parsed.clothingPieces
        : [parsed.top, parsed.bottom],
      footwear: parsed.footwear,
      accessories: parsed.accessories || 'Minimal styling accents',
      suggestedColors: parsed.suggestedColors || ['Neutral'],
      occasion: parsed.occasion || occasion,
      approximateBudget: '₹0 (Wardrobe Owned)',
      explanation: parsed.explanation,
      source: 'wardrobe',
      usesWardrobeItems: true,
      wardrobeItemNames: wardrobeItemsUsed,
      whyThisOutfit,
      createdAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.warn('[AI Wardrobe] Serving fallback wardrobe combination due to temporary demand spike:', err?.message || err);
    return getFallbackWardrobeRecommendation(profile, wardrobe, occasion);
  }
}

// ==========================================
// HEURISTIC / FALLBACK ENGINES (FOR OFFLINE / ROBUSTNESS)
// ==========================================

function getFallbackRecommendation(
  profile: UserProfile,
  occasion: string,
  note: string,
  wardrobe?: WardrobeItem[]
): OutfitRecommendation {
  const preferredClothingList = (profile.preferredClothing && profile.preferredClothing.length > 0)
    ? profile.preferredClothing
    : (profile.preferredCategories || []);
  const prefersTraditionalClothing = preferredClothingList.some((c) =>
    ['sarees', 'blouses', 'kurtas', 'kurta sets', 'salwar suits', 'lehengas', 'anarkalis'].includes(c.toLowerCase())
  );
  const prefersCollegeWestern = preferredClothingList.some((c) =>
    ['t-shirts', 'jeans', 'tops', 'shirts'].includes(c.toLowerCase())
  );

  const isTraditional =
    occasion.toLowerCase().includes('puja') ||
    occasion.toLowerCase().includes('diwali') ||
    occasion.toLowerCase().includes('wedding') ||
    occasion.toLowerCase().includes('reception') ||
    occasion.toLowerCase().includes('festival') ||
    occasion.toLowerCase().includes('traditional') ||
    occasion.toLowerCase().includes('ceremony') ||
    occasion.toLowerCase().includes('durga') ||
    prefersTraditionalClothing ||
    profile.preferredStyles.some((s) => s.toLowerCase().includes('traditional'));

  const isMale = profile.genderProfile === 'Male';
  const userWardrobe = wardrobe || [];

  if (isTraditional) {
    if (isMale) {
      const ownedMaleKurta = userWardrobe.find((w) => w.category === 'Kurtas' || w.category === 'Kurta Sets');
      const ownedShoe = userWardrobe.find((w) => w.category === 'Ethnic Footwear');

      const usedItems = [ownedMaleKurta?.itemName, ownedShoe?.itemName].filter(Boolean) as string[];
      const usesWardrobe = usedItems.length > 0;

      return {
        id: `rec_fb_trad_m_${Date.now()}`,
        title: 'Royal Silk Kurta & Embroidered Nehru Jacket',
        top: ownedMaleKurta
          ? ownedMaleKurta.itemName
          : 'Raw Silk Tussar Kurta with Brocade Nehru Jacket',
        bottom: 'Classic Ivory Churidar Pajama',
        clothingPieces: [
          ownedMaleKurta ? ownedMaleKurta.itemName : 'Raw Silk Tussar Kurta',
          'Brocade Nehru Jacket',
          'Classic Ivory Churidar Pajama',
        ],
        footwear: ownedShoe ? ownedShoe.itemName : 'Handcrafted Tan Leather Mojaris',
        accessories: 'Antique Gold Pocket Square & Brass Brooch',
        suggestedColors: ['Mustard Gold', 'Ivory', 'Deep Maroon'],
        occasion,
        approximateBudget: usesWardrobe ? '₹0 (Wardrobe Owned)' : (profile.budget || '₹2,800'),
        explanation: `${note} A majestic festive ensemble pairing rich raw silk with an embroidered jacket, tailored perfectly for traditional Indian celebrations.`,
        source: 'ai_stylist',
        usesWardrobeItems: usesWardrobe,
        wardrobeItemNames: usedItems,
        whyThisOutfit: {
          styleReason: `Matches your preferred ${profile.preferredStyles.join(' & ') || 'Traditional'} style`,
          occasionReason: `Suitable for ${occasion} celebrations and formal gatherings`,
          wardrobeReason: usesWardrobe
            ? `Uses items from your wardrobe: ${usedItems.join(', ')}`
            : 'Coordinates with your personal style palette',
          colorReason: `Harmonizes with ${profile.favoriteColors.slice(0, 2).join(' & ') || 'Mustard Gold and Ivory'}`,
          budgetReason: usesWardrobe ? 'Fits your budget: ₹0 spent utilizing owned wardrobe items' : `Fits within your ${profile.budget} budget`,
          points: [
            `Matches your preferred ${profile.preferredStyles[0] || 'Traditional'} style`,
            `Suitable for the selected ${occasion} occasion`,
            usesWardrobe ? `Uses items from your wardrobe (${usedItems.join(', ')})` : 'Curated to elevate your ethnic wardrobe',
            `Matches your preferred colours`,
            `Fits your budget`,
          ],
        },
        createdAt: new Date().toISOString(),
      };
    }

    // Traditional Female: Prioritize owned Sarees & Blouses, or Kurtas
    const ownedSaree = userWardrobe.find((w) => w.category === 'Sarees');
    const ownedBlouse = userWardrobe.find((w) => w.category === 'Blouses');
    const ownedJewel = userWardrobe.find((w) => w.category === 'Indian Jewellery');
    const ownedEthnicFootwear = userWardrobe.find((w) => w.category === 'Ethnic Footwear');

    const usedItems = [
      ownedSaree?.itemName,
      ownedBlouse?.itemName,
      ownedJewel?.itemName,
      ownedEthnicFootwear?.itemName,
    ].filter(Boolean) as string[];
    const usesWardrobe = usedItems.length > 0;

    const topPiece = ownedBlouse
      ? `${ownedBlouse.itemName} (${ownedBlouse.neckStyle || 'Sweetheart Neck'}, ${ownedBlouse.sleeveStyle || 'Elbow Sleeves'})`
      : 'Antique Gold Zari Embroidered Blouse (Sweetheart Neck, Elbow Sleeves)';
    const bottomPiece = ownedSaree
      ? `${ownedSaree.itemName} (${ownedSaree.fabric || 'Silk'} drape)`
      : 'Crimson Red Banarasi Katan Silk Saree with golden zari drape';
    const footwearPiece = ownedEthnicFootwear?.itemName || 'Embellished Champagne Gold Mojari Juttis';
    const accPiece = ownedJewel?.itemName || 'Handcrafted Kundan Pearl Jhumkas & Bangles';

    return {
      id: `rec_fb_trad_f_${Date.now()}`,
      title: 'Royal Banarasi & Gold Embroidered Saree Ensemble',
      top: topPiece,
      bottom: bottomPiece,
      clothingPieces: [topPiece, bottomPiece],
      footwear: footwearPiece,
      accessories: accPiece,
      suggestedColors: ['Crimson Red', 'Antique Gold', 'Emerald accents'],
      occasion,
      approximateBudget: usesWardrobe ? '₹0 (Wardrobe Owned)' : (profile.budget || '₹2,800'),
      explanation: `${note} A timeless traditional pairing uniting a regal silk saree with an embroidered blouse, elevated by handcrafted kundan jhumkas for festive grandeur.`,
      source: 'ai_stylist',
      usesWardrobeItems: usesWardrobe,
      wardrobeItemNames: usedItems,
      whyThisOutfit: {
        styleReason: `Matches your preferred ${profile.preferredStyles.join(' & ') || 'Traditional'} style`,
        occasionReason: `Suitable for the selected ${occasion} occasion`,
        wardrobeReason: usesWardrobe
          ? `Uses items from your wardrobe: ${usedItems.join(', ')}`
          : 'Recommends coordinated pieces matching your traditional aesthetics',
        colorReason: `Matches your preferred colours (${profile.favoriteColors.slice(0, 3).join(', ')})`,
        budgetReason: usesWardrobe
          ? 'Fits your budget: ₹0 spent by styling your owned wardrobe items'
          : `Fits within your ${profile.budget} budget`,
        points: [
          `Matches your preferred ${profile.preferredStyles[0] || 'Traditional'} style`,
          `Suitable for the selected ${occasion} occasion`,
          usesWardrobe
            ? `Uses items from your wardrobe (${usedItems.slice(0, 2).join(' & ')})`
            : 'Curated traditional ensemble with designer flair',
          `Matches your preferred colours`,
          usesWardrobe ? 'Fits your budget: ₹0 (Uses owned items)' : `Fits your ${profile.budget} budget`,
        ],
      },
      createdAt: new Date().toISOString(),
    };
  }

  // College or Casual Western
  if (
    occasion.toLowerCase().includes('college') ||
    profile.preferredStyles.some((s) => s.toLowerCase().includes('college')) ||
    prefersCollegeWestern
  ) {
    const ownedTop = userWardrobe.find((w) => w.category === 'T-shirts' || w.category === 'Shirts' || w.category === 'Tops');
    const ownedBottom = userWardrobe.find((w) => w.category === 'Jeans' || w.category === 'Trousers');
    const ownedShoe = userWardrobe.find((w) => w.category === 'Shoes');

    const usedItems = [ownedTop?.itemName, ownedBottom?.itemName, ownedShoe?.itemName].filter(Boolean) as string[];
    const usesWardrobe = usedItems.length > 0;

    const topItem = ownedTop?.itemName || 'Relaxed Heavyweight Cotton Graphic/Plain T-Shirt';
    const bottomItem = ownedBottom?.itemName || 'Classic Straight-Leg Mid-Blue Denim Jeans';
    const shoeItem = ownedShoe?.itemName || 'Clean Low-Top Canvas Sneakers';

    return {
      id: `rec_fb_college_${Date.now()}`,
      title: 'Campus Essential T-Shirt & Denim',
      top: topItem,
      bottom: bottomItem,
      clothingPieces: [topItem, bottomItem],
      footwear: shoeItem,
      accessories: 'Canvas Laptop Backpack & Minimalist Digital Watch',
      suggestedColors: ['Crisp White', 'Indigo Blue', 'Heather Gray'],
      occasion,
      approximateBudget: usesWardrobe ? '₹0 (Wardrobe Owned)' : (profile.budget || '₹1,800'),
      explanation: `${note} Breathable cotton T-shirt paired with classic jeans and sneakers provides effortless comfort and durability across campus lectures.`,
      source: 'ai_stylist',
      usesWardrobeItems: usesWardrobe,
      wardrobeItemNames: usedItems,
      whyThisOutfit: {
        styleReason: `Matches your preferred ${profile.preferredStyles.join(' & ') || 'Casual'} style`,
        occasionReason: `Suitable for ${occasion} and daily campus comfort`,
        wardrobeReason: usesWardrobe
          ? `Uses items from your wardrobe: ${usedItems.join(', ')}`
          : 'Coordinates versatile everyday staples matching your collection',
        colorReason: `Matches your preferred neutral & cool tones`,
        budgetReason: usesWardrobe ? 'Fits your budget: ₹0 spent with owned wardrobe pieces' : `Fits within your ${profile.budget} budget`,
        points: [
          `Matches your preferred ${profile.preferredStyles[0] || 'Casual'} style`,
          `Suitable for the selected ${occasion} occasion`,
          usesWardrobe ? `Uses items from your wardrobe (${usedItems.join(', ')})` : 'Effortless everyday styling',
          `Matches your preferred colours`,
          `Fits your budget`,
        ],
      },
      createdAt: new Date().toISOString(),
    };
  }

  const color1 = profile.favoriteColors[0] || 'Navy Blue';
  const color2 = profile.favoriteColors[1] || 'White';
  const style = profile.preferredStyles[0] || 'Casual';

  const ownedTop = userWardrobe.find((w) => ['Shirts', 'T-shirts', 'Tops'].includes(w.category));
  const ownedBottom = userWardrobe.find((w) => ['Trousers', 'Jeans'].includes(w.category));
  const usedItems = [ownedTop?.itemName, ownedBottom?.itemName].filter(Boolean) as string[];
  const usesWardrobe = usedItems.length > 0;

  const topPiece = ownedTop?.itemName || `Tailored ${color1} Relaxed Oxford Shirt`;
  const bottomPiece = ownedBottom?.itemName || `Slim-fit ${color2 === 'White' ? 'Beige' : 'Charcoal'} Chino Trousers`;

  return {
    id: `rec_fb_${Date.now()}`,
    title: `${style} Harmony Ensemble`,
    top: topPiece,
    bottom: bottomPiece,
    clothingPieces: [topPiece, bottomPiece],
    footwear: 'Clean Low-top Leather Trainers in Off-White',
    accessories: 'Vintage Leather Belt & Minimalist Chronograph',
    suggestedColors: [color1, color2, 'Sand Beige'],
    occasion,
    approximateBudget: usesWardrobe ? '₹0 (Wardrobe Owned)' : (profile.budget || '₹2,200'),
    explanation: `${note} Combining ${color1} with neutral tones creates a cohesive silhouette ideal for ${occasion}.`,
    source: 'ai_stylist',
    usesWardrobeItems: usesWardrobe,
    wardrobeItemNames: usedItems,
    whyThisOutfit: {
      styleReason: `Matches your preferred ${style} style`,
      occasionReason: `Suitable for ${occasion}`,
      wardrobeReason: usesWardrobe
        ? `Uses items from your wardrobe: ${usedItems.join(', ')}`
        : 'Coordinates versatile essentials tailored to your taste',
      colorReason: `Matches your preferred ${color1} and ${color2} colors`,
      budgetReason: usesWardrobe ? 'Fits your budget: ₹0 using owned items' : `Fits within your ${profile.budget} budget`,
      points: [
        `Matches your preferred ${style} style`,
        `Suitable for the selected occasion`,
        usesWardrobe ? `Uses items from your wardrobe (${usedItems.join(', ')})` : 'Curated to complement your wardrobe',
        `Matches your preferred colours (${color1}, ${color2})`,
        `Fits your budget`,
      ],
    },
    createdAt: new Date().toISOString(),
  };
}

function getFallbackWardrobeRecommendation(
  profile: UserProfile,
  wardrobe: WardrobeItem[],
  occasion: string
): OutfitRecommendation {
  const isTraditionalOccasion =
    occasion.toLowerCase().includes('puja') ||
    occasion.toLowerCase().includes('diwali') ||
    occasion.toLowerCase().includes('wedding') ||
    occasion.toLowerCase().includes('reception') ||
    occasion.toLowerCase().includes('festival') ||
    occasion.toLowerCase().includes('traditional') ||
    occasion.toLowerCase().includes('durga');

  const sarees = wardrobe.filter((w) => w.category === 'Sarees');
  const blouses = wardrobe.filter((w) => w.category === 'Blouses');
  const kurtas = wardrobe.filter((w) => w.category === 'Kurtas' || w.category === 'Kurta Sets');
  const ethnicBottoms = wardrobe.filter(
    (w) => w.category === 'Palazzo Pants' || w.category === 'Churidar' || w.category === 'Ethnic Bottoms'
  );
  const ethnicShoes = wardrobe.filter((w) => w.category === 'Ethnic Footwear');
  const indianJewellery = wardrobe.filter((w) => w.category === 'Indian Jewellery');

  // If traditional occasion and user owns Sarees & Blouses
  if (isTraditionalOccasion && sarees.length > 0 && blouses.length > 0) {
    const chosenSaree = sarees[0];
    const chosenBlouse = blouses[0];
    const chosenFootwear = ethnicShoes[0] || { itemName: 'Embellished Mojaris' };
    const chosenJewel = indianJewellery[0] || { itemName: 'Kundan Pearl Jhumkas' };

    const topItem = `${chosenBlouse.itemName} (${chosenBlouse.neckStyle || 'Designer Neck'}, ${chosenBlouse.sleeveStyle || 'Elbow Sleeves'})`;
    const bottomItem = `${chosenSaree.itemName} (${chosenSaree.fabric || 'Silk'} drape)`;
    const usedItems = [chosenSaree.itemName, chosenBlouse.itemName, chosenJewel.itemName, chosenFootwear.itemName];

    return {
      id: `rec_wardrobe_trad_${Date.now()}`,
      title: `${chosenSaree.itemName} + ${chosenBlouse.itemName}`,
      top: topItem,
      bottom: bottomItem,
      clothingPieces: [topItem, bottomItem],
      footwear: chosenFootwear.itemName,
      accessories: chosenJewel.itemName,
      suggestedColors: [chosenSaree.color, chosenBlouse.color, 'Gold'],
      occasion,
      approximateBudget: '₹0 (Wardrobe Owned)',
      explanation: `Harmonious traditional Indian pairing matching your ${chosenSaree.color} ${chosenSaree.itemName} with the contrasting ${chosenBlouse.color} ${chosenBlouse.itemName} and ethnic accents.`,
      source: 'wardrobe',
      usesWardrobeItems: true,
      wardrobeItemNames: usedItems,
      whyThisOutfit: {
        styleReason: `Matches your preferred ${profile.preferredStyles.join(' & ') || 'Traditional'} style`,
        occasionReason: `Suitable for ${occasion} celebrations and rituals`,
        wardrobeReason: `Uses 100% owned items from your wardrobe: ${usedItems.join(', ')}`,
        colorReason: `Combines ${chosenSaree.color} and ${chosenBlouse.color} from your preferred palette`,
        budgetReason: 'Fits your budget: ₹0 spent by styling pieces you already own',
        points: [
          `Matches your preferred Traditional style`,
          `Suitable for the selected ${occasion} occasion`,
          `Uses items from your wardrobe (${chosenSaree.itemName} & ${chosenBlouse.itemName})`,
          `Matches your preferred colours`,
          `Fits your budget: ₹0 (Wardrobe Owned)`,
        ],
      },
      createdAt: new Date().toISOString(),
    };
  }

  // If traditional occasion and user owns Kurtas
  if (isTraditionalOccasion && kurtas.length > 0) {
    const chosenKurta = kurtas[0];
    const chosenBottom = ethnicBottoms[0] || { itemName: 'Silk Flared Palazzo Pants', color: 'Ivory White' };
    const chosenFootwear = ethnicShoes[0] || { itemName: 'Zari Juttis' };
    const chosenJewel = indianJewellery[0] || { itemName: 'Traditional Jhumkas' };
    const usedItems = [chosenKurta.itemName, chosenBottom.itemName, chosenJewel.itemName];

    return {
      id: `rec_wardrobe_trad_k_${Date.now()}`,
      title: `${chosenKurta.itemName} & Palazzo Ensemble`,
      top: chosenKurta.itemName,
      bottom: chosenBottom.itemName,
      clothingPieces: [chosenKurta.itemName, chosenBottom.itemName],
      footwear: chosenFootwear.itemName,
      accessories: chosenJewel.itemName,
      suggestedColors: [chosenKurta.color, chosenBottom.color, 'Gold'],
      occasion,
      approximateBudget: '₹0 (Wardrobe Owned)',
      explanation: `Comfortable and elegant ethnic pairing uniting your ${chosenKurta.itemName} with ${chosenBottom.itemName} for ${occasion}.`,
      source: 'wardrobe',
      usesWardrobeItems: true,
      wardrobeItemNames: usedItems,
      whyThisOutfit: {
        styleReason: `Matches your preferred Traditional ethnic aesthetics`,
        occasionReason: `Suitable for ${occasion}`,
        wardrobeReason: `Uses items from your wardrobe: ${usedItems.join(', ')}`,
        colorReason: `Harmonizes ${chosenKurta.color} with ${chosenBottom.color}`,
        budgetReason: 'Fits your budget: ₹0 spent by styling your owned wardrobe items',
        points: [
          `Matches your preferred style`,
          `Suitable for ${occasion}`,
          `Uses items from your wardrobe (${chosenKurta.itemName} & ${chosenBottom.itemName})`,
          `Matches your preferred colours`,
          `Fits your budget: ₹0 (Wardrobe Owned)`,
        ],
      },
      createdAt: new Date().toISOString(),
    };
  }

  // Western fallback
  const tops = wardrobe.filter((w) => ['Shirts', 'T-shirts', 'Jackets', 'Tops'].includes(w.category));
  const bottoms = wardrobe.filter((w) => ['Trousers', 'Jeans', 'Skirts'].includes(w.category));
  const shoes = wardrobe.filter((w) => w.category === 'Shoes' || w.category === 'Ethnic Footwear');
  const accessories = wardrobe.filter((w) => w.category === 'Accessories' || w.category === 'Indian Jewellery');

  const chosenTop = tops[0] || wardrobe[0];
  const chosenBottom = bottoms[0] || wardrobe[1] || wardrobe[0];
  const chosenShoe = shoes[0] || { itemName: 'Minimalist Sneakers', color: 'White' };
  const chosenAcc = accessories[0] || { itemName: 'Structured Messenger Tote' };
  const usedItems = [chosenTop.itemName, chosenBottom.itemName, chosenShoe.itemName];

  return {
    id: `rec_wardrobe_fb_${Date.now()}`,
    title: `${chosenTop.itemName} + ${chosenBottom.itemName}`,
    top: chosenTop.itemName,
    bottom: chosenBottom.itemName,
    clothingPieces: [chosenTop.itemName, chosenBottom.itemName],
    footwear: chosenShoe.itemName,
    accessories: chosenAcc.itemName,
    suggestedColors: [chosenTop.color, chosenBottom.color, 'Monochrome accents'],
    occasion,
    approximateBudget: '₹0 (Wardrobe Owned)',
    explanation: `Smart combination pairing your ${chosenTop.color} ${chosenTop.itemName} with ${chosenBottom.color} ${chosenBottom.itemName} for a cohesive ${occasion} outfit.`,
    source: 'wardrobe',
    usesWardrobeItems: true,
    wardrobeItemNames: usedItems,
    whyThisOutfit: {
      styleReason: `Matches your preferred ${profile.preferredStyles.join(' & ') || 'Everyday'} style`,
      occasionReason: `Suitable for ${occasion}`,
      wardrobeReason: `Uses 100% owned items from your wardrobe: ${usedItems.join(', ')}`,
      colorReason: `Pairs ${chosenTop.color} with ${chosenBottom.color}`,
      budgetReason: 'Fits your budget: ₹0 spent by styling items you already own',
      points: [
        `Matches your preferred style`,
        `Suitable for the selected occasion`,
        `Uses items from your wardrobe (${chosenTop.itemName} & ${chosenBottom.itemName})`,
        `Matches your preferred colours`,
        `Fits your budget: ₹0 (Wardrobe Owned)`,
      ],
    },
    createdAt: new Date().toISOString(),
  };
}

function getFallbackChatResponse(
  message: string,
  profile: UserProfile,
  wardrobe: WardrobeItem[]
): { reply: string; outfit?: OutfitRecommendation } {
  const lower = message.toLowerCase();

  // Indian Traditional queries
  if (
    lower.includes('durga puja') ||
    lower.includes('pandal') ||
    lower.includes('ashtami') ||
    lower.includes('puja')
  ) {
    const ownedSaree = wardrobe.find((w) => w.category === 'Sarees');
    const ownedBlouse = wardrobe.find((w) => w.category === 'Blouses');
    const ownedJewel = wardrobe.find((w) => w.category === 'Indian Jewellery');
    const ownedShoe = wardrobe.find((w) => w.category === 'Ethnic Footwear');

    const usedItems = [ownedSaree?.itemName, ownedBlouse?.itemName, ownedJewel?.itemName, ownedShoe?.itemName].filter(Boolean) as string[];
    const usesWardrobe = usedItems.length > 0;

    return {
      reply: `For Durga Puja, traditional elegance is unmatched! For Ashtami morning anjali, a classic red-and-white or crimson Banarasi silk saree with a contrasting gold embroidered blouse is quintessential${
        usesWardrobe ? ` (and you already have matching pieces in your wardrobe!)` : ''
      }. For pandal hopping, choose comfortable chic juttis and statement Kundan jhumkas!`,
      outfit: {
        id: `rec_chat_dp_${Date.now()}`,
        title: 'Durga Puja Ashtami Royal Saree Look',
        top: ownedBlouse ? ownedBlouse.itemName : 'Antique Gold Zari Embroidered Raw Silk Blouse (Sweetheart Neck)',
        bottom: ownedSaree ? ownedSaree.itemName : 'Crimson Red Banarasi Katan Silk Saree with heavy Zari pallu',
        clothingPieces: [
          ownedBlouse ? ownedBlouse.itemName : 'Antique Gold Zari Embroidered Blouse',
          ownedSaree ? ownedSaree.itemName : 'Crimson Red Banarasi Silk Saree',
        ],
        footwear: ownedShoe ? ownedShoe.itemName : 'Embellished Champagne Gold Mojari Juttis',
        accessories: ownedJewel ? ownedJewel.itemName : 'Handcrafted Kundan Pearl Jhumkas & Gold Shakha-Pola / Bangles',
        suggestedColors: ['Crimson Red', 'Antique Gold', 'Ivory'],
        occasion: 'Durga Puja Ashtami / Festive',
        approximateBudget: usesWardrobe ? '₹0 (Wardrobe Owned)' : '₹2,600',
        explanation:
          'A regal festive ensemble capturing the spirit of Durga Puja, pairing rich Banarasi silk with a contrasting embroidered blouse.',
        source: 'ai_stylist',
        usesWardrobeItems: usesWardrobe,
        wardrobeItemNames: usedItems,
        whyThisOutfit: {
          styleReason: 'Matches your preferred Traditional style with authentic Banarasi handloom artistry',
          occasionReason: 'Suitable for Durga Puja Ashtami and festive celebrations',
          wardrobeReason: usesWardrobe
            ? `Uses items from your wardrobe: ${usedItems.join(', ')}`
            : 'Coordinated festive pieces complementing your wardrobe collection',
          colorReason: 'Matches your favorite Crimson Red and Gold festive palette',
          budgetReason: usesWardrobe ? 'Fits your budget: ₹0 using owned wardrobe items' : 'Fits within your festive budget',
          points: [
            'Matches your preferred Traditional style',
            'Suitable for the selected Durga Puja occasion',
            usesWardrobe ? `Uses items from your wardrobe (${usedItems.slice(0, 2).join(' & ')})` : 'Regal festive coordination',
            'Matches your preferred Crimson Red and Gold colours',
            usesWardrobe ? 'Fits your budget: ₹0 (Wardrobe Owned)' : 'Fits your budget',
          ],
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  if (
    lower.includes('wedding') ||
    lower.includes('bengali wedding') ||
    lower.includes('reception') ||
    lower.includes('sangeet')
  ) {
    const ownedSaree = wardrobe.find((w) => w.category === 'Sarees');
    const ownedBlouse = wardrobe.find((w) => w.category === 'Blouses');
    const ownedJewel = wardrobe.find((w) => w.category === 'Indian Jewellery');
    const ownedShoe = wardrobe.find((w) => w.category === 'Ethnic Footwear');

    const usedItems = [ownedSaree?.itemName, ownedBlouse?.itemName, ownedJewel?.itemName, ownedShoe?.itemName].filter(Boolean) as string[];
    const usesWardrobe = usedItems.length > 0;

    return {
      reply: `For a wedding or reception, rich fabrics and ornate silhouettes shine brightest! Pair a heavy Banarasi or Kanjeevaram silk saree with an elbow-length brocade blouse, or opt for a velvet-accented lehenga with heritage temple jewellery.${
        usesWardrobe ? ` I've styled this with your owned wardrobe items to create a stunning designer combination!` : ''
      }`,
      outfit: {
        id: `rec_chat_wed_${Date.now()}`,
        title: 'Heritage Wedding Celebration Saree Ensemble',
        top: ownedBlouse ? ownedBlouse.itemName : 'Deep Emerald Brocade Blouse with Boat Neck & Dori Detailing',
        bottom: ownedSaree ? ownedSaree.itemName : 'Royal Magenta & Gold Kanjeevaram Silk Saree',
        clothingPieces: [
          ownedBlouse ? ownedBlouse.itemName : 'Embroidered Blouse',
          ownedSaree ? ownedSaree.itemName : 'Royal Silk Saree',
        ],
        footwear: ownedShoe ? ownedShoe.itemName : 'Gold Embellished Block Heels or Zari Mojaris',
        accessories: ownedJewel ? ownedJewel.itemName : 'Polki Choker Necklace & Matching Chandbalis',
        suggestedColors: ['Royal Magenta', 'Deep Emerald', 'Antique Gold'],
        occasion: 'Wedding / Reception Celebration',
        approximateBudget: usesWardrobe ? '₹0 (Wardrobe Owned)' : '₹3,200',
        explanation:
          'High-contrast rich jewel tones create an unforgettable wedding guest aesthetic that photographs beautifully under stage lights.',
        source: 'ai_stylist',
        usesWardrobeItems: usesWardrobe,
        wardrobeItemNames: usedItems,
        whyThisOutfit: {
          styleReason: 'Matches your preferred Traditional style with grand heritage wedding wear',
          occasionReason: 'Suitable for Wedding and Reception ceremonies',
          wardrobeReason: usesWardrobe
            ? `Uses items from your wardrobe: ${usedItems.join(', ')}`
            : 'Curated royal wedding ensemble matching your preferences',
          colorReason: 'Matches your preferred rich jewel colors with gold accents',
          budgetReason: usesWardrobe ? 'Fits your budget: ₹0 using owned wardrobe items' : 'Fits your wedding attire budget',
          points: [
            'Matches your preferred Traditional style',
            'Suitable for the selected Wedding occasion',
            usesWardrobe ? `Uses items from your wardrobe (${usedItems.slice(0, 2).join(' & ')})` : 'Opulent heritage ensemble',
            'Matches your preferred colours',
            usesWardrobe ? 'Fits your budget: ₹0 (Wardrobe Owned)' : 'Fits your budget',
          ],
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  if (lower.includes('diwali') || lower.includes('festival') || lower.includes('traditional')) {
    const ownedKurta = wardrobe.find((w) => w.category === 'Kurtas' || w.category === 'Kurta Sets');
    const ownedSaree = wardrobe.find((w) => w.category === 'Sarees');
    const ownedBlouse = wardrobe.find((w) => w.category === 'Blouses');
    const ownedShoe = wardrobe.find((w) => w.category === 'Ethnic Footwear');

    const usedItems = [
      ownedSaree?.itemName,
      ownedBlouse?.itemName,
      ownedKurta?.itemName,
      ownedShoe?.itemName,
    ].filter(Boolean) as string[];
    const usesWardrobe = usedItems.length > 0;

    return {
      reply: `For Diwali and festive occasions, celebrate with warm, luminous colors like mustard yellow, royal blue, and crimson red! An embroidered Chanderi Anarkali or silk saree paired with statement jhumkas and juttis radiates festive joy.`,
      outfit: {
        id: `rec_chat_diwali_${Date.now()}`,
        title: 'Festive Diwali Silk & Zari Ensemble',
        top: ownedBlouse?.itemName || (ownedKurta?.itemName || 'Mustard Yellow Embroidered Chanderi Kurta with Zari Work'),
        bottom: ownedSaree?.itemName || 'Ivory Flared Silk Palazzo Pants with golden hem border',
        clothingPieces: [
          ownedBlouse?.itemName || (ownedKurta?.itemName || 'Mustard Yellow Embroidered Chanderi Kurta'),
          ownedSaree?.itemName || 'Ivory Flared Silk Palazzo Pants',
        ],
        footwear: ownedShoe?.itemName || 'Handcrafted Zari Mojari Juttis',
        accessories: 'Maroon Phulkari Silk Dupatta & Kundan Chaandbalis',
        suggestedColors: ['Mustard Yellow', 'Maroon', 'Ivory White', 'Gold'],
        occasion: 'Diwali & Family Festive Gatherings',
        approximateBudget: usesWardrobe ? '₹0 (Wardrobe Owned)' : '₹2,400',
        explanation:
          'Vibrant festive tones paired with comfortable ethnic silhouettes allow you to celebrate and host comfortably all evening.',
        source: 'ai_stylist',
        usesWardrobeItems: usesWardrobe,
        wardrobeItemNames: usedItems,
        whyThisOutfit: {
          styleReason: 'Matches your preferred Traditional festive style',
          occasionReason: 'Suitable for Diwali and family festive celebrations',
          wardrobeReason: usesWardrobe ? `Uses items from your wardrobe: ${usedItems.join(', ')}` : 'Festive celebration ensemble',
          colorReason: 'Matches warm luminous festive colors',
          budgetReason: usesWardrobe ? 'Fits your budget: ₹0 using owned wardrobe items' : 'Fits your festive budget',
          points: [
            'Matches your preferred style',
            'Suitable for the selected Diwali occasion',
            usesWardrobe ? `Uses items from your wardrobe (${usedItems.slice(0, 2).join(' & ')})` : 'Warm festive palette',
            'Matches your preferred colours',
            'Fits your budget',
          ],
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  if (
    lower.includes('which blouse') ||
    lower.includes('what blouse') ||
    lower.includes('blouse should i wear') ||
    (lower.includes('blouse') && lower.includes('saree'))
  ) {
    const userBlouses = wardrobe.filter((w) => w.category === 'Blouses');
    const userSarees = wardrobe.filter((w) => w.category === 'Sarees');
    const userJewels = wardrobe.filter((w) => w.category === 'Indian Jewellery');
    const userShoes = wardrobe.filter((w) => w.category === 'Ethnic Footwear');

    if (userBlouses.length > 0) {
      const bestBlouse = userBlouses[0];
      const matchingSaree = userSarees[0];
      const neckInfo = bestBlouse.neckStyle ? `, ${bestBlouse.neckStyle}` : '';
      const sleeveInfo = bestBlouse.sleeveStyle ? `, ${bestBlouse.sleeveStyle}` : '';
      const jewel = userJewels[0];
      const shoe = userShoes[0];

      const usedItems = [bestBlouse.itemName, matchingSaree?.itemName, jewel?.itemName, shoe?.itemName].filter(Boolean) as string[];

      return {
        reply: `Checking your wardrobe, the most suitable blouse to wear is your **${bestBlouse.itemName}** (${bestBlouse.color}${neckInfo}${sleeveInfo})! The ${bestBlouse.color} tones create an exquisite, royal contrast against the drape, accentuating the zari weave. Complete the ensemble with Kundan jhumkas and mojaris!`,
        outfit: {
          id: `rec_chat_blouse_${Date.now()}`,
          title: 'Curated Saree & Blouse Ensemble',
          top: `${bestBlouse.itemName} (${bestBlouse.color}${neckInfo})`,
          bottom: matchingSaree ? `${matchingSaree.itemName} (${matchingSaree.fabric || 'Silk'} drape)` : 'Crimson Red Banarasi Saree',
          clothingPieces: [
            `${bestBlouse.itemName} (${bestBlouse.color}${neckInfo})`,
            matchingSaree ? matchingSaree.itemName : 'Crimson Red Banarasi Saree',
          ],
          footwear: shoe?.itemName || 'Embellished Champagne Gold Mojari Juttis',
          accessories: jewel?.itemName || 'Handcrafted Kundan Jhumkas & Bangles',
          suggestedColors: [bestBlouse.color, matchingSaree ? matchingSaree.color : 'Crimson Red', 'Gold'],
          occasion: 'Traditional Ceremony / Wedding',
          approximateBudget: '₹0 (Wardrobe Owned)',
          explanation: `Harmonizes your ${bestBlouse.itemName} with a rich traditional drape for an authentic designer ensemble.`,
          source: 'ai_stylist',
          usesWardrobeItems: true,
          wardrobeItemNames: usedItems,
          whyThisOutfit: {
            styleReason: 'Matches your preferred Traditional style',
            occasionReason: 'Suitable for Traditional Ceremony or Wedding celebrations',
            wardrobeReason: `Uses items from your wardrobe: ${usedItems.join(', ')}`,
            colorReason: `Combines ${bestBlouse.color} with ${matchingSaree?.color || 'Crimson Red'} for stunning contrast`,
            budgetReason: 'Fits your budget: ₹0 by styling your owned wardrobe items',
            points: [
              'Matches your preferred Traditional style',
              'Suitable for Traditional Ceremony / Wedding',
              `Uses items from your wardrobe (${bestBlouse.itemName} & ${matchingSaree?.itemName || 'Saree'})`,
              'Matches your preferred contrasting colours',
              'Fits your budget: ₹0 (Wardrobe Owned)',
            ],
          },
          createdAt: new Date().toISOString(),
        },
      };
    }

    return {
      reply: `When styling a saree, the blouse makes all the difference! A contrasting blouse—like an antique gold zari or bottle green blouse with a crimson saree, or a raw silk sweetheart neckline blouse with a pastel handloom saree—adds immediate designer flair. Pair with elbow-length sleeves and statement Kundan jewellery!`,
      outfit: {
        id: `rec_chat_saree_${Date.now()}`,
        title: 'Designer Contrast Saree & Blouse Pairing',
        top: 'Antique Gold Raw Silk Blouse with Sweetheart Neck',
        bottom: 'Crimson Red Banarasi Handloom Silk Saree',
        clothingPieces: [
          'Antique Gold Raw Silk Blouse with Sweetheart Neck',
          'Crimson Red Banarasi Handloom Silk Saree',
        ],
        footwear: 'Metallic Gold Mojari Juttis',
        accessories: 'Delicate Kundan Choker & Floral Hair Gajra',
        suggestedColors: ['Antique Gold', 'Crimson Red', 'Pearl White'],
        occasion: 'Traditional Ceremony / Puja',
        approximateBudget: '₹2,100',
        explanation:
          'Subtle contrast between a rich silk drape and an embroidered sweetheart blouse creates modern ethnic sophistication.',
        source: 'ai_stylist',
        usesWardrobeItems: false,
        wardrobeItemNames: [],
        whyThisOutfit: {
          styleReason: 'Matches your preferred Traditional style',
          occasionReason: 'Suitable for Traditional Ceremony / Puja',
          wardrobeReason: 'Recommends coordinated pieces matching your traditional aesthetics',
          colorReason: 'Classic high-contrast gold and crimson pairing',
          budgetReason: 'Fits within your traditional budget',
          points: [
            'Matches your preferred Traditional style',
            'Suitable for the selected occasion',
            'Designer contrast blouse pairing',
            'Matches your preferred colours',
            'Fits your budget',
          ],
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  if (lower.includes('college') || lower.includes('class')) {
    const ownedTop = wardrobe.find((w) => ['T-shirts', 'Shirts', 'Tops'].includes(w.category));
    const ownedBottom = wardrobe.find((w) => ['Jeans', 'Trousers'].includes(w.category));
    const ownedShoe = wardrobe.find((w) => w.category === 'Shoes');
    const usedItems = [ownedTop?.itemName, ownedBottom?.itemName, ownedShoe?.itemName].filter(Boolean) as string[];
    const usesWardrobe = usedItems.length > 0;

    return {
      reply: `For college, prioritize comfort with clean structure! A relaxed shirt paired with straight-leg denim or chinos gives you an effortless campus look that lasts all day.`,
      outfit: {
        id: `rec_chat_${Date.now()}`,
        title: 'Effortless Campus Staple',
        top: ownedTop?.itemName || 'Oversized Cotton Oxford Shirt in Crisp White',
        bottom: ownedBottom?.itemName || 'Classic Straight-Leg Mid-Blue Denim',
        clothingPieces: [
          ownedTop?.itemName || 'Oversized Cotton Oxford Shirt',
          ownedBottom?.itemName || 'Classic Straight-Leg Mid-Blue Denim',
        ],
        footwear: ownedShoe?.itemName || 'Retro Canvas Low-Top Sneakers',
        accessories: 'Laptop Canvas Tote & Digital Watch',
        suggestedColors: ['White', 'Indigo Blue', 'Warm Tan'],
        occasion: 'College & Study Sessions',
        approximateBudget: usesWardrobe ? '₹0 (Wardrobe Owned)' : '₹1,950',
        explanation: 'Breathable, practical for moving between lectures, and always in style.',
        source: 'ai_stylist',
        usesWardrobeItems: usesWardrobe,
        wardrobeItemNames: usedItems,
        whyThisOutfit: {
          styleReason: 'Matches your preferred Casual / College style',
          occasionReason: 'Suitable for College & Study Sessions',
          wardrobeReason: usesWardrobe ? `Uses items from your wardrobe: ${usedItems.join(', ')}` : 'Everyday staple styling',
          colorReason: 'Crisp white and indigo blue classic pairing',
          budgetReason: usesWardrobe ? 'Fits your budget: ₹0 using owned wardrobe items' : 'Fits your college budget',
          points: [
            'Matches your preferred style',
            'Suitable for the selected College occasion',
            usesWardrobe ? `Uses items from your wardrobe (${usedItems.join(', ')})` : 'Casual campus staples',
            'Matches your preferred colours',
            'Fits your budget',
          ],
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  if (lower.includes('party') || lower.includes('night') || lower.includes('evening')) {
    return {
      reply: `For an evening party, play with darker tones, textured fabrics, and sharp footwear. Adding subtle metallic accents or a sleek layer elevates the overall vibe instantly!`,
      outfit: {
        id: `rec_chat_${Date.now()}`,
        title: 'Modern Evening Chic',
        top: 'Cuban Collar Textured Shirt in Deep Onyx',
        bottom: 'Pleated Tapered Trousers in Slate Gray',
        clothingPieces: ['Cuban Collar Textured Shirt in Deep Onyx', 'Pleated Tapered Trousers in Slate Gray'],
        footwear: 'Polished Black Leather Loafers',
        accessories: 'Silver Chain Pendant & Leather Cardholder',
        suggestedColors: ['Black', 'Slate Gray', 'Silver'],
        occasion: 'Evening Party / Dinner Out',
        approximateBudget: '₹2,800',
        explanation: 'Monochrome depth with textured contrast creates a sharp, charismatic presence under party lighting.',
        source: 'ai_stylist',
        usesWardrobeItems: false,
        wardrobeItemNames: [],
        whyThisOutfit: {
          styleReason: 'Matches modern evening party aesthetic',
          occasionReason: 'Suitable for Evening Party / Dinner Out',
          wardrobeReason: 'Curated sharp pieces for evening events',
          colorReason: 'Monochrome black and slate gray tones',
          budgetReason: `Fits within your ${profile.budget} budget`,
          points: [
            'Matches your preferred party style',
            'Suitable for Evening Party / Dinner Out',
            'Textured evening coordination',
            'Matches modern dark tones',
            'Fits your budget',
          ],
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  if (lower.includes('black shirt') || lower.includes('black')) {
    return {
      reply: `A black shirt is the most versatile piece in modern fashion! You can pair it with olive chinos, beige linen pants, or washed grey denim for high-contrast sophistication.`,
      outfit: {
        id: `rec_chat_${Date.now()}`,
        title: 'Monochrome Contrast Pairing',
        top: 'Tailored Matte Black Shirt',
        bottom: 'Straight-Leg Chinos in Warm Beige or Sand',
        clothingPieces: ['Tailored Matte Black Shirt', 'Straight-Leg Chinos in Warm Beige'],
        footwear: 'White Minimalist Leather Sneakers or Chelsea Boots',
        accessories: 'Matte Black Sunglasses & Minimalist Watch',
        suggestedColors: ['Black', 'Warm Beige', 'White'],
        occasion: 'Smart Casual Outing',
        approximateBudget: '₹2,400',
        explanation: 'The stark contrast between jet black and warm beige creates an eye-catching, high-fashion aesthetic.',
        source: 'ai_stylist',
        usesWardrobeItems: false,
        wardrobeItemNames: [],
        whyThisOutfit: {
          styleReason: 'Matches smart casual contrast style',
          occasionReason: 'Suitable for Smart Casual Outing',
          wardrobeReason: 'Versatile staple pairing',
          colorReason: 'Eye-catching black and warm beige contrast',
          budgetReason: `Fits within your ${profile.budget} budget`,
          points: [
            'Matches your preferred style',
            'Suitable for the selected occasion',
            'High contrast statement styling',
            'Matches black and neutral tones',
            'Fits your budget',
          ],
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  return {
    reply: `I love styling for ${profile.name}! Based on your profile (${profile.genderProfile || 'Everyday'} • ${profile.preferredStyles.join(', ')}) and colors like ${profile.favoriteColors.slice(0, 3).join(', ')}, try balancing fitted silhouettes with relaxed pieces or authentic traditional ethnic layers. Ask me about Indian festive wear, saree pairings, or college outfits anytime!`,
  };
}
