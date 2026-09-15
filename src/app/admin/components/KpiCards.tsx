"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCount, formatTHB } from "@/lib/format"
import { Banknote, Package, ShoppingCart, Users } from "lucide-react"
import type { StatsResponse } from "@/types/admin"

type Props = { stats: StatsResponse }

export default function KpiCards({ stats }: Props) {
  const cards = [
    {
      key: "revenue",
      label: "ยอดขายรวม",
      value: formatTHB(stats.totalRevenue),
      icon: Banknote,
    },
    {
      key: "orders",
      label: "คำสั่งซื้อ",
      value: formatCount(stats.totalOrders),
      icon: ShoppingCart,
    },
    {
      key: "products",
      label: "สินค้า",
      value: formatCount(stats.totalProducts),
      icon: Package,
    },
    {
      key: "customers",
      label: "ลูกค้า",
      value: formatCount(stats.totalCustomers),
      icon: Users,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ key, label, value, icon: Icon }) => (
        <Card key={key} data-testid={`kpi-${key}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid={`kpi-${key}-value`}>
              {value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
