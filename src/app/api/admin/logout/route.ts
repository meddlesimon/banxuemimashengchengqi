import { NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
    await clearAdminSession(request);
    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', 'admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');
    return response;
}
