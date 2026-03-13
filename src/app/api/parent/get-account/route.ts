import { NextResponse } from 'next/server';

/**
 * 短信验证码取号接口已下线
 * 新流程：手机号 + 密码 + 腾讯云图形验证码
 */
export async function POST() {
    return NextResponse.json({
        success: false,
        message: '短信验证码登录已下线，请使用手机号+密码+图形验证码完成登录。'
    }, { status: 410 });
}
