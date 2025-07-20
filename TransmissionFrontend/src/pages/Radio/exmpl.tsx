function radio() {
const [stationData, setStationData] = useState<StationData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentFrequency, setCurrentFrequency] = useState<number | null>(
        null
    );
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Use useCallback for memoized function that doesn't change on re-renders unless dependencies change
    const fetchStationData = useCallback(async () => {
        try {
            const data = await getStationData();
            setStationData(data);
            // Ustaw currentFrequency tylko jeśli nie jest ustawione (null)
            setCurrentFrequency((prev) => {
                if (prev === null && data.frequencies.length > 0) {
                    return data.frequencies[0].number;
                }
                return prev;
            });
        } catch (e: any) {
            if (e.message?.includes("404")) {
                setError(
                    "API endpoint not found (404). Please check if the server is running and the endpoint exists."
                );
            } else if (e.message?.includes("NetworkError")) {
                setError(
                    "Network error. Please check if the backend server is running."
                );
            } else {
                setError(`Failed to fetch data: ${e.message}`);
            }
            console.error("Error fetching station data:", e);
        } finally {
            setLoading(false);
        }
    }, []); // Brak currentFrequency w dependency array, bo używamy setState z funkcją

    useEffect(() => {
        fetchStationData();

        const intervalId = setInterval(fetchStationData, 10000); // Poll every 10 seconds

        return () => clearInterval(intervalId);
    }, [fetchStationData]); // Dependency fetchStationData

    // TTS Function - remains largely the same
    const speakCode = (code: string, type: string) => {
        // ... (your existing TTS implementation) ...
        const utterance = new SpeechSynthesisUtterance();
        utterance.text = code;
        utterance.lang = "en-US";

        if (type === "numbers") {
            utterance.pitch = 0.8;
            utterance.rate = 0.9;
            utterance.text = code.split("").join(" ");
        } else if (type === "names") {
            utterance.pitch = 1.0;
            utterance.rate = 1.0;
        }
        speechSynthesis.speak(utterance);
    };

    // Logic to play transmissions when their time comes
    useEffect(() => {
        if (!stationData || !currentFrequency) return;

        const now = new Date().getTime();

        stationData.scheduled_transmissions.forEach((transmission) => {
            const scheduledTimeMs = new Date(
                transmission.scheduled_time
            ).getTime();
            const transmissionEndTimeMs =
                scheduledTimeMs + transmission.duration_seconds * 1000;

            if (
                transmission.frequency.number === currentFrequency &&
                now >= scheduledTimeMs &&
                now < transmissionEndTimeMs &&
                transmission.status === "scheduled"
            ) {
                console.log(
                    `Playing transmission on Freq ${currentFrequency}: ${transmission.code}`
                );
                speakCode(transmission.code, transmission.transmission_type);
                // --- See comments above about backend status update ---
            }
        });
        // ...existing code...
    }, [stationData, currentFrequency]); // speakCode nie musi być w dependency array

    if (loading) return <div>Loading station data...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!stationData) return <div>No data received.</div>;

    return (
        <div
            style={{
                padding: "20px",
                fontFamily: "monospace",
                backgroundColor: "#333",
                color: "#0f0",
            }}
        >
            <h1>Number Station Simulator</h1>

            <h2>Frequencies</h2>
            <div>
                {stationData.frequencies.map((freq) => (
                    <button
                        key={freq.id}
                        onClick={() => setCurrentFrequency(freq.number)}
                        style={{
                            margin: "5px",
                            padding: "10px 15px",
                            backgroundColor:
                                freq.number === currentFrequency
                                    ? "#0f0"
                                    : "#555",
                            color: "#333",
                            border: "1px solid #0f0",
                            cursor: "pointer",
                        }}
                    >
                        Freq {freq.number} {freq.name ? `(${freq.name})` : ""}
                    </button>
                ))}
            </div>

            <h2>Current Frequency: {currentFrequency}</h2>

            <h2>Scheduled Transmissions</h2>
            <div
                style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: "1px solid #0f0",
                    padding: "10px",
                }}
            >
                {stationData.scheduled_transmissions.length > 0 ? (
                    <ul>
                        {stationData.scheduled_transmissions
                            .filter(
                                (t) => t.frequency.number === currentFrequency
                            )
                            .map((t) => (
                                <li key={t.id}>
                                    {new Date(
                                        t.scheduled_time
                                    ).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                        timeZoneName: "short",
                                    })}{" "}
                                    - Code: "{t.code}" ({t.transmission_type}) -
                                    Dur: {t.duration_seconds}s
                                </li>
                            ))}
                    </ul>
                ) : (
                    <p>No upcoming transmissions on this frequency.</p>
                )}
            </div>

            <h2>Active Encryption Keys</h2>
            <div
                style={{
                    maxHeight: "150px",
                    overflowY: "auto",
                    border: "1px solid #0f0",
                    padding: "10px",
                    marginTop: "10px",
                }}
            >
                {stationData.encryption_keys.length > 0 ? (
                    <ul>
                        {stationData.encryption_keys.map((key) => (
                            <li key={key.id}>
                                Key: {key.key_value} - Desc: {key.description}{" "}
                                {key.valid_until
                                    ? `(Expires: ${new Date(
                                          key.valid_until
                                      ).toLocaleDateString()})`
                                    : ""}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No active encryption keys.</p>
                )}
            </div>

            {/* Update TransmissionSubmissionForm to use the new submitTransmission function */}
            <TransmissionSubmissionForm
                frequencies={stationData.frequencies}
                onSubmitSuccess={fetchStationData} // This refetches data after successful submission
            />

            <audio ref={audioRef} style={{ display: "none" }}></audio>
        </div>
    );
}



// --- TransmissionSubmissionForm Component (updated to use submitTransmission) ---
interface TransmissionSubmissionFormProps {
    frequencies: Frequency[];
    onSubmitSuccess: () => void;
}

const TransmissionSubmissionForm: React.FC<TransmissionSubmissionFormProps> = ({
    frequencies,
    onSubmitSuccess,
}) => {
    const [selectedFreq, setSelectedFreq] = useState<number>(
        frequencies[0]?.number || 1
    );
    const [code, setCode] = useState<string>("");
    const [type, setType] = useState<"numbers" | "names" | "mixed">("numbers");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

    // Ensure selectedFreq defaults to a valid frequency if `frequencies` changes
    useEffect(() => {
        if (
            frequencies.length > 0 &&
            !frequencies.some((f) => f.number === selectedFreq)
        ) {
            setSelectedFreq(frequencies[0].number);
        }
    }, [frequencies, selectedFreq]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            await submitTransmission(selectedFreq, code, type); // Use the helper function

            setCode(""); // Clear form
            setSubmitSuccess(true);
            onSubmitSuccess(); // Trigger parent to refetch data
            setTimeout(() => setSubmitSuccess(false), 3000); // Hide success message
        } catch (err: any) {
            setSubmitError(`Submission failed: ${err.message}`);
            console.error("Submission error:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                border: "1px solid #0f0",
                padding: "15px",
                marginTop: "15px",
            }}
        >
            <h3>Submit New Transmission</h3>
            <div>
                <label>Frequency:</label>
                <select
                    value={selectedFreq}
                    onChange={(e) => setSelectedFreq(Number(e.target.value))}
                    style={{
                        backgroundColor: "#444",
                        color: "#0f0",
                        border: "1px solid #0f0",
                        marginLeft: "5px",
                    }}
                >
                    {frequencies.map((freq) => (
                        <option key={freq.id} value={freq.number}>
                            {freq.number} {freq.name ? `(${freq.name})` : ""}
                        </option>
                    ))}
                </select>
            </div>
            <div style={{ marginTop: "10px" }}>
                <label>Code:</label>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    style={{
                        width: "80%",
                        padding: "5px",
                        backgroundColor: "#444",
                        color: "#0f0",
                        border: "1px solid #0f0",
                        marginLeft: "5px",
                    }}
                />
            </div>
            <div style={{ marginTop: "10px" }}>
                <label>Type:</label>
                <select
                    value={type}
                    onChange={(e) =>
                        setType(e.target.value as "numbers" | "names" | "mixed")
                    }
                    style={{
                        backgroundColor: "#444",
                        color: "#0f0",
                        border: "1px solid #0f0",
                        marginLeft: "5px",
                    }}
                >
                    <option value="numbers">Numbers</option>
                    <option value="names">Names (Alpha, Bravo)</option>
                    <option value="mixed">Mixed</option>
                </select>
            </div>
            <button
                type="submit"
                disabled={submitting}
                style={{
                    marginTop: "15px",
                    padding: "10px 20px",
                    backgroundColor: "#0f0",
                    color: "#333",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                {submitting ? "Submitting..." : "Transmit"}
            </button>
            {submitError && (
                <p style={{ color: "red", marginTop: "10px" }}>{submitError}</p>
            )}
            {submitSuccess && (
                <p style={{ color: "lime", marginTop: "10px" }}>
                    Transmission scheduled!
                </p>
            )}
        </form>
    );
};
