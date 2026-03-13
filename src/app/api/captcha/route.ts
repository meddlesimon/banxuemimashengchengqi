import { NextResponse } from 'next/server';
import crypto from 'crypto';

function generateCode(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
}

function generateSvg(code: string): string {
    const width = 120;
    const height = 40;
    const chars = code.split('');

    const lines = Array.from({ length: 4 }, () => {
        const x1 = Math.random() * width;
        const y1 = Math.random() * height;
        const x2 = Math.random() * width;
        const y2 = Math.random() * height;
        const color = `hsl(${Math.random() * 360},50%,60%)`;
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="1.5"/>`;
    }).join('');

    const dots = Array.from({ length: 30 }, () => {
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        const color = `hsl(${Math.random() * 360},50%,60%)`;
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.2" fill="${color}"/>`;
    }).join('');

    const texts = chars.map((ch, i) => {
        const x = 18 + i * 24 + (Math.random() * 6 - 3);
        const y = 26 + (Math.random() * 6 - 3);
        const rotate = Math.random() * 20 - 10;
        const color = `hsl(${Math.random() * 360},60%,35%)`;
        return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" transform="rotate(${rotate.toFixed(1)},${x.toFixed(1)},${y.toFixed(1)})" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="${color}">${ch}</text>`;
    }).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f8fafc" rx="8"/>${lines}${dots}${texts}</svg>`;
}

const SECRET = process.env.JWT_SECRET || 'captcha-secret-key';

export async function GET() {
    const code = generateCode();
    const svg = generateSvg(code);
    const svgBase64 = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

    // token = base64(code:expires:hmac)，放在响应 JSON 里，前端存 state，提交时带上
    const expires = Date.now() + 5 * 60 * 1000;
    const payload = `${code}:${expires}`;
    const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    const token = Buffer.from(`${payload}:${hmac}`).toString('base64url');

    return NextResponse.json(
        { token, img: svgBase64 },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}
