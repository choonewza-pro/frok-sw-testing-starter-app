"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { contactSchema, type ContactFormValues } from "@/lib/contact-schema"
import { submitContactForm } from "./actions"

type ContactFormState = "idle" | "pending" | "success" | "error"

const inputFields: {
  name: keyof ContactFormValues
  label: string
  type: string
  placeholder: string
  autoComplete?: string
}[] = [
  {
    name: "name",
    label: "ชื่อ",
    type: "text",
    placeholder: "สมชาย ใจดี",
    autoComplete: "name",
  },
  {
    name: "email",
    label: "อีเมล",
    type: "email",
    placeholder: "you@example.com",
    autoComplete: "email",
  },
  {
    name: "subject",
    label: "หัวข้อ",
    type: "text",
    placeholder: "สอบถามสินค้า / หลักสูตร",
  },
]

export default function ContactForm() {
  const [status, setStatus] = useState<ContactFormState>("idle")
  const [message, setMessage] = useState("")

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  })

  async function onSubmit(
    data: ContactFormValues,
    event?: React.BaseSyntheticEvent
  ) {
    if (status === "pending") return
    setStatus("pending")
    setMessage("")

    try {
      const website =
        new FormData(event?.currentTarget as HTMLFormElement).get("website")?.toString() ??
        ""
      const result = await submitContactForm({ ...data, website })
      if (result.ok) {
        setStatus("success")
        setMessage("ส่งข้อความสำเร็จ ทีมงานจะติดต่อกลับโดยเร็วที่สุด")
        form.reset()
        return
      }
      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          const field = key as keyof ContactFormValues
          if (messages?.[0]) {
            form.setError(field, { message: messages[0] })
          }
        }
        setStatus("idle")
        return
      }
      setStatus("error")
      setMessage(result.message ?? "ไม่สามารถส่งข้อความได้ กรุณาลองใหม่ภายหลัง")
    } catch {
      setStatus("error")
      setMessage("เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่ภายหลัง")
    }
  }

  return (
    <div className="rounded-xl border p-6">
      <h3 className="font-medium text-xl tracking-[-0.015em]">ส่งข้อความถึงเรา</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        กรอกข้อมูลด้านล่างแล้วเราจะติดต่อกลับภายใน 1-2 วันทำการ
      </p>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        data-testid="contact-form"
        className="mt-6"
      >
        <FieldGroup>
          {inputFields.map(({ name, label, type, placeholder, autoComplete }) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`contact-${name}`}>{label}</FieldLabel>
                  <Input
                    {...field}
                    id={`contact-${name}`}
                    data-testid={`contact-${name}`}
                    type={type}
                    autoComplete={autoComplete}
                    aria-invalid={fieldState.invalid}
                    placeholder={placeholder}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          ))}
          <Controller
            name="message"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contact-message">ข้อความ</FieldLabel>
                <Textarea
                  {...field}
                  id="contact-message"
                  data-testid="contact-message"
                  aria-invalid={fieldState.invalid}
                  placeholder="รายละเอียดข้อความของคุณ..."
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <div
            aria-hidden="true"
            className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
          >
            <input
              id="contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </div>

          {status === "success" && (
            <p
              role="status"
              data-testid="contact-success"
              className="rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
            >
              {message}
            </p>
          )}

          {status === "error" && (
            <p
              role="alert"
              data-testid="contact-error"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {message}
            </p>
          )}

          <Button
            type="submit"
            data-testid="contact-submit"
            disabled={status === "pending"}
            className="w-full sm:w-auto"
          >
            {status === "pending" && <Spinner className="size-4" />}
            {status === "pending" ? "กำลังส่ง..." : "ส่งข้อความ"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
