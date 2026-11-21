"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ServicePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <span className="material-symbols-outlined text-4xl animate-spin text-blue-600">
        progress_activity
      </span>
    </div>
  );
}
