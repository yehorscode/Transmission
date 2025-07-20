const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/";

export interface Frequency {
    id: number;
    number: number;
    name: string | null;
    description: string;
}

export interface Transmission {
    id: number;
    frequency: Frequency;
    code: string;
    transmission_type: "numbers" | "names" | "mixed";
    scheduled_time: string;
    duration_seconds: number;
    status: "scheduled" | "transmitting" | "completed" | "cancelled" | "failed";
    // Dodane pola wymagane przez Reader
    content?: string;
    start_time?: string | Date;
    end_time?: string | Date;
}

export interface EncryptionKey {
    id: number;
    key_value: string;
    description: string;
    valid_from: string;
    valid_until: string | null;
    is_active: boolean;
}

export interface StationData {
    frequencies: Frequency[];
    scheduled_transmissions: Transmission[];
    current_transmissions: Transmission[];
    encryption_keys: EncryptionKey[];
}

/**
 * Fetches all consolidated station data from the backend.
 */
export async function getStationData(): Promise<StationData> {
    try {
        const response = await fetch(`${API_BASE_URL}station_data/`);
        if (!response.ok) {
            let errorText = `Server returned ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorText += ` - ${JSON.stringify(errorData)}`;
            } catch (jsonError) {}
            throw new Error(`Failed to fetch station data: ${errorText}`);
        }
        const data: StationData = await response.json();
        return data;
    } catch (error) {
        console.error("Error in getStationData:", error);
        throw error;
    }
}

/**
 * Submits a new transmission to the backend.
 */
export async function submitTransmission(
    frequencyNumber: number,
    code: string,
    transmissionType: "numbers" | "names" | "mixed"
): Promise<Transmission> {
    try {
        const response = await fetch(`${API_BASE_URL}submit_transmission/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                frequency_number: frequencyNumber,
                code: code,
                transmission_type: transmissionType,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `Failed to submit transmission: ${response.status} ${
                    response.statusText
                } - ${JSON.stringify(errorData)}`
            );
        }

        const data: Transmission = await response.json();
        return data;
    } catch (error) {
        console.error("Error in submitTransmission:", error);
        throw error;
    }
}

export async function updateTransmissionStatus(
    id: number,
    status: Transmission["status"]
): Promise<Transmission> {
    try {
        const response = await fetch(`${API_BASE_URL}transmissions/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: status }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `Failed to update status: ${response.status} ${
                    response.statusText
                } - ${JSON.stringify(errorData)}`
            );
        }
        const data: Transmission = await response.json();
        return data;
    } catch (error) {
        console.error("Error in updateTransmissionStatus:", error);
        throw error;
    }
}
