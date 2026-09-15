"use client"

import { useAdminResource } from "@/lib/admin/use-admin-resource"
import { DASHBOARD_REFRESH_MS } from "@/lib/admin/dashboard-config"
import type { StatsResponse } from "@/types/admin"
import AsyncSection from "./AsyncSection"
import KpiCards from "./KpiCards"

export default function StatsSection() {
  const { data, isLoading, error, reload } = useAdminResource<StatsResponse>(
    "/api/admin/stats",
    { refreshMs: DASHBOARD_REFRESH_MS }
  )

  return (
    <AsyncSection
      isLoading={isLoading}
      error={error}
      onRetry={reload}
      testId="stats"
      skeletonCount={4}
    >
      {data && <KpiCards stats={data} />}
    </AsyncSection>
  )
}
