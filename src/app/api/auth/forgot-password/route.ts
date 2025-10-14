import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a reset link will be sent',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    // Send password reset email
    try {
      const emailResult = await sendPasswordResetEmail({
        email: user.email,
        resetUrl,
        userName: user.name || undefined,
      });

      if (emailResult.success) {
        console.log(`✅ Password reset email sent to ${user.email}`);
      } else {
        console.error(`❌ Failed to send password reset email: ${emailResult.error}`);
        // Continue anyway - token is saved, user might try manual link
      }
    } catch (emailError) {
      console.error('❌ Error sending password reset email:', emailError);
      // Continue anyway - token is saved
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a reset link will be sent',
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
