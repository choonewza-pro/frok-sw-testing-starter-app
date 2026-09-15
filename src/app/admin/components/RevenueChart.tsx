"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminResource } from "@/lib/admin/use-admin-resource"
import { DEFAULT_PERIOD, type Period } from "@/lib/admin/period"
import { formatTHB } from "@/lib/format"
import type { RevenueResponse } from "@/types/admin"
import AsyncSection from "./AsyncSection"
import PeriodSelector from "./PeriodSelector"

// Recharts ต้องรันฝั่ง browser เท่านั้น จึงปิด ssr
const RevenueChartView = dynamic(() => import("./RevenueChartView"), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-xl" />,
})

export default function RevenueChart() {
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)

  const { data, isLoading, error, reload } = useAdminResource<RevenueResponse>(
    `/api/admin/revenue?period=${period}`
  )

  return (
    <Card data-testid="revenue-card">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>ยอดขาย</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="revenue-total">
            รวม {formatTHB(data?.total ?? 0)}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} disabled={isLoading} />
      </CardHeader>
      <CardContent>
        <AsyncSection
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          testId="revenue"
          skeletonCount={1}
        >
          <RevenueChartView points={data?.points ?? []} />
        </AsyncSection>
      </CardContent>
    </Card>
  )
}
