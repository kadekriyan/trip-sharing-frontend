"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function EditDriverRedirectPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const id = params?.id as string;
    router.replace(id ? `/admin/areas/drivers/${id}/edit` : "/admin/areas/drivers");
  }, [router, params]);

  return (
    <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
      <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
      <p className="font-semibold text-slate-600">Mengalihkan ke Edit Driver...</p>
    </div>
  );
}
