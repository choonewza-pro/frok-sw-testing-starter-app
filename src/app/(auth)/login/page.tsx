"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { loginSchema, type LoginFormValues } from "@/lib/auth-schema"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

export default function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
        await authClient.signIn.email({
          email: data.email,
          password: data.password,
         }, {
            onSuccess: () => {
              toast.success('เข้าระบบสำเร็จ');
              setTimeout(() => router.replace('/'), 1200);
            },
            onError: (ctx) => {
              toast.error(ctx.error.message ?? JSON.stringify(ctx.error));
            }
         });
  }

  return (
  <div className="min-h-screen flex items-center justify-center">
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>เข้าสู่ระบบ</CardTitle>
        <CardDescription>
          กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-login" data-testid="login-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-login-email">อีเมล</FieldLabel>
                  <Input
                    {...field}
                    id="form-login-email"
                    data-testid="login-email"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-login-password">
                    รหัสผ่าน
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-login-password"
                    data-testid="login-password"
                    type="password"
                    aria-invalid={fieldState.invalid}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button type="submit" form="form-login" data-testid="login-submit" className="w-full">
          เข้าสู่ระบบ
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ยังไม่มีบัญชี?{" "}
          <a href="/signup" className="underline underline-offset-4 hover:text-primary">
            สมัครสมาชิก
          </a>
        </p>
      </CardFooter>
    </Card>
    </div>
  )
}