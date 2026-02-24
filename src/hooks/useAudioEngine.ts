import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const useAudioEngine = () => {
    const phase = useGameStore((state) => state.phase);

    // Audio Refs
    const gunRef = useRef<HTMLAudioElement | null>(null);
    const crowdRef = useRef<HTMLAudioElement | null>(null);
    const hoofsRef = useRef<HTMLAudioElement | null>(null);
    const musicRef = useRef<HTMLAudioElement | null>(null);

    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        // Initialize audio objects using CC0 / generic URLs for MVP validation
        gunRef.current = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=shotgun-firing-4369.mp3');
        crowdRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/11/02/audio_fb49a71a36.mp3?filename=crowd-cheer-and-applause-120010.mp3');
        hoofsRef.current = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_82c2195f00.mp3?filename=horse-galloping-2-34907.mp3');
        musicRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/10/25/audio_5145cd68fb.mp3?filename=racing-suspense-116037.mp3');

        // Setup loops and volumes
        if (crowdRef.current) {
            crowdRef.current.loop = true;
            crowdRef.current.volume = 0.4;
        }
        if (hoofsRef.current) {
            hoofsRef.current.loop = true;
            hoofsRef.current.volume = 0.6;
        }
        if (musicRef.current) {
            musicRef.current.loop = true;
            musicRef.current.volume = 0.3;
        }

        return () => {
            // Cleanup on unmount
            [gunRef, crowdRef, hoofsRef, musicRef].forEach(ref => {
                if (ref.current) {
                    ref.current.pause();
                    ref.current.src = "";
                }
            });
        };
    }, []);

    useEffect(() => {
        if (isMuted) {
            [gunRef, crowdRef, hoofsRef, musicRef].forEach(ref => {
                if (ref.current) ref.current.muted = true;
            });
            return;
        } else {
            [gunRef, crowdRef, hoofsRef, musicRef].forEach(ref => {
                if (ref.current) ref.current.muted = false;
            });
        }

        // Audio Engine Logic based on Game Phase
        if (phase === 'RACING' || phase === 'PHOTO_FINISH') {
            gunRef.current?.play().catch(() => { }); // starting gun
            crowdRef.current?.play().catch(() => { }); // cheering loop
            hoofsRef.current?.play().catch(() => { }); // galloping loop
            // musicRef.current?.play().catch(() => { }); // vibe music loop
        } else if (phase === 'FINISHED') {
            hoofsRef.current?.pause(); // stop horses immediately

            // Let crowd finish fade out eventually
            if (crowdRef.current) crowdRef.current.volume = 0.8;

            // Let music play through the finale
        } else {
            // Betting / Locked phases
            hoofsRef.current?.pause();
            crowdRef.current?.pause();
            if (musicRef.current) musicRef.current.pause();
        }
    }, [phase, isMuted]);

    const toggleMute = () => setIsMuted(prev => !prev);

    return { isMuted, toggleMute };
};
