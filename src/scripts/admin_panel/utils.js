export function getConfidenceFlag(confidence) {
    const conf = parseFloat(confidence);
    if (isNaN(conf)) return "unknown";  //  if not a number
    if (conf < 0.5) return "low";
    if (conf < 0.8) return "medium";
    if (conf >= 0.8) return "high";
    return "unknown";   //  fallback
};

export function formatTimestamp(timestamp, timezone) {
    try {
        //  make sure timestmap is ISO format
        const iso = timestamp.match(/[Z+-]$/) ? timestamp : timestamp + "Z";
        const date = new Date(iso);

        return new Intl.DateTimeFormat("default", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).format(date);
    } catch {
        return timestamp;   //  fallback, just in case, should be in GMT
    };
};

export function normalize(inputText) {
    return inputText.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();
};