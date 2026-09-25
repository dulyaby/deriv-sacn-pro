import React, { useState } from 'react';
import {
  Activity,
  Volume2,
  VolumeX,
  KeyRound,
  Crown,
  User,
  ShieldCheck,
  Zap,
  ChevronDown,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useScanner } from '../context/ScannerContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const {
    activeTab,
    setActiveTab,
    isMuted,
    toggleMute,
    latency,
    isConnected,
    setIsSubscriptionModalOpen,
    setIsTokenModalOpen
  } = useScanner();

  const { user, isAuthenticated, logout, activeTier, daysRemaining } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const tierLabels = {
    FREE: 'Free Tier',
    WEEKLY: 'Weekly Pass',
    MONTHLY: 'Pro Trader',
    YEARLY: 'VIP Institutional'
  };

  const tierColors = {
    FREE: 'text-slate-400 border-slate-700 bg-slate-800/60',
    WEEKLY: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
    MONTHLY: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    YEARLY: 'text-amber-400 border-amber-500/40 bg-amber-950/40'
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090D14]/95 backdrop-blur-md px-4 lg:px-6 py-3 flex items-center justify-between">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-6">
        <a href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950 font-black text-sm">
            D
          </div>
          <span className="font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            DerivScan<span className="text-cyan-400">Pro</span>
          </span>
        </a>

        {/* WebSocket Connection Status */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-mono">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span>Deriv WS: {isConnected ? 'LIVE' : 'RECONNECTING'}</span>
          <span className="text-slate-600">·</span>
          <span className="tabular-nums text-cyan-400">{latency}ms</span>
        </div>
      </div>

      {/* Zone 2: Primary Navigation Tabs */}
      <nav className="hidden xl:flex items-center gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800/80">
        <button
          onClick={() => setActiveTab('SCANNER')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'SCANNER'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Signals Feed
        </button>

        <button
          onClick={() => setActiveTab('DIGIT_MATRIX')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'DIGIT_MATRIX'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Digit Frequencies
        </button>

        <button
          onClick={() => setActiveTab('CHART')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'CHART'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Chart & EMA
        </button>

        <button
          onClick={() => setActiveTab('SPIKE_HUNTER')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'SPIKE_HUNTER'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Boom/Crash Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('SCREENER')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'SCREENER'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Market Screener
        </button>

        <button
          onClick={() => setActiveTab('BOT_TRADER')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
            activeTab === 'BOT_TRADER'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Bot Trader
        </button>
      </nav>

      {/* Zone 3: Actions & Profile */}
      <div className="flex items-center gap-2.5">
        {/* Sound Toggle */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute alerts' : 'Mute audio alerts'}
          className={`p-2 rounded-lg border transition-colors ${
            isMuted
              ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/50'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Deriv API Key Button */}
        <button
          onClick={() => setIsTokenModalOpen(true)}
          title="Connect Deriv API Token"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-800/90 text-xs text-slate-300 font-medium transition-all"
        >
          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
          <span>Deriv API</span>
        </button>

        {/* Tier Status / Upgrade Button */}
        <button
          onClick={() => setIsSubscriptionModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${tierColors[activeTier]} hover:scale-[1.02]`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>{tierLabels[activeTier]}</span>
          {activeTier !== 'FREE' && daysRemaining > 0 && (
            <span className="text-[10px] opacity-80">({daysRemaining}d)</span>
          )}
        </button>

        {/* User Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-all"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <span className="hidden sm:inline max-w-[100px] truncate font-medium">{user?.name || 'Account'}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl bg-[#0F172A] border border-slate-800 shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <div className="font-semibold text-white truncate">{user?.name}</div>
                <div className="text-slate-400 text-[11px] truncate">{user?.email}</div>
                <div className="mt-1 flex items-center gap-1.5 text-emerald-400 text-[11px]">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Tier: {activeTier}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setIsSubscriptionModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/70 text-slate-200 text-left transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Subscription Plans</span>
              </button>

              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setIsTokenModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/70 text-slate-200 text-left transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Deriv Credentials</span>
              </button>

              <div className="border-t border-slate-800/80 my-1" />

              <div className="px-3 py-1.5 text-[10px] text-slate-400 bg-slate-950/60 rounded-lg border border-slate-800/80 mb-1">
                <span className="text-slate-500 block">Architect & Developer:</span>
                <span className="text-cyan-400 font-bold">Qareem Full Stack Developer</span>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-950/30 text-rose-400 text-left transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-center justify-center transition-colors"
                >
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
