import { AxiosError } from "axios"

import type { ApiError } from "./client"
import i18next from "./i18n"

function extractErrorMessage(err: ApiError): string {
  if (err instanceof AxiosError) {
    return err.message
  }

  const errDetail = (err.body as any)?.detail
  if (Array.isArray(errDetail) && errDetail.length > 0) {
    return errDetail[0].msg
  }
  return errDetail || i18next.t("states.error", { ns: "common" })
}

export const handleError = function (
  this: (msg: string) => void,
  err: ApiError,
) {
  const errorMessage = extractErrorMessage(err)
  this(errorMessage)
}

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

/**
 * Ensures a time string is displayed in 24-hour HH:mm format.
 * Handles edge cases like "8:00" → "08:00", null/undefined → fallback.
 */
export function formatTimeHHmm(
  time: string | null | undefined,
  fallback = ""
): string {
  if (!time) return fallback;

  // Match HH:mm or H:mm (with optional AM/PM suffix)
  const match = time.match(/^(\d{1,2}):(\d{2})(?:\s*[APap][Mm])?$/);
  if (!match) return time;

  const hours = Number.parseInt(match[1], 10);
  const minutes = match[2];

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}
