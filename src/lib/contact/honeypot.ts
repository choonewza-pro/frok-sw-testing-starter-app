/**
 * ช่อง honeypot เป็น input ที่ซ่อนไว้ คนจริงจะไม่กรอก แต่บอทมักกรอกอัตโนมัติ
 *
 * ระวัง: เดิมเขียนว่า `input.website?.trim() !== ""` ซึ่งเมื่อ website เป็น undefined
 * จะได้ `undefined !== ""` เป็น true → ระบบตีว่าเป็นบอท แล้วเงียบไปโดยไม่ส่งอีเมล
 * ฟังก์ชันนี้จึงแปลงค่าว่าง/undefined ให้เป็น "" ก่อนเทียบเสมอ
 */
export function isBotSubmission(website: string | undefined | null): boolean {
  return (website ?? "").trim() !== ""
}
