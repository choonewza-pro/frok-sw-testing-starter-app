import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
    // ประกาศ field เพิ่มเองแทนการ import type ของ server
    // เพื่อไม่ให้โมดูลฝั่ง server (prisma) ถูกลากเข้ามาใน bundle ฝั่ง client
    plugins: [
        inferAdditionalFields({
            user: {
                role: { type: 'string', required: false, input: false },
            },
        }),
    ],
});
