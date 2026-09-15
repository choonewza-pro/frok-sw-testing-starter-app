import { toast } from "react-toastify"

/**
 * ห่อ toast ไว้ชั้นหนึ่ง เพื่อติด class คงที่ให้ e2e จับได้
 * (react-toastify ไม่รับ data-testid ตรง ๆ และการใช้ toastId ซ้ำจะทำให้ toast ที่สองถูกกลืน)
 *
 * เลือกใน Playwright ด้วย `.admin-toast-success` / `.admin-toast-error`
 */
export const TOAST_CLASS = {
  success: "admin-toast admin-toast-success",
  error: "admin-toast admin-toast-error",
} as const

export function notifySuccess(message: string) {
  toast.success(message, { className: TOAST_CLASS.success })
}

export function notifyError(message: string) {
  toast.error(message, { className: TOAST_CLASS.error })
}
