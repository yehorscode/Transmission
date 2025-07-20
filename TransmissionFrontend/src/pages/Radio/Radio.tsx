import { useEffect, useState, useCallback, useMemo } from "react";
import { getStationData } from "@/functions/functions";
import type { StationData, Frequency } from "@/functions/functions";
import { FrequencyChanger } from "./components/FrequencyChanger";
import { ScheduledTransmissionsOnChannel } from "./components/Scheduled-Transmissions";
import { Reader } from "./components/Reader";

const LOCAL_STORAGE_KEY = "transmission_current_frequency";

export default function Radio() {
    const [stationData, setStationData] = useState<StationData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentFrequency, setCurrentFrequency] = useState<Frequency | null>(null);
    const [currentFrequencyIndex, setCurrentFrequencyIndex] = useState<number>(0);
    const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
    const [utcTime, setUtcTime] = useState(() => new Date().toISOString().slice(11, 19));

    // Restore frequency from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored && stationData && stationData.frequencies.length > 0) {
            const freqNum = parseInt(stored, 10);
            const found = stationData.frequencies.find(f => f.number === freqNum);
            if (found) {
                setCurrentFrequency(found);
                setCurrentFrequencyIndex(stationData.frequencies.findIndex(f => f.number === freqNum));
            }
        }
    }, [stationData]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
            setUtcTime(new Date().toISOString().slice(11, 19));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchStationData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getStationData();
            setStationData(data);
            // Only update currentFrequency if it's missing from the new list
            if (data.frequencies.length > 0) {
                setCurrentFrequency((prev) => {
                    if (!prev) {
                        // Try to restore from localStorage
                        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
                        if (stored) {
                            const freqNum = parseInt(stored, 10);
                            const found = data.frequencies.find(f => f.number === freqNum);
                            if (found) return found;
                        }
                        return data.frequencies[0];
                    }
                    // If prev is not in the new list, pick the first
                    if (!data.frequencies.some(f => f.number === prev.number)) {
                        return data.frequencies[0];
                    }
                    return prev;
                });
                setCurrentFrequencyIndex((prev) => (prev === 0 ? 0 : prev));
            }
        } catch (e: any) {
            let errorMessage = "Failed to fetch data";
            if (e.message?.includes("404")) {
                errorMessage =
                    "API endpoint not found (404). Please check if the server is running.";
            } else if (e.message?.includes("NetworkError")) {
                errorMessage =
                    "Network error. Please check if the backend server is running.";
            } else {
                errorMessage = `${errorMessage}: ${e.message}`;
            }
            setError(errorMessage);
            console.error("Error fetching station data:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStationData();
        const intervalId = setInterval(fetchStationData, 10000);
        return () => clearInterval(intervalId);
    }, [fetchStationData]);

    // Save currentFrequency to localStorage whenever it changes
    useEffect(() => {
        if (currentFrequency) {
            localStorage.setItem(LOCAL_STORAGE_KEY, String(currentFrequency.number));
        }
    }, [currentFrequency]);

    const handleFrequencyChange = useCallback(
        (frequency: Frequency, index: number) => {
            setCurrentFrequency(frequency);
            setCurrentFrequencyIndex(index);
            localStorage.setItem(LOCAL_STORAGE_KEY, String(frequency.number));
        },
        []
    );

    // Memoize transmissions for the current frequency
    const currentTransmissions = useMemo(() => {
        if (!stationData || !currentFrequency) return [];
        return [
            ...stationData.scheduled_transmissions,
            ...stationData.current_transmissions,
        ].filter((t) => t.frequency.number === currentFrequency.number);
    }, [stationData, currentFrequency]);

    // Dummy frequency for Reader if nothing is selected
    const dummyFrequency = useMemo(() => ({
        id: -1,
        number: 0,
        name: "",
        description: "",
    }), []);

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                Loading station data...
            </div>
        );
    if (error)
        return (
            <div className="flex justify-center items-center h-64 text-red-500">
                Error: {error}
            </div>
        );
    if (!stationData)
        return (
            <div className="flex justify-center items-center h-64">
                Data not received.
            </div>
        );

    return (
        <div className="flex flex-col md:flex-row items-center justify-center p-4 w-full">
            <div className="flex flex-col gap-4 w-full md:w-1/2 mb-4 md:mb-0">
                <span className="text-1xl font-mono opacity-40">{time} local time</span>
                <span className="text-4xl font-mono opacity-70">{utcTime} UTC</span>
            </div>

            <div className="flex flex-col gap-4 w-full md:w-1/2 mb-4 md:mb-0">
                {stationData.frequencies.map((freq) => (
                    <ScheduledTransmissionsOnChannel
                        key={freq.number}
                        frequency={freq}
                        transmissions={[
                            ...stationData.scheduled_transmissions,
                            ...stationData.current_transmissions,
                        ].filter(
                            (t) =>
                                t.frequency.number === freq.number
                        )}
                    />
                ))}
                {/* Reader zawsze pod spodem, dla wybranej częstotliwości */}
            </div>
            <div className="w-full md:w-1/2 mb-4 md:mb-0">
                <Reader
                    frequency={currentFrequency || dummyFrequency}
                    transmissions={currentTransmissions}
                />
            </div>
            <div className="border-l border-gray-300 h-full mx-4 hidden md:block"></div>
            <div className="flex flex-col items-center w-full md:w-1/3">
                <h2 className="text-2xl font-bold mb-4">Station Frequencies</h2>
                <div className="flex flex-col items-center">
                    {stationData.frequencies.length > 0 ? (
                        <FrequencyChanger
                            frequencies={stationData.frequencies}
                            currentFrequency={currentFrequency}
                            currentFrequencyIndex={currentFrequencyIndex}
                            onFrequencyChange={handleFrequencyChange}
                        />
                    ) : (
                        <div>No frequencies available</div>
                    )}
                </div>
            </div>
        </div>
    );
}
