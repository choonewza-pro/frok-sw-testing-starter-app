"use client"

import { Button } from "@/components/ui/button"
import { PERIODS, type Period } from "@/lib/admin/period"

type Props = {
  value: Period
  onChange: (period: Period) => void
  disabled?: boolean
}

const LABELS: Record<Period, string> = {
  "7d": "7 วัน",
  "30d": "30 วัน",
  "90d": "90 วัน",
}

export default function PeriodSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="flex gap-2" role="group" aria-label="เลือกช่วงเวลา" data-testid="period-selector">
      {PERIODS.map((period) => (
        <Button
          key={period}
          type="button"
          size="sm"
          variant={period === value ? "default" : "outline"}
          aria-pressed={period === value}
          disabled={disabled}
          onClick={() => onChange(period)}
          data-testid={`period-${period}`}
        >
          {LABELS[period]}
        </Button>
      ))}
    </div>
  )
}
