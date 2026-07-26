/**
 * Utility to format dates.
 */

import { TFunction } from "i18next";

export function formatDate(t: TFunction, isoString: string | null): string {
    if (!isoString) return t("settings.lastSync.never");

    const date = new Date(isoString); // Convert ISO string to Date object
    const diffMs = Date.now() - date.getTime(); // Difference in milliseconds
    const diffMins = Math.floor(diffMs / 60000); // Convert to minutes

    // If the difference is less than 1 minute, return "Just now"
    if (diffMins < 1) return t("settings.lastSync.justNow");

    // If the difference is less than 60 minutes, return "X minutes ago"
    if (diffMins < 60) return t("settings.lastSync.minutesAgo", { count: diffMins });

    // If the difference is less than 24 hours, return "X hours ago"
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t("settings.lastSync.hoursAgo", { count: diffHours });
    return t("settings.lastSyncDate", { date: date.toLocaleDateString() });
}