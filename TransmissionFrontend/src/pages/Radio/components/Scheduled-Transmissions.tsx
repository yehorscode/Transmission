import type { Frequency, Transmission } from "@/functions/functions";

function formatDateTime(isoDateString: string): string {
    const date = new Date(isoDateString);
    return date.toLocaleString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

function formatUTCTime(isoDateString: string): string {
    const date = new Date(isoDateString);
    return `${date.getUTCHours().toString().padStart(2, "0")}:${date
        .getUTCMinutes()
        .toString()
        .padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")}`;
}

export function ScheduledTransmissionsOnChannel({
    frequency,
    transmissions,
}: {
    frequency: Frequency;
    transmissions: Transmission[];
}) {
    const scheduledTransmissions = transmissions.filter(
        (transmission) =>
            transmission.status === "transmitting" ||
            transmission.status === "scheduled"
    );

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">
                Frequency {frequency.number} -{" "}
                {frequency.name || frequency.description}
            </h3>
            {scheduledTransmissions.length > 0 ? (
                <ul className="list-disc pl-5">
                    {scheduledTransmissions.map((transmission) => {
                        const localTime = formatDateTime(
                            transmission.scheduled_time
                        );
                        const utcTime = formatUTCTime(
                            transmission.scheduled_time
                        );

                        return (
                            <li key={transmission.id}>
                                <div>
                                    <strong>{transmission.code}</strong>
                                </div>
                                <div className="text-sm">
                                    Local time: {localTime}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    UTC time: {utcTime}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">
                    No sceduled transmissions
                </p>
            )}
        </div>
    );
}
