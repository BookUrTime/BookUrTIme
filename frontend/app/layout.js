import { Inter, Noto_Sans_Devanagari, Noto_Sans_Tamil, Noto_Sans_Bengali, Noto_Sans_Telugu, Noto_Nastaliq_Urdu } from "next/font/google";
import { BookingProvider } from "../context/BookingContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "500", "600", "700"], variable: "--font-devanagari" });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["400", "500", "600", "700"], variable: "--font-tamil" });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], weight: ["400", "500", "600", "700"], variable: "--font-bengali" });
const telugu = Noto_Sans_Telugu({ subsets: ["telugu"], weight: ["400", "500", "600", "700"], variable: "--font-telugu" });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-urdu" });

export const metadata = {
  title: "BookUrTime",
  description: "Simple appointments, without the wait.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${devanagari.variable} ${tamil.variable} ${bengali.variable} ${telugu.variable} ${urdu.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- Material Symbols Outlined is an icon font loaded via CSS variable font axes (FILL, wght, GRAD, opsz) which next/font does not support */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL,wght@0..1,100..700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <BookingProvider>{children}</BookingProvider>
      </body>
    </html>
  );
}
