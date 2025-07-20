import { useCallback, type ChangeEvent } from "react";
import type { Frequency } from "@/functions/functions";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FrequencyChangerProps {
    frequencies: Frequency[];
    currentFrequency: Frequency | null;
    currentFrequencyIndex: number;
    onFrequencyChange: (frequency: Frequency, index: number) => void;
}

export function FrequencyChanger({
    frequencies,
    currentFrequency,
    currentFrequencyIndex,
    onFrequencyChange,
}: FrequencyChangerProps) {
    const handleInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const value = Number(e.target.value);
            if (isNaN(value) || frequencies.length === 0) return;

            const findClosestFrequency = () => {
                let matchIndex = frequencies.findIndex(
                    (freq) => freq.number === value
                );
                if (matchIndex !== -1) {
                    return {
                        frequency: frequencies[matchIndex],
                        index: matchIndex,
                    };
                }

                let closest = {
                    frequency: frequencies[0],
                    index: 0,
                    diff: Math.abs(frequencies[0].number - value),
                };

                frequencies.forEach((freq, index) => {
                    const diff = Math.abs(freq.number - value);
                    if (diff < closest.diff) {
                        closest = { frequency: freq, index, diff };
                    }
                });

                return closest;
            };

            const { frequency, index } = findClosestFrequency();
            onFrequencyChange(frequency, index);
        },
        [frequencies, onFrequencyChange]
    );

    const goToPreviousFrequency = useCallback(() => {
        if (frequencies.length === 0) return;

        const newIndex =
            currentFrequencyIndex > 0
                ? currentFrequencyIndex - 1
                : frequencies.length - 1;

        onFrequencyChange(frequencies[newIndex], newIndex);
    }, [frequencies, currentFrequencyIndex, onFrequencyChange]);

    const goToNextFrequency = useCallback(() => {
        if (frequencies.length === 0) return;

        const newIndex =
            currentFrequencyIndex < frequencies.length - 1
                ? currentFrequencyIndex + 1
                : 0;

        onFrequencyChange(frequencies[newIndex], newIndex);
    }, [frequencies, currentFrequencyIndex, onFrequencyChange]);

    return (
        <div className="flex flex-col items-center justify-center">
            <span className="text-center text-2xl font-bold mb-4">
                {currentFrequency?.name
                    ? `${currentFrequency.name} (${currentFrequency.number})`
                    : `Częstotliwość: ${currentFrequency?.number}`}
            </span>
            <div className="flex items-center justify-center">
                <button
                    className="mx-2 p-2 hover:bg-gray-500 rounded-full"
                    onClick={goToPreviousFrequency}
                >
                    <ArrowLeft className="h-8 w-8" />
                </button>
                <Input
                    type="text"
                    className="bg-white w-24 text-center"
                    value={currentFrequency?.number || ""}
                    onChange={handleInputChange}
                />
                <button
                    className="mx-2 p-2 hover:bg-gray-500 rounded-full"
                    onClick={goToNextFrequency}
                >
                    <ArrowRight className="h-8 w-8" />
                </button>
            </div>
        </div>
    );
}
