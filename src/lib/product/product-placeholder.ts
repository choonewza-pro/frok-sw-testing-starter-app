/**
 * รูปแทนสินค้าเมื่อไม่มีไฟล์ภาพจริง เก็บเป็น data URI เพื่อไม่ต้องยิง request เพิ่ม
 * แยกออกมาเพื่อให้ทั้งหน้าแรกและหน้าสินค้าใช้ภาพเดียวกัน
 */
export const PRODUCT_PLACEHOLDER_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e7e5e4"/>
      <stop offset="1" stop-color="#d6d3d1"/>
    </linearGradient>
  </defs>
  <rect width="600" height="750" fill="url(#g)"/>
  <g fill="none" stroke="#a8a29e" stroke-width="8" stroke-linejoin="round" stroke-linecap="round" opacity="0.6">
    <path d="M300 260l160 93v185l-160 93-160-93V353z"/>
    <path d="M300 260l160 93-160 93-160-93z"/>
    <path d="M300 446v185"/>
  </g>
</svg>`.trim()
)}`
