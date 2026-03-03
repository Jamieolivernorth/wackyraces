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
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { Volume2, VolumeX } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Home() {
  const { isMuted, toggleMute } = useAudioEngine();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-pink-500/30 font-sans relative flex flex-col overflow-hidden">
      {/* Background Blended Layers */}
      <div
        className="absolute inset-0 z-0 opacity-15 mix-blend-screen pointer-events-none bg-[url('/hero-track.jpg')] bg-cover bg-center"
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-black/40 to-black pointer-events-none" />

      {/* Vertical Track Lines Accent */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex justify-center gap-32 overflow-hidden mix-blend-overlay">
        <div className="w-[2px] h-[200vh] bg-green-500 animate-sweep-fast" />
        <div className="w-[2px] h-[200vh] bg-blue-500 animate-sweep-slow" />
        <div className="w-[2px] h-[200vh] bg-pink-500 animate-sweep-medium" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <WalletSync />
        {/* Top Banner Ticker */}
        <RaceHistoryTicker />

        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">

          {/* Header section */}
          <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-6 relative">

            <div className="flex flex-col flex-1 pl-4 md:pl-0">
              <div className="bg-brick-wall py-4 px-6 rounded-2xl border border-gray-900 shadow-2xl inline-block -rotate-2 transform hover:rotate-0 transition-transform duration-500">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-blue-400 neon-text-pink drop-shadow-2xl">
                  WACKY RACES
                </h1>
              </div>
              <p className="text-gray-400 font-bold tracking-widest text-sm md:text-base uppercase mt-3 ml-2 neon-text-blue opacity-80">
                Welcome to the Underground Web3 Derbies
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-4">
              <button
                onClick={toggleMute}
                className="w-12 h-12 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer z-50 text-gray-300 hover:text-white group"
                title={isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
              >
                {isMuted ? <VolumeX className="w-6 h-6 group-hover:scale-110 transition-transform" /> : <Volume2 className="w-6 h-6 group-hover:scale-110 transition-transform text-green-400" />}
              </button>
              <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-500 transition-colors !rounded-full !h-12 !px-6 !font-bold" />
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
              <BankingPanel />
              <BettingSlip />
              <BettingPanel />
            </div>

          </main>



          {/* Footer */}
          <footer className="border-t border-gray-900 bg-black/50 py-8 lg:py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between opacity-50 text-xs">
              <div className="flex font-black italic tracking-widest gap-2">
                <span className="text-pink-500">WACKY</span><span className="text-blue-500">RACES</span>
              </div>
              <div className="mt-4 md:mt-0">© {new Date().getFullYear()} All Rights Reserved. Not financial advice.</div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
