import { Inter } from "next/font/google";
import { BookingProvider } from "../context/BookingContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "BookUrTime",
  description: "Simple appointments, without the wait.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
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
