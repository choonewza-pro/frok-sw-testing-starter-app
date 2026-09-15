"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatShortDateTH, formatTHB } from "@/lib/format"
import type { RevenuePoint } from "@/lib/admin/revenue"

type Props = { points: RevenuePoint[] }

/**
 * ตัวกราฟล้วน ๆ แยกไฟล์ไว้เพื่อให้ถูกโหลดแบบ client-only ด้วย next/dynamic
 * (Recharts อ่าน window ตอนวัดขนาด จึง render ฝั่ง server ไม่ได้)
 */
export default function RevenueChartView({ points }: Props) {
  if (points.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground" data-testid="revenue-empty">
        ยังไม่มียอดขายในช่วงนี้
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={points} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDateTH}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={(value: number) => formatTHB(value)}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          width={90}
        />
        <Tooltip
          labelFormatter={(label) =>
            formatShortDateTH(typeof label === "string" ? label : null)
          }
          formatter={(value) => [formatTHB(Number(value) || 0), "ยอดขาย"]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
