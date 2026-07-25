"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useBooking } from "../../context/BookingContext";
import { Screen } from "../../components/UI";
import { languages } from "../../lib/dummyData";

export default function LanguagePage() {
  const router = useRouter();
  const { language, setLanguage } = useBooking();
  const [selected, setSelected] = useState(language || "");

  const handleLanguageSelect = (langCode) => {
    setSelected(langCode);
    
    // Add brief delay to show click state feedback (150ms)
    setTimeout(() => {
      setLanguage(langCode);
      router.push("/service");
    }, 200);
  };

  return (
    <Screen className="flex flex-col min-h-screen bg-background relative overflow-hidden p-0 max-w-container-max mx-auto">
      {/* Animated Background Ornament */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary opacity-[0.03] rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 -left-32 w-80 h-80 bg-secondary opacity-[0.03] rounded-full blur-3xl"></div>

      {/* Header Area */}
      <header className="pt-12 pb-8 px-page-margin shrink-0">
        <div className="flex flex-col gap-2">
          <span className="font-label-lg text-label-lg text-primary tracking-widest font-bold">WELCOME</span>
          <h1 className="font-display-sm text-display-sm text-on-surface">Choose your language</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Select your preferred language to continue with BookUrTime.
          </p>
        </div>
      </header>

      {/* Language Selection Grid */}
      <main className="flex-grow px-page-margin flex flex-col gap-gutter justify-between">
        <div className="grid grid-cols-1 gap-gutter">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`group relative flex items-center justify-between p-6 bg-surface-container-lowest border rounded-2xl shadow-[0px_4px_12px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-primary cursor-pointer text-left ${
                selected === lang.code ? "language-card-active" : "border-outline-variant"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full ${lang.avatarBg} flex items-center justify-center font-bold text-xl overflow-hidden select-none`}>
                  {lang.avatar}
                </div>
                <div>
                  <p className="font-headline-md text-headline-md text-on-surface font-bold">{lang.label}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{lang.subtitle}</p>
                </div>
              </div>
              {/* Custom Radio Button */}
              <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors bg-white ${
                selected === lang.code ? "border-primary" : "border-outline-variant group-hover:border-primary"
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full bg-primary transition-transform ${
                  selected === lang.code ? "scale-100" : "scale-0"
                }`}></div>
              </div>
            </button>
          ))}
        </div>

        {/* Visual Graphic Placeholder */}
        <div className="mt-8 flex flex-col items-center justify-center opacity-30 select-none">
          <div className="w-full h-48 relative overflow-hidden rounded-3xl grayscale">
            <Image
              className="w-full h-full object-cover"
              alt="Minimalist abstract spheres background illustration"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOKcTBLirr3raaBELrPfR0BcpLRNfZ87eCPqpdfQyvUInW6VXK7CCi29jvgxUqITUBF8sS3QgyWVlAw6_WP9hXKqZrrYCG2r_O09HFzNzmcq21mpCC9y6mc8F-Ie3LXawy-6-Ix6-MlOiVrWIMSIVd63MOi2HLieV_bNiq6VQ6tKP4sJ1okSa7uP8urOgnFP2v9MXhHuIvZPa7WdJ47W-8BbNSs5UmbNnyOZuZlI7C_K6FT4ajjdgd4U0Gip0nuHI-MNm8RCbJVQ"
              fill
              sizes="(max-width: 448px) 100vw, 448px"
              unoptimized
            />
          </div>
        </div>
      </main>

      {/* Footer Area */}
      <footer className="p-page-margin pb-12 shrink-0">
        <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
          You can change this later in your profile settings.
        </p>
      </footer>
    </Screen>
  );
}
