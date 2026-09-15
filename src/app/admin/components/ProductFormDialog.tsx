"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  parseNumberInput,
  productSchema,
  type ProductFormValues,
} from "@/lib/admin/product-schema"
import type { AdminCategory, AdminProduct } from "@/types/admin"

type Props = {
  open: boolean
  /** null = โหมดเพิ่มสินค้า, มีค่า = โหมดแก้ไข — ฟอร์มเดียวใช้ทั้งสองโหมด */
  product: AdminProduct | null
  categories: AdminCategory[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: ProductFormValues) => Promise<void>
}

const EMPTY: ProductFormValues = { name: "", description: "", price: 0, categoryId: 0 }

export default function ProductFormDialog({
  open,
  product,
  categories,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const isEdit = product !== null

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY,
  })

  const { reset } = form
  useEffect(() => {
    if (!open) return
    reset(
      product
        ? {
            name: product.name,
            description: product.description,
            price: product.price,
            categoryId: product.categoryId ?? 0,
          }
        : EMPTY
    )
  }, [open, product, reset])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent data-testid="product-form-dialog">
        <DialogHeader>
          <DialogTitle data-testid="product-form-title">
            {isEdit ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}
          </DialogTitle>
        </DialogHeader>

        <form
          id="product-form"
          noValidate
          data-testid="product-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <fieldset disabled={isSubmitting} className="border-0 p-0">
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-name">ชื่อสินค้า</FieldLabel>
                    <Input
                      {...field}
                      id="product-name"
                      data-testid="product-name-input"
                      aria-invalid={fieldState.invalid}
                      placeholder="เช่น iPhone 16 Pro"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-description">
                      รายละเอียด (ไม่บังคับ)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      id="product-description"
                      data-testid="product-description-input"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="price"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-price">ราคา (บาท)</FieldLabel>
                    <Input
                      id="product-price"
                      data-testid="product-price-input"
                      type="text"
                      inputMode="decimal"
                      aria-invalid={fieldState.invalid}
                      value={field.value === 0 ? "" : String(field.value)}
                      onBlur={field.onBlur}
                      // <input> คืน string เสมอ แปลงเป็นตัวเลขก่อนเข้า schema
                      onChange={(e) => field.onChange(parseNumberInput(e.target.value) ?? 0)}
                      placeholder="0.00"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="categoryId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-category">หมวดหมู่</FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger
                        id="product-category"
                        data-testid="product-category-select"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={String(category.id)}
                            data-testid={`product-category-option-${category.id}`}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldGroup>
          </fieldset>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="product-form-cancel"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            form="product-form"
            disabled={isSubmitting}
            data-testid="product-form-submit"
          >
            {isSubmitting && <Spinner className="size-4" />}
            {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
