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
  { code: "hi", label: "Hindi (हिंदी)", avatar: "अ", subtitle: "हिंदी में जारी रखें", avatarBg: "bg-secondary-fixed text-secondary" },
  { code: "te", label: "Telugu (తెలుగు)", avatar: "తె", subtitle: "తెలుగులో కొనసాగించండి", avatarBg: "bg-tertiary-container text-on-tertiary-container" },
  { code: "ta", label: "Tamil (தமிழ்)", avatar: "அ", subtitle: "தமிழில் தொடரவும்", avatarBg: "bg-tertiary-fixed text-tertiary" },
  { code: "bn", label: "Bengali (বাংলা)", avatar: "অ", subtitle: "বাংলায় চালিয়ে যান", avatarBg: "bg-primary-container text-on-primary-container" },
  { code: "ur", label: "Urdu (اردو)", avatar: "ا", subtitle: "اردو میں جاری رکھیں", avatarBg: "bg-secondary-container text-on-secondary-container" },
];

export const serviceTypes = [
  {
    type: "hospital",
    label: { en: "Hospital", hi: "अस्पताल", te: "ఆసుపత్రి", ta: "மருத்துவமனை", bn: "হাসপাতাল", ur: "ہسپتال" },
    icon: "local_hospital",
    iconBg: "bg-primary-container text-on-primary-container",
    desc: {
      en: "Doctor appointments, medical checkups, and diagnostic labs.",
      hi: "डॉक्टर अपॉइंटमेंट, मेडिकल चेकअप और डायग्नोस्टिक लैब।",
      te: "వైద్యుల అపాయింట్‌మెంట్లు, వైద్య పరీక్షలు మరియు ల్యాబ్‌లు.",
      ta: "மருத்துவர் சந்திப்புகள், மருத்துவ பரிசோதனைகள் மற்றும் ஆய்வகங்கள்.",
      bn: "ডাক্তারের অ্যাপয়েন্টমেন্ট, মেডিকেল চেকআপ এবং ডায়াগনস্টিক ল্যাব।",
      ur: "ڈاکٹر کی اپائنٹمنٹس، میڈیکل چیک اپ اور لیبارٹریز۔"
    }
  },
  {
    type: "aadhaar",
    label: { en: "Aadhaar", hi: "आधार", te: "ఆధార్", ta: "ஆதார்", bn: "আধার", ur: "آدھار" },
    icon: "fingerprint",
    iconBg: "bg-secondary-container text-on-secondary-container",
    desc: {
      en: "Update bio-metrics, address change, or new enrollment centers.",
      hi: "बायो-मेट्रिक्स अपडेट करें, पता बदलें या नए नामांकन केंद्र।",
      te: "బయోమెట్రిక్స్ నవీకరణ, చిరునామా మార్పు లేదా కొత్త కేంద్రాలు.",
      ta: "பயோ-மெட்ரிக்ஸ் புதுப்பித்தல், முகவரி மாற்றம் அல்லது புதிய மையங்கள்.",
      bn: "বায়োমেট্রিক আপডেট, ঠিকানা পরিবর্তন বা নতুন কেন্দ্র।",
      ur: "بائیو میٹرک اپ ڈیٹ، پتہ کی تبدیلی یا نئے مراکز۔"
    }
  },
  {
    type: "bank",
    label: { en: "Bank", hi: "बैंक", te: "బ్యాంక్", ta: "வங்கி", bn: "ব্যাংক", ur: "بینک" },
    icon: "account_balance",
    iconBg: "bg-tertiary-container/10 text-tertiary",
    desc: {
      en: "New account opening, loan inquiries, or locker services.",
      hi: "नया खाता खोलना, ऋण संबंधी पूछताछ या लॉकर सेवाएं।",
      te: "కొత్త ఖాతా తెరవడం, రుణాలు లేదా లాకర్ సేవలు.",
      ta: "புதிய கணக்கு தொடங்குதல், கடன் விசாரணைகள் அல்லது லாக்கர் சேவைகள்.",
      bn: "নতুন অ্যাকাউন্ট খোলা, ঋণ সংক্রান্ত জিজ্ঞাসাবাদ বা লকার পরিষেবা।",
      ur: "نیا اکاؤنٹ کھولنا، قرض کی معلومات یا لاکر کی خدمات۔"
    }
  },
];
