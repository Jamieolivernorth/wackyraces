'use client';

import { GameStatus } from '../components/GameStatus';
import { RaceTrack } from '../components/RaceTrack';
import { BettingPanel } from '../components/BettingPanel';
import { RaceHistoryTicker } from '../components/RaceHistoryTicker';
import { SchedulePanel } from '../components/SchedulePanel';
import { WinnerBanner } from '../components/WinnerBanner';
import { AlphaLeakPanel } from '../components/AlphaLeakPanel';
import { BankingPanel } from '../components/BankingPanel';
import { BettingSlip } from '../components/BettingSlip';
import { WalletSync } from '../components/WalletSync';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { Volume2, VolumeX } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Home() {
  const { isMuted, toggleMute } = useAudioEngine();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans background-gradient flex flex-col">
      <WalletSync />
      {/* Top Banner Ticker */}
      <RaceHistoryTicker />

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-6 lg:p-8">

        {/* Header section */}
        <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-6 relative">

          <div className="flex flex-col flex-1 pl-4 md:pl-0 border-l-4 border-blue-500 md:border-none">
            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 relative inline-block drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">
              WACKY RACES
            </h1>
            <p className="text-gray-400 font-medium tracking-wide text-sm md:text-base uppercase mt-1">
              Testnet Web3 Derbies
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
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .background-gradient {
          background: radial-gradient(circle at 15% 50%, rgba(20, 10, 40, 0.4), transparent 50%),
                      radial-gradient(circle at 85% 30%, rgba(10, 30, 60, 0.3), transparent 50%),
                      radial-gradient(circle at 50% 80%, rgba(40, 10, 30, 0.4), transparent 50%),
                      #0f0c1b;
        }
      `}} />
    </div>
  );
}
