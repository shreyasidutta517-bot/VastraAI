import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, OutfitRecommendation } from '../types.js';
import { askAIStylist, sendFeedback, saveOutfit } from '../api.js';
import { OutfitCard } from './OutfitCard.js';
import { Send, Sparkles, RefreshCw, MessageSquare, Bot, User as UserIcon } from 'lucide-react';

interface AIStylistViewProps {
  profile: UserProfile;
  onOutfitSaved: (outfit: OutfitRecommendation) => void;
  savedOutfitIds: Set<string>;
}

const QUICK_PROMPTS = [
  'Which blouse should I wear with this saree?',
  'What should I wear to college today?',
  'Durga Puja Ashtami saree & blouse look',
  'Diwali festive outfit with matching jewellery',
  'Wedding guest saree and blouse pairing',
  'What blouse goes with a red Banarasi saree?',
  'Suggest a traditional Indian outfit under ₹2500',
  'Suggest a smart casual party outfit',
];

export const AIStylistView: React.FC<AIStylistViewProps> = ({
  profile,
  onOutfitSaved,
  savedOutfitIds,
}) => {
  const genderNotice = profile.genderProfile && profile.genderProfile !== 'Prefer not to say' 
    ? ` (${profile.genderProfile} profile)` 
    : '';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm_welcome',
      role: 'assistant',
      content: `Namaste & Hello ${profile.name}! 👋 I am your AI Personal Stylist. I've loaded your profile${genderNotice} with ${profile.preferredStyles.slice(0, 3).join(', ')} styling and budget around ${profile.budget}. Ask me anything about Indian festive wear, saree & blouse pairings, Durga Puja or wedding styling, or everyday college looks!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setInputMessage('');
    setErrorMsg(null);

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build conversation history for context
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await askAIStylist(text, history, profile.id);

      const assistantMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        outfit: response.outfit,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMsg('Failed to connect to AI Stylist. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: "I'm having a brief communication hiccup with the styling brain. Please re-send or pick one of the quick suggestions!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFromCard = async (outfit: OutfitRecommendation) => {
    await saveOutfit(outfit, 'Saved from AI Stylist Consultation', profile.id);
    onOutfitSaved(outfit);
  };

  const handleFeedbackFromCard = async (outfitId: string, outfitTitle: string, type: 'like' | 'dislike') => {
    await sendFeedback(outfitId, outfitTitle, type, profile.id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#20243A] via-[#2A3152] to-[#4A6CF7] text-white rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[#FFF0F5] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#E98BAF]" />
            <span>Interactive VastraAI Consultation</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            VastraAI Stylist
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80">
            Real-time outfit generation powered by Gemini 3.8 Flash, conditioned on your personal style profile.
          </p>
        </div>

        <div className="p-3.5 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/15 text-xs text-blue-100 space-y-1 shrink-0">
          <span className="font-bold text-[#FFF0F5] block">Current Prompt Context:</span>
          <div>Styles: <span className="text-white font-medium">{profile.preferredStyles.slice(0, 3).join(', ')}</span></div>
          <div>Budget: <span className="text-white font-medium">{profile.budget}</span></div>
        </div>
      </div>

      {/* Quick Prompts Carousel */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#5E6482] uppercase tracking-wider block">
          Suggested Fashion Prompts:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              id={`quick-prompt-${idx}`}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#D6E2FF] text-[#20243A] text-xs font-medium hover:border-[#4A6CF7] hover:bg-[#EEF3FF] hover:text-[#4A6CF7] transition-all whitespace-nowrap shadow-2xs shrink-0"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl border border-[#E4EDFF] shadow-xs overflow-hidden flex flex-col h-[580px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6 bg-[#FAFBFF]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser ? 'bg-[#4A6CF7] text-white shadow-2xs' : 'bg-[#FFF0F5] text-[#C25480] border border-[#FAD0DF]'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble & Content */}
                <div className={`space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#4A6CF7] text-white rounded-tr-none shadow-xs'
                        : 'bg-white border border-[#E4EDFF] text-[#20243A] shadow-2xs rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                    <span
                      className={`text-[10px] block mt-1.5 ${
                        isUser ? 'text-blue-100 text-right' : 'text-[#5E6482]'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* If assistant attached a structured Outfit Recommendation */}
                  {msg.outfit && (
                    <div className="w-full sm:w-[480px]">
                      <OutfitCard
                        outfit={msg.outfit}
                        isSaved={savedOutfitIds.has(msg.outfit.id)}
                        onSave={handleSaveFromCard}
                        onFeedback={handleFeedbackFromCard}
                        showSaveButton={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-md">
              <div className="w-9 h-9 rounded-xl bg-[#FFF0F5] text-[#C25480] border border-[#FAD0DF] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin text-[#E98BAF]" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E4EDFF] text-[#5E6482] text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4A6CF7]" />
                <span>VastraAI Stylist is analyzing color balance and wardrobe harmony...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#E4EDFF]">
          {errorMsg && (
            <div className="text-xs text-rose-600 mb-2 font-medium">
              {errorMsg}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="stylist-input"
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask your stylist (e.g. 'Which blouse should I wear with a red Banarasi saree?')..."
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-2xl border border-[#D6E2FF] text-sm text-[#20243A] focus:outline-none focus:ring-2 focus:ring-[#4A6CF7] bg-[#FAFBFF]"
            />
            <button
              id="stylist-send-btn"
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-3 rounded-2xl bg-[#4A6CF7] text-white hover:bg-[#3B5BD8] disabled:opacity-40 transition-all shrink-0 shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
