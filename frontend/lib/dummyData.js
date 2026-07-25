export const providers = [
  {
    id: "citycare",
    name: "CityCare Clinic",
    type: "hospital",
    distanceKm: 1.8,
    waitMinutes: 12,
    slots: ["09:00", "09:30", "10:00", "10:30", "14:00", "14:30", "15:00"],
    bookedSlots: ["09:30", "14:30"],
  },
  {
    id: "aadhaar-seva",
    name: "Aadhaar Seva Kendra",
    type: "aadhaar",
    distanceKm: 3.2,
    waitMinutes: 24,
    slots: ["09:00", "09:45", "10:30", "11:15", "14:00", "14:45", "15:30"],
    bookedSlots: ["10:30", "15:30"],
  },
  {
    id: "state-bank",
    name: "State Bank Branch",
    type: "bank",
    distanceKm: 0.9,
    waitMinutes: 38,
    slots: ["10:00", "10:30", "11:00", "11:30", "13:30", "14:00", "14:30"],
    bookedSlots: ["11:00", "14:00"],
  },
];

export const languages = [
  { code: "en", label: "English", avatar: "US", subtitle: "Default language", avatarBg: "bg-primary-fixed text-primary" },
  { code: "hi", label: "Hindi", avatar: "अ", subtitle: "हिंदी में जारी रखें", avatarBg: "bg-secondary-fixed text-secondary" },
];

export const serviceTypes = [
  {
    type: "hospital",
    label: { en: "Hospital", hi: "अस्पताल" },
    icon: "local_hospital",
    iconBg: "bg-primary-container text-on-primary-container",
    desc: {
      en: "Doctor appointments, medical checkups, and diagnostic labs.",
      hi: "डॉक्टर अपॉइंटमेंट, मेडिकल चेकअप और डायग्नोस्टिक लैब।"
    }
  },
  {
    type: "aadhaar",
    label: { en: "Aadhaar", hi: "आधार" },
    icon: "fingerprint",
    iconBg: "bg-secondary-container text-on-secondary-container",
    desc: {
      en: "Update bio-metrics, address change, or new enrollment centers.",
      hi: "बायो-मेट्रिक्स अपडेट करें, पता बदलें या नए नामांकन केंद्र।"
    }
  },
  {
    type: "bank",
    label: { en: "Bank", hi: "बैंक" },
    icon: "account_balance",
    iconBg: "bg-tertiary-container/10 text-tertiary",
    desc: {
      en: "New account opening, loan inquiries, or locker services.",
      hi: "नया खाता खोलना, ऋण संबंधी पूछताछ या लॉकर सेवाएं।"
    }
  },
];
