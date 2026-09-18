"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function DriversRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    router.replace(`/admin/areas/drivers${query ? `?${query}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
      <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
      <p className="font-semibold text-slate-600">Mengalihkan ke Personil Driver...</p>
    </div>
  );
}

export default function DriversRedirectPage() {
  return (
    <Suspense fallback={
      <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
        <p className="font-semibold text-slate-600">Mengalihkan...</p>
      </div>
    }>
      <DriversRedirectContent />
    </Suspense>
  );
}
