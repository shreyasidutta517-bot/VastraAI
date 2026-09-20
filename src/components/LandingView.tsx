import React from 'react';
import { ActiveTab } from '../types.js';
import { Sparkles, ArrowRight, Shirt, MessageSquare, SlidersHorizontal } from 'lucide-react';
import { VastraLogoMark } from './VastraLogo.js';

interface LandingViewProps {
  onGetStarted: () => void;
  onTryStylist: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onGetStarted,
  onTryStylist,
  setActiveTab,
}) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-14 rounded-3xl bg-gradient-to-b from-[#EEF3FF]/70 via-white to-white border border-[#E4EDFF] px-6 sm:px-12 shadow-xs">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0F5] border border-[#FAD0DF] text-[#C25480] text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#E98BAF] animate-pulse" />
            <span>Style that feels uniquely yours.</span>
          </div>

          <div className="flex flex-col items-center justify-center gap-3">
            <VastraLogoMark
              size={48}
              withContainer={true}
              containerClassName="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-xs"
              idPrefix="landing-hero-mark"
            />
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#20243A] tracking-tight leading-[1.12]">
              <span>Vastra</span>
              <span className="text-[#4A6CF7] ml-[2px]">AI</span>
            </h1>
          </div>

          <p className="font-display text-lg sm:text-2xl text-[#4A6CF7] font-medium italic -mt-2">
            Your Personal AI Fashion Stylist
          </p>

          <p className="text-base sm:text-lg text-[#5E6482] font-normal leading-relaxed max-w-2xl mx-auto">
            Experience intelligent generative styling that curates tailored outfit combinations based on your personal taste, occasion, budget, and real wardrobe availability.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              id="hero-get-started-btn"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#4A6CF7] text-white font-semibold text-sm shadow-sm hover:bg-[#3B5BD8] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              id="hero-try-stylist-btn"
              onClick={onTryStylist}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#FFF0F5] text-[#C25480] font-semibold text-sm border border-[#FAD0DF] shadow-2xs hover:bg-[#FCE4EC] hover:text-[#A33B65] transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-[#E98BAF]" />
              <span>Try AI Stylist</span>
            </button>
          </div>

          {/* Quick Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 border-t border-[#E8EDFB] text-left">
            <div className="p-3.5 bg-white rounded-2xl border border-[#E4EDFF] shadow-2xs">
              <span className="text-[11px] font-bold text-[#5E6482] uppercase tracking-wider block">Engine</span>
              <span className="text-xs sm:text-sm font-semibold text-[#20243A]">Gemini 3.8 Flash</span>
            </div>
            <div className="p-3.5 bg-white rounded-2xl border border-[#E4EDFF] shadow-2xs">
              <span className="text-[11px] font-bold text-[#5E6482] uppercase tracking-wider block">Context</span>
              <span className="text-xs sm:text-sm font-semibold text-[#20243A]">Wardrobe & Budget</span>
            </div>
            <div className="p-3.5 bg-white rounded-2xl border border-[#E4EDFF] shadow-2xs">
              <span className="text-[11px] font-bold text-[#5E6482] uppercase tracking-wider block">Intelligence</span>
              <span className="text-xs sm:text-sm font-semibold text-[#20243A]">Feedback Loop</span>
            </div>
            <div className="p-3.5 bg-white rounded-2xl border border-[#E4EDFF] shadow-2xs">
              <span className="text-[11px] font-bold text-[#5E6482] uppercase tracking-wider block">Traditional</span>
              <span className="text-xs sm:text-sm font-semibold text-[#20243A]">Saree & Ethnic Pairing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase: Fashion Workflow Cards */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#20243A]">
            Intelligent Fashion Workflows
          </h2>
          <p className="text-sm text-[#5E6482] max-w-xl mx-auto">
            Explore how each component of VastraAI integrates to deliver a personalized, real-time styling consultation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div
            id="feature-card-preferences"
            onClick={() => setActiveTab('preferences')}
            className="group cursor-pointer rounded-3xl bg-white p-7 border border-[#E4EDFF] shadow-2xs hover:shadow-md hover:border-[#4A6CF7]/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF3FF] border border-[#D6E2FF] text-[#4A6CF7] flex items-center justify-center">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#20243A] group-hover:text-[#4A6CF7] transition-colors">
                1. Personalized Profile & Style
              </h3>
              <p className="text-xs sm:text-sm text-[#5E6482] leading-relaxed">
                Define your aesthetic (Streetwear, Minimal, Traditional, Casual), gender profile, budget range, and preferred colors.
              </p>
            </div>
            <div className="pt-6 flex items-center text-xs font-semibold text-[#4A6CF7] group-hover:translate-x-0.5 transition-transform">
              <span>Set Preferences</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div
            id="feature-card-stylist"
            onClick={() => setActiveTab('stylist')}
            className="group cursor-pointer rounded-3xl bg-gradient-to-br from-[#20243A] to-[#2B304D] p-7 text-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-[#3A4064]"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5]/15 border border-[#FFF0F5]/25 text-[#E98BAF] flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-[#E98BAF] transition-colors">
                2. AI Personal Stylist
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Ask questions like "Which blouse goes with my Banarasi saree?" or "College look under ₹2000" for complete styled looks.
              </p>
            </div>
            <div className="pt-6 flex items-center text-xs font-semibold text-[#E98BAF] group-hover:translate-x-0.5 transition-transform">
              <span>Start Stylist Consultation</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div
            id="feature-card-wardrobe"
            onClick={() => setActiveTab('wardrobe')}
            className="group cursor-pointer rounded-3xl bg-white p-7 border border-[#E4EDFF] shadow-2xs hover:shadow-md hover:border-[#4A6CF7]/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] border border-[#FAD0DF] text-[#C25480] flex items-center justify-center">
                <Shirt className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#20243A] group-hover:text-[#4A6CF7] transition-colors">
                3. Virtual Wardrobe Mixing
              </h3>
              <p className="text-xs sm:text-sm text-[#5E6482] leading-relaxed">
                Catalog your real sarees, kurtas, tops, trousers, and footwear. Let Gemini assemble harmonious outfits directly from what you own.
              </p>
            </div>
            <div className="pt-6 flex items-center text-xs font-semibold text-[#4A6CF7] group-hover:translate-x-0.5 transition-transform">
              <span>Mix Wardrobe</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Flow Section */}
      <section className="p-8 sm:p-10 rounded-3xl bg-[#EEF3FF]/70 border border-[#D6E2FF] text-[#20243A] space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4A6CF7] bg-white px-3 py-1 rounded-full border border-[#D6E2FF]">
            System Design & Data Pipeline
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#20243A]">
            End-to-End Styling Flow
          </h2>
          <p className="text-xs sm:text-sm text-[#5E6482] max-w-lg mx-auto">
            Intelligent multi-step styling engine combining your profile, wardrobe inventory, and real-time AI reasoning.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center pt-2">
          <div className="p-3.5 bg-white rounded-2xl border border-[#E4EDFF] shadow-2xs">
            <span className="text-[#4A6CF7] text-[10px] font-bold block mb-1">STEP 1</span>
            <span className="text-xs font-semibold text-[#20243A]">Taste & Fit</span>
          </div>
          <div className="p-3.5 bg-white rounded-2xl border border-[#E4EDFF] shadow-2xs">
            <span className="text-[#4A6CF7] text-[10px] font-bold block mb-1">STEP 2</span>
            <span className="text-xs font-semibold text-[#20243A]">Style Profile</span>
          </div>
          <div className="p-3.5 bg-white rounded-2xl border border-[#E4EDFF] shadow-2xs">
            <span className="text-[#4A6CF7] text-[10px] font-bold block mb-1">STEP 3</span>
            <span className="text-xs font-semibold text-[#20243A]">Wardrobe Sync</span>
          </div>
          <div className="p-3.5 bg-white rounded-2xl border border-[#E4EDFF] shadow-2xs">
            <span className="text-[#E98BAF] text-[10px] font-bold block mb-1">STEP 4</span>
            <span className="text-xs font-semibold text-[#4A6CF7]">Gemini Reasoning</span>
          </div>
          <div className="p-3.5 bg-white rounded-2xl border border-[#E4EDFF] shadow-2xs">
            <span className="text-[#4A6CF7] text-[10px] font-bold block mb-1">STEP 5</span>
            <span className="text-xs font-semibold text-[#20243A]">Feedback Loop</span>
          </div>
          <div className="p-3.5 bg-white rounded-2xl border border-[#E4EDFF] shadow-2xs">
            <span className="text-[#4A6CF7] text-[10px] font-bold block mb-1">STEP 6</span>
            <span className="text-xs font-semibold text-[#20243A]">Outfit Storage</span>
          </div>
        </div>

        <div className="pt-4 text-center">
          <button
            id="landing-dashboard-btn"
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#4A6CF7] text-white font-bold text-xs hover:bg-[#3B5BD8] transition-all shadow-sm"
          >
            <span>Open VastraAI Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};

