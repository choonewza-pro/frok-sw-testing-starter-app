import { z } from "zod"

/**
 * รูปร่างข้อมูลที่คาดหวังจาก API ภายนอก
 * validate ก่อนใช้เสมอ เพราะ API ที่เราไม่ได้เป็นเจ้าของเปลี่ยนรูปแบบเมื่อไหร่ก็ได้
 */
export const courseSchema = z.object({
  id: z.number(),
  title: z.string(),
  detail: z.string(),
  date: z.string(),
  view: z.number(),
  picture: z.url(),
})

export const courseResponseSchema = z.object({
  data: z.array(courseSchema),
})

export type CourseResponse = z.infer<typeof courseResponseSchema>
