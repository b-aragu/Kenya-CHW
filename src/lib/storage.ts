export const safeParseJSON = <T>(str: string | null, fallback: T = {} as T): T => {
    if (str === null || str === 'undefined') return fallback;
    try {
        return JSON.parse(str) as T;
    } catch (err) {
        console.error("JSON parsing error: ", err);
        return fallback;
    }
};