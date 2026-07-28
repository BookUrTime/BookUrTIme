const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TIMEOUT_MS = 3_000;

export class ApiNetworkError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "ApiNetworkError";
    this.cause = cause;
  }
}

export class ApiRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export const isNetworkError = (error) => error instanceof ApiNetworkError;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options.headers },
    });

    if (!response.ok) {
      let detail = "Request failed";
      try {
        const body = await response.json();
        detail = body.detail || detail;
      } catch {}
      throw new ApiRequestError(detail, response.status);
    }

    if (response.status === 204) return null;
    return response.json();
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    const message = error?.name === "AbortError"
      ? "Request timed out after 3 seconds"
      : "Unable to reach the booking service";
    throw new ApiNetworkError(message, error);
  } finally {
    clearTimeout(timeout);
  }
}

export function fetchProviders(serviceType) {
  const query = serviceType ? `?type=${encodeURIComponent(serviceType)}` : "";
  return request(`/providers${query}`);
}

export function fetchSlots(providerId, date) {
  return request(`/providers/${encodeURIComponent(providerId)}/slots?date=${encodeURIComponent(date)}`);
}

export function createBooking({ providerId, slot, name, phone }) {
  return request("/bookings", {
    method: "POST",
    body: JSON.stringify({ providerId, slot, name, phone }),
  });
}

export function cancelBooking(bookingId) {
  return request(`/bookings/${encodeURIComponent(bookingId)}`, { method: "DELETE" });
}

export function fetchDashboardMetrics(providerId, date) {
  const query = new URLSearchParams({ providerId, date });
  return request(`/dashboard/metrics?${query}`);
}

export function fetchUpcoming(providerId, date) {
  const query = new URLSearchParams({ providerId, date });
  return request(`/dashboard/upcoming?${query}`);
}
