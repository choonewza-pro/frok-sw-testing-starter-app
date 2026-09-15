"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RotateCcw } from "lucide-react"

type Props = {
  isLoading: boolean
  error: string | null
  onRetry: () => void
  /** ใช้เป็น prefix ของ data-testid เพื่อให้ e2e เจาะแต่ละ section ได้ */
  testId: string
  skeletonCount?: number
  children: React.ReactNode
}

/**
 * ห่อทุก section ของ Dashboard ให้จัดการ loading / error / retry เหมือนกันหมด
 * แทนที่จะเขียน if ซ้ำใน KPI, กราฟ และตารางออร์เดอร์
 */
export default function AsyncSection({
  isLoading,
  error,
  onRetry,
  testId,
  skeletonCount = 3,
  children,
}: Props) {
  if (error) {
    return (
      <div
        role="alert"
        data-testid={`${testId}-error`}
        className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center"
      >
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={onRetry}
          data-testid={`${testId}-retry`}
        >
          <RotateCcw className="size-4" /> ลองใหม่
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div data-testid={`${testId}-loading`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return <div data-testid={testId}>{children}</div>
}
