/**
 * Shared date formatting utility.
 * Returns a human-readable date string like "Today, 25 Jul" or "28 Jul".
 */
export function formatDate(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  const today = new Date();

  const day = date.getDate();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[date.getMonth()];

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${day} ${month}`;
  }

  return `${day} ${month}`;
}
