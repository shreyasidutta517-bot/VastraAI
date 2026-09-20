import React, { useState } from 'react';
import { ActiveTab } from '../types.js';
import { Sparkles, LayoutDashboard, MessageSquare, Shirt, Bookmark, User, Menu, X } from 'lucide-react';
import { VastraLogo } from './VastraLogo.js';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  savedCount: number;
  wardrobeCount: number;
  onOpenVivaModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  wardrobeCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stylist' as ActiveTab, label: 'AI Stylist', icon: MessageSquare, highlight: true },
    { id: 'wardrobe' as ActiveTab, label: 'Wardrobe', icon: Shirt, badge: wardrobeCount },
    { id: 'saved' as ActiveTab, label: 'Saved Outfits', icon: Bookmark, badge: savedCount },
    { id: 'preferences' as ActiveTab, label: 'Profile & Style', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8EDFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <VastraLogo
            size="sm"
            showTagline={true}
            taglineClassName="hidden sm:block"
            onClick={() => setActiveTab('landing')}
          />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#4A6CF7] text-white shadow-xs'
                      : 'text-[#20243A] hover:text-[#4A6CF7] hover:bg-[#EEF3FF]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.highlight && !isActive ? 'text-[#E98BAF]' : ''}`} />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/25 text-white' : 'bg-[#EEF3FF] text-[#4A6CF7]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Secondary Actions: Gemini Status */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[#EEF3FF] text-[#4A6CF7] border border-[#D6E2FF]">
              <span className="w-2 h-2 rounded-full bg-[#4A6CF7] animate-pulse" />
              <span className="font-semibold">AI Stylist Ready</span>
              <span className="text-[#5E6482]">• Gemini 3.8</span>
            </div>

            <button
              onClick={() => setActiveTab('stylist')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FFF0F5] text-[#E98BAF] border border-[#FAD0DF] hover:bg-[#FCE4EC] hover:text-[#D6769B] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E98BAF]" />
              <span>Ask Stylist</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#20243A] hover:bg-[#EEF3FF] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8EDFB] bg-white px-4 pt-3 pb-5 space-y-1 shadow-sm">
          <button
            id="mobile-tab-landing"
            onClick={() => {
              setActiveTab('landing');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'landing' ? 'bg-[#4A6CF7] text-white' : 'text-[#20243A] hover:bg-[#EEF3FF]'
            }`}
          >
            <span>Home</span>
          </button>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#4A6CF7] text-white' : 'text-[#20243A] hover:bg-[#EEF3FF]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/25 text-white' : 'bg-[#EEF3FF] text-[#4A6CF7]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

