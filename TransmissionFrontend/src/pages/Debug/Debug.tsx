import { useEffect, useState } from "react";
import { getStationData } from "@/functions/functions";
import type { StationData } from "@/functions/functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Debug() {
    const [data, setData] = useState<StationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getStationData();
            setData(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Nieznany błąd podczas pobierania danych");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-4">Debug API Data</h1>
            
            <div className="mb-4">
                <Button 
                    onClick={fetchData} 
                    disabled={loading}
                    className="mr-2"
                >
                    {loading ? "Pobieranie..." : "Odśwież dane"}
                </Button>
            </div>

            {error && (
                <Card className="p-4 mb-4 bg-red-100 border-red-300 text-red-800">
                    <h2 className="text-lg font-semibold mb-2">Błąd:</h2>
                    <p>{error}</p>
                </Card>
            )}

            {data && (
                <div className="space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold mb-3">Surowe dane API</h2>
                        <Card className="p-4 overflow-auto max-h-[600px]">
                            <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </Card>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">Częstotliwości ({data.frequencies.length})</h2>
                        <Card className="p-4 overflow-auto max-h-[400px]">
                            <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(data.frequencies, null, 2)}
                            </pre>
                        </Card>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">Zaplanowane transmisje ({data.scheduled_transmissions.length})</h2>
                        <Card className="p-4 overflow-auto max-h-[400px]">
                            <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(data.scheduled_transmissions, null, 2)}
                            </pre>
                        </Card>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">Aktualne transmisje ({data.current_transmissions.length})</h2>
                        <Card className="p-4 overflow-auto max-h-[400px]">
                            <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(data.current_transmissions, null, 2)}
                            </pre>
                        </Card>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">Klucze szyfrowania ({data.encryption_keys.length})</h2>
                        <Card className="p-4 overflow-auto max-h-[400px]">
                            <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(data.encryption_keys, null, 2)}
                            </pre>
                        </Card>
                    </section>
                </div>
            )}

            {!data && !error && (
                <Card className="p-4">
                    <p className="text-center">Ładowanie danych...</p>
                </Card>
            )}
        </div>
    );
}
