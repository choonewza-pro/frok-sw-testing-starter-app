"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminResource } from "@/lib/admin/use-admin-resource"
import { DASHBOARD_REFRESH_MS } from "@/lib/admin/dashboard-config"
import { formatDateTimeTH, formatTHB } from "@/lib/format"
import type { OrdersResponse } from "@/types/admin"
import AsyncSection from "./AsyncSection"

const STATUS_LABELS: Record<string, string> = {
  received: "รับคำสั่งซื้อแล้ว",
  processing: "กำลังดำเนินการ",
  delivered: "จัดส่งแล้ว",
}

export default function RecentOrders() {
  const { data, isLoading, error, reload } = useAdminResource<OrdersResponse>(
    "/api/admin/orders?limit=5",
    { refreshMs: DASHBOARD_REFRESH_MS }
  )

  const orders = data?.orders ?? []

  return (
    <Card data-testid="recent-orders-card">
      <CardHeader>
        <CardTitle>คำสั่งซื้อล่าสุด</CardTitle>
      </CardHeader>
      <CardContent>
        <AsyncSection
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          testId="recent-orders"
          skeletonCount={1}
        >
          {orders.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground" data-testid="recent-orders-empty">
              ยังไม่มีคำสั่งซื้อ
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} data-testid="recent-order-row" data-order-id={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell data-testid="recent-order-date">
                      {formatDateTimeTH(order.date)}
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" data-testid="recent-order-total">
                      {formatTHB(order.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AsyncSection>
      </CardContent>
    </Card>
  )
}
