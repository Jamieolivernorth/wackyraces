'use client';

import { GameStatus } from '@/components/GameStatus';
import { RaceTrack } from '@/components/RaceTrack';
import { BettingPanel } from '@/components/BettingPanel';
import { RaceHistoryTicker } from '@/components/RaceHistoryTicker';
import { SchedulePanel } from '@/components/SchedulePanel';
import { WinnerBanner } from '@/components/WinnerBanner';
import { AlphaLeakPanel } from '@/components/AlphaLeakPanel';
import { BankingPanel } from '@/components/BankingPanel';
import { BettingSlip } from '@/components/BettingSlip';
import { WalletSync } from '@/components/WalletSync';
import { PrivateRaceLedger } from '@/components/PrivateRaceLedger';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { Volume2, VolumeX } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useGameStore } from '@/store/gameStore';
import { useEffect } from 'react';

export default function MemeGame() {
  const { isMuted, toggleMute } = useAudioEngine();
  const setGameMode = useGameStore((state) => state.setGameMode);
  const onchainEnabled = useGameStore((state) => state.onchainEnabled);
  const isPrivateRace = useGameStore((state) => state.isPrivateRace);

  useEffect(() => {
    // Force the game store into meme mode when we hit this page
    setGameMode('MEME');
  }, [setGameMode]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-pink-500/30 font-sans relative flex flex-col overflow-x-hidden">
      {/* Background Blended Layers */}
      <div
        className="absolute inset-x-0 top-0 h-[100vh] z-0 opacity-15 mix-blend-screen pointer-events-none bg-[url('/hero-track.jpg')] bg-cover bg-top"
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-black/40 to-black pointer-events-none" />

      {/* Vertical Track Lines Accent */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none flex justify-center gap-16 md:gap-32 overflow-hidden mix-blend-overlay">
        <div className="w-[1px] md:w-[2px] h-[200vh] bg-green-500 animate-sweep-fast" />
        <div className="w-[1px] md:w-[2px] h-[200vh] bg-blue-500 animate-sweep-slow" />
        <div className="w-[1px] md:w-[2px] h-[200vh] bg-pink-500 animate-sweep-medium" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 w-full max-w-[100vw]">
        <WalletSync />
        {/* Top Banner Ticker */}
        <RaceHistoryTicker />

        {/* Main Content Area */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full">

          {/* Header section */}
          <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4 md:gap-6 relative w-full">

            <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 w-full">
              <p className="text-gray-400 font-bold tracking-widest text-[10px] sm:text-xs md:text-sm uppercase mt-2 md:mt-3 md:ml-2 neon-text-pink opacity-80">
                Welcome to Memecoin Melee
              </p>
            </div>

            <div className="shrink-0 flex items-center justify-center flex-wrap gap-2 md:gap-4 w-full md:w-auto mt-2 md:mt-0">
              <button
                onClick={toggleMute}
                className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer z-50 text-gray-300 hover:text-white group"
                title={isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
              >
                {isMuted ? <VolumeX className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform text-green-400" />}
              </button>
              {onchainEnabled && <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-500 transition-colors !rounded-full !h-10 md:!h-12 !px-4 md:!px-6 !text-sm md:!text-base !font-bold" />}
              <GameStatus />
            </div>
          </header>

          {/* Main Content Grid */}
          <main className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">

            {/* Left Column: Track & Schedule */}
            <div className="xl:col-span-8 flex flex-col gap-6 relative">

              {/* The Track Container */}
              <div className="relative">
                <WinnerBanner />
                <RaceTrack />
              </div>

              {/* Sub Track Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SchedulePanel />
                <AlphaLeakPanel />
              </div>
            </div>

            {/* Right Column: Betting Panel */}
            <div className="xl:col-span-4 sticky top-6 flex flex-col gap-6">
              {onchainEnabled && <BankingPanel />}
              {isPrivateRace ? (
                <PrivateRaceLedger />
              ) : (
                <>
                  <BettingSlip />
                  <BettingPanel />
                </>
              )}
            </div>

          </main>



          {/* Footer */}
          <footer className="border-t border-gray-900 bg-black/50 py-8 lg:py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between opacity-50 text-xs">
              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <img src="/logo-white.png" alt="Wacky Races Logo" className="h-6 w-auto" />
              </div>
              <div className="mt-4 md:mt-0">© {new Date().getFullYear()} All Rights Reserved. Not financial advice.</div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
