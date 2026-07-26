"use client";

export default function Template({ children }) {
  return (
    <div className="animate-page-enter w-full min-h-screen">
      {children}
    </div>
  );
}
