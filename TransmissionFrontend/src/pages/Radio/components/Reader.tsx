import type { Frequency, Transmission } from "@/functions/functions";
import { useEffect, useRef, useState } from "react";

interface ReaderProps {
    frequency: Frequency;
    transmissions: Transmission[];
}

export function Reader({ frequency, transmissions }: ReaderProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const lastSpokenIdRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Speak a transmission (side effect, not state)
    const speakTransmission = (transmission: Transmission) => {
        if (!isSpeaking) return;
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const textToRead = `Transmission on frequency ${frequency.number} kHz.\nType: ${transmission.transmission_type}. Code: ${transmission.code}`;
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = "en-US";
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Helper to get the currently active transmission
    const getActiveTransmission = () => {
        const now = new Date();
        return transmissions.find((t) => {
            const start = new Date(t.scheduled_time);
            const end = new Date(start.getTime() + (t.duration_seconds || 0) * 1000);
            return (t.status === "transmitting" || t.status === "scheduled") && start <= now && end >= now;
        });
    };

    useEffect(() => {
        if (!isSpeaking) {
            lastSpokenIdRef.current = null;
            window.speechSynthesis.cancel();
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }
        // On TTS enabled, immediately play the current active transmission if any
        const activeTransmission = getActiveTransmission();
        if (activeTransmission) {
            lastSpokenIdRef.current = activeTransmission.id;
            speakTransmission(activeTransmission);
        } else {
            lastSpokenIdRef.current = null;
        }
        // Check for new transmissions every 5s
        intervalRef.current = setInterval(() => {
            const active = getActiveTransmission();
            if (
                active &&
                lastSpokenIdRef.current !== active.id
            ) {
                lastSpokenIdRef.current = active.id;
                speakTransmission(active);
            }
        }, 5000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isSpeaking, transmissions, frequency.number]);

    return (
        <div className="">
            <button onClick={() => setIsSpeaking((prev) => !prev)}>
                {isSpeaking ? "Stop" : "Sound on"}
            </button>
        </div>
    );
}
