"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import type { AdminProduct } from "@/types/admin"

type Props = {
  product: AdminProduct | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteProductDialog({
  product,
  isDeleting,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog open={product !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent data-testid="delete-dialog">
        <DialogHeader>
          <DialogTitle>ยืนยันการลบสินค้า</DialogTitle>
          <DialogDescription data-testid="delete-dialog-message">
            ต้องการลบ &quot;{product?.name}&quot; ใช่หรือไม่ การลบไม่สามารถย้อนกลับได้
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            data-testid="delete-cancel"
          >
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            data-testid="delete-confirm"
          >
            {isDeleting && <Spinner className="size-4" />}
            {isDeleting ? "กำลังลบ..." : "ลบสินค้า"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
