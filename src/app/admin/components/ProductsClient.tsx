"use client"

import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash } from "lucide-react"
import { requestJson, toErrorMessage } from "@/lib/admin/api-client"
import { notifyError, notifySuccess } from "@/lib/admin/notify"
import { useAdminResource } from "@/lib/admin/use-admin-resource"
import { useDebouncedValue } from "@/lib/admin/use-debounced-value"
import { formatTHB } from "@/lib/format"
import type { ProductFormValues } from "@/lib/admin/product-schema"
import type {
  AdminProduct,
  AdminProductsResponse,
  CategoriesResponse,
} from "@/types/admin"
import AsyncSection from "./AsyncSection"
import DeleteProductDialog from "./DeleteProductDialog"
import ProductFormDialog from "./ProductFormDialog"

export default function ProductsClient() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search)

  // ทุกครั้งที่ url เปลี่ยน hook จะยิงใหม่เอง — reloadKey ใช้บังคับโหลดซ้ำหลัง CRUD สำเร็จ
  const [reloadKey, setReloadKey] = useState(0)

  const listUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    params.set("page", String(page))
    params.set("_r", String(reloadKey))
    return `/api/admin/products?${params.toString()}`
  }, [debouncedSearch, page, reloadKey])

  const list = useAdminResource<AdminProductsResponse>(listUrl)
  const categories = useAdminResource<CategoriesResponse>("/api/admin/categories")

  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<AdminProduct | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const refreshList = useCallback(() => setReloadKey((key) => key + 1), [])

  const openCreate = () => {
    setEditing(null)
    setIsFormOpen(true)
  }

  const openEdit = (product: AdminProduct) => {
    setEditing(product)
    setIsFormOpen(true)
  }

  const handleSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true)
    try {
      if (editing) {
        await requestJson(`/api/admin/products/${editing.id}`, {
          method: "PUT",
          body: values,
        })
        notifySuccess("แก้ไขสินค้าสำเร็จ")
      } else {
        await requestJson("/api/admin/products", { method: "POST", body: values })
        notifySuccess("เพิ่มสินค้าสำเร็จ")
      }
      setIsFormOpen(false)
      setEditing(null)
      refreshList()
    } catch (error) {
      notifyError(toErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      await requestJson(`/api/admin/products/${deleting.id}`, { method: "DELETE" })
      notifySuccess(`ลบ "${deleting.name}" แล้ว`)
      setDeleting(null)
      refreshList()
    } catch (error) {
      // เคสสินค้าถูกใช้ในคำสั่งซื้อจะมาทางนี้ พร้อมข้อความอธิบายจาก API
      notifyError(toErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  const products = list.data?.products ?? []
  const totalPages = list.data?.totalPages ?? 1
  const currentPage = list.data?.page ?? page

  return (
    <div className="flex flex-col gap-6" data-testid="products-admin">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="ค้นหาชื่อสินค้า..."
            className="pl-9"
            data-testid="product-search"
          />
        </div>

        <Button onClick={openCreate} data-testid="product-create">
          <Plus className="size-4" /> เพิ่มสินค้า
        </Button>
      </div>

      <AsyncSection
        isLoading={list.isLoading}
        error={list.error}
        onRetry={list.reload}
        testId="product-table"
        skeletonCount={1}
      >
        {products.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground" data-testid="product-table-empty">
            ไม่พบสินค้า
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-right">ราคา</TableHead>
                <TableHead className="text-right">เครื่องมือ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow
                  key={product.id}
                  data-testid="product-row"
                  data-product-id={product.id}
                >
                  <TableCell>{product.id}</TableCell>
                  <TableCell data-testid="product-row-name">{product.name}</TableCell>
                  <TableCell>{product.categoryName ?? "-"}</TableCell>
                  <TableCell className="text-right" data-testid="product-row-price">
                    {formatTHB(product.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      className="mr-2"
                      onClick={() => openEdit(product)}
                      data-testid="product-edit"
                      aria-label={`แก้ไข ${product.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeleting(product)}
                      data-testid="product-delete"
                      aria-label={`ลบ ${product.name}`}
                    >
                      <Trash className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AsyncSection>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          data-testid="product-prev"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground" data-testid="product-pagination">
          หน้า {currentPage} จาก {totalPages} ({list.data?.total ?? 0} รายการ)
        </span>
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          data-testid="product-next"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <ProductFormDialog
        open={isFormOpen}
        product={editing}
        categories={categories.data?.categories ?? []}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsFormOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <DeleteProductDialog
        product={deleting}
        isDeleting={isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
