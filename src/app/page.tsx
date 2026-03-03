'use client';

import { GameStatus } from '../components/GameStatus';
import { RaceTrack } from '../components/RaceTrack';
import { WinnerBanner } from '../components/WinnerBanner';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { Volume2, VolumeX } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { PrivyLoginButton } from '../components/PrivyLoginButton';

export default function Home() {
  const { isMuted, toggleMute } = useAudioEngine();
  const router = useRouter();

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

      <div className="relative z-10 flex flex-col flex-1 mt-12">
        <header className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center gap-6 relative px-4">
          <div className="bg-brick-wall py-6 px-12 rounded-3xl border-2 border-gray-900 shadow-2xl inline-block -rotate-2 transform hover:rotate-0 transition-transform duration-500">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-blue-400 neon-text-pink drop-shadow-2xl">
              WACKY RACES
            </h1>
          </div>
          <p className="text-gray-300 font-bold tracking-widest text-lg md:text-2xl uppercase mt-4 neon-text-blue opacity-90 max-w-2xl">
            Welcome to the Underground Web3 Derbies.
          </p>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl mt-2 mb-6 leading-relaxed">
            Pari-mutuel betting on high-speed crypto markets and live football events.
            Back your runner, ride the lightning, and claim the pool.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <PrivyLoginButton />
            <button
              onClick={() => router.push('/waitlist')}
              className="bg-black/80 hover:bg-gray-900 text-gray-300 border border-gray-700 font-bold px-10 py-4 rounded-full transition-all hover:scale-105"
            >
              Join Waitlist
            </button>
          </div>
        </header>

        {/* Live Games Teaser (Spectator Mode) */}
        <div className="max-w-5xl mx-auto w-full px-4 mt-20 mb-32 flex flex-col gap-6 relative">
          <div className="flex justify-between items-end mb-4 px-4">
            <div>
              <h2 className="text-3xl font-black italic text-white mb-1">LIVE SPECTATOR MODE</h2>
              <p className="text-gray-400 text-sm tracking-widest uppercase">Watch the current pool without staking</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMute}
                className="w-10 h-10 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer text-gray-400 hover:text-white group"
              >
                {isMuted ? <VolumeX className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform text-green-400" />}
              </button>
              <GameStatus />
            </div>
          </div>

          <div className="relative pointer-events-none opacity-80">
            <WinnerBanner />
            <RaceTrack />
          </div>        </div>

        {/* Informational Sections */}
        <section className="max-w-7xl mx-auto mt-24 mb-16 px-4 relative z-10 w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black italic neon-text-blue text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 inline-block mb-4">How It Works</h2>
            <div className="w-24 h-1 bg-blue-500 mx-auto rounded-full neon-text-blue opacity-50"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-gray-900 via-blue-500/30 to-gray-900 -z-10 translate-y-[-50%]"></div>

            <div className="bg-black/80 backdrop-blur-md border border-gray-800 rounded-2xl p-8 text-center hover:border-blue-500/50 transition-colors group">
              <div className="w-16 h-16 rounded-full bg-blue-900/30 border border-blue-500/50 text-blue-400 font-black text-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-black transition-all">1</div>
              <h3 className="text-xl font-bold mb-3 text-white">Choose Your Tier</h3>
              <p className="text-gray-400 text-sm">Select from Casual, Pro, or High Roller tracks. Different tracks run simultaneously with segregated liquidity pools.</p>
            </div>

            <div className="bg-black/80 backdrop-blur-md border border-gray-800 rounded-2xl p-8 text-center hover:border-purple-500/50 transition-colors group">
              <div className="w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/50 text-purple-400 font-black text-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-black transition-all">2</div>
              <h3 className="text-xl font-bold mb-3 text-white">Place Your Bet</h3>
              <p className="text-gray-400 text-sm">Review the contenders and stage your prediction. All bets go into a pari-mutuel pool—you're playing against other traders, not the house.</p>
            </div>

            <div className="bg-black/80 backdrop-blur-md border border-gray-800 rounded-2xl p-8 text-center hover:border-pink-500/50 transition-colors group">
              <div className="w-16 h-16 rounded-full bg-pink-900/30 border border-pink-500/50 text-pink-400 font-black text-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-black transition-all">3</div>
              <h3 className="text-xl font-bold mb-3 text-white">Ride The Lightning</h3>
              <p className="text-gray-400 text-sm">Watch the live 5-minute race powered by real-world token volatility or live sports data. Winners split the net pool automatically via Smart Contract.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto mt-16 mb-24 px-4 relative z-10 w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black italic neon-text-pink text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600 inline-block mb-4">Underground Intel (FAQ)</h2>
            <div className="w-24 h-1 bg-pink-500 mx-auto rounded-full neon-text-pink opacity-50"></div>
          </div>

          <div className="space-y-4 text-left">
            {[
              { q: "Is this real money?", a: "Currently, Wacky Races runs entirely on the Solana Devnet/Testnet. You do not wager real money. It is a proof of concept." },
              { q: "How is player movement calculated?", a: "In Crypto Mode, movement is driven by 1-second interval Binance websocket price ticks. In Match Day Mode, movement is driven by live football events evaluated over a rolling 30-second window." },
              { q: "What is Pari-Mutuel betting?", a: "Instead of fixed odds set by a bookmaker, all bets placed enter a shared pool. The house takes a slight rake, and the remaining pool is split entirely between those who backed the winning contender, proportionally to their bet size." },
              { q: "What happens if a race fails to start?", a: "If the minimum player liquidity threshold map is not met before the timer expires, the race cancels and all staged bets are automatically refunded to your Wallet." }
            ].map((faq, i) => (
              <div key={i} className="bg-black/60 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors">
                <h4 className="text-lg font-bold text-gray-200 mb-2 font-mono flex items-start gap-3">
                  <span className="text-pink-500">{'>'}</span> {faq.q}
                </h4>
                <p className="text-gray-400 text-sm pl-6 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

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
  );
}
