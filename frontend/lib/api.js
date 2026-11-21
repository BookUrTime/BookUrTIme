const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TIMEOUT_MS = 5_000;

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
    const message =
      error?.name === "AbortError"
        ? "Request timed out after 5 seconds"
        : "Unable to reach the server";
    throw new ApiNetworkError(message, error);
  } finally {
    clearTimeout(timeout);
  }
}

// ==========================================
// User / Customer APIs
// ==========================================

export function fetchProviders(serviceType) {
  const query = serviceType ? `?type=${encodeURIComponent(serviceType)}` : "";
  return request(`/providers${query}`);
}

export function fetchProviderDetails(providerId) {
  return request(`/providers/${encodeURIComponent(providerId)}`);
}

export function fetchSlots(providerId, date) {
  return request(`/providers/${encodeURIComponent(providerId)}/slots?date=${encodeURIComponent(date)}`);
}

export function createBooking({ providerId, slot, date, serviceId, serviceName, name, phone, desk, notes, createdBy }) {
  return request("/bookings", {
    method: "POST",
    body: JSON.stringify({ providerId, slot, date, serviceId, serviceName, name, phone, desk, notes, createdBy }),
  });
}

export function fetchBookingDetails(bookingId) {
  return request(`/bookings/${encodeURIComponent(bookingId)}`);
}

export function cancelBooking(bookingId) {
  return request(`/bookings/${encodeURIComponent(bookingId)}`, { method: "DELETE" });
}

export function updateBookingStatusApi(bookingId, status, desk) {
  return request(`/bookings/${encodeURIComponent(bookingId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status, desk }),
  });
}

// ==========================================
// B2B Business Device Portal APIs
// ==========================================

export function fetchBusinessProfile(providerId) {
  return request(`/business/${encodeURIComponent(providerId)}/profile`);
}

export function updateBusinessProfileApi(providerId, profileData) {
  return request(`/business/${encodeURIComponent(providerId)}/profile`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}

export function fetchBusinessServices(providerId) {
  return request(`/business/${encodeURIComponent(providerId)}/services`);
}

export function createBusinessServiceApi(providerId, { name, durationMinutes, price, description }) {
  return request(`/business/${encodeURIComponent(providerId)}/services`, {
    method: "POST",
    body: JSON.stringify({ name, durationMinutes, price, description }),
  });
}

export function deleteBusinessServiceApi(providerId, serviceId) {
  return request(`/business/${encodeURIComponent(providerId)}/services/${encodeURIComponent(serviceId)}`, {
    method: "DELETE",
  });
}

export function generateBusinessScheduleApi(providerId, { date, startHour, endHour, intervalMinutes }) {
  return request(`/business/${encodeURIComponent(providerId)}/schedule/generate`, {
    method: "POST",
    body: JSON.stringify({ date, startHour, endHour, intervalMinutes }),
  });
}

export function toggleSlotBlockedApi(providerId, slotId) {
  return request(`/business/${encodeURIComponent(providerId)}/slots/${encodeURIComponent(slotId)}/toggle`, {
    method: "PATCH",
  });
}

export function fetchLiveQueueApi(providerId, date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return request(`/business/${encodeURIComponent(providerId)}/queue/live${query}`);
}

export function callNextTokenApi(providerId, date, desk) {
  const query = new URLSearchParams();
  if (date) query.set("date", date);
  if (desk) query.set("desk", desk);
  return request(`/business/${encodeURIComponent(providerId)}/queue/call-next?${query.toString()}`, {
    method: "POST",
  });
}

export function fetchDashboardMetrics(providerId, date) {
  const query = new URLSearchParams({ providerId, date });
  return request(`/dashboard/metrics?${query}`);
}

export function fetchUpcoming(providerId, date) {
  const query = new URLSearchParams({ providerId, date });
  return request(`/dashboard/upcoming?${query}`);
}
