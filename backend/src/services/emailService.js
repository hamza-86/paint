/**
 * emailService.js
 * ───────────────
 * Thin wrapper around nodemailer for sending transactional OTP emails.
 *
 * Required environment variables (set in Render dashboard for production):
 *   EMAIL_HOST   — SMTP host  (e.g. smtp.gmail.com)
 *   EMAIL_PORT   — SMTP port  (e.g. 587 for STARTTLS, 465 for SSL)
 *   EMAIL_USER   — SMTP login username
 *   EMAIL_PASS   — SMTP password / App Password (NEVER logged or exposed)
 *   EMAIL_FROM   — Sender address (e.g. "Paint Shop <noreply@example.com>")
 *
 * The OTP value is accepted as a parameter and embedded in email HTML.
 * It is NEVER logged, returned in a response, or stored plaintext.
 */

import nodemailer from 'nodemailer';

/**
 * Build a one-time transporter for each send.
 * Using `createTransport` each call avoids stale connection issues
 * on long-running serverless/Render instances.
 */
function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'Email service is not configured. ' +
        'Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM ' +
        'in your environment variables.'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for port 465 (SSL), false for 587 (STARTTLS)
    auth: { user, pass },
  });
}

/**
 * sendOtpEmail(to, otp, purpose)
 * ──────────────────────────────
 * Sends a branded OTP email to the specified address.
 *
 * @param {string} to      — Recipient email address
 * @param {string} otp     — 6-digit OTP string (handled here only, never stored)
 * @param {'email_change'|'password_change'} purpose
 * @returns {Promise<void>}
 */
export async function sendOtpEmail(to, otp, purpose) {
  const transporter = createTransporter();

  const subjectMap = {
    email_change: 'Verify your new email address — Paint Shop',
    password_change: 'Verify your password change — Paint Shop',
  };

  const headingMap = {
    email_change: 'Verify Your New Email Address',
    password_change: 'Verify Your Password Change',
  };

  const bodyMap = {
    email_change:
      'You requested an email address change for your Paint Shop admin account. ' +
      'Enter the verification code below to confirm your new email address.',
    password_change:
      'You requested a password change for your Paint Shop admin account. ' +
      'Enter the verification code below to confirm the change.',
  };

  const subject = subjectMap[purpose] || 'Verification Code — Paint Shop';
  const heading = headingMap[purpose] || 'Your Verification Code';
  const bodyText = bodyMap[purpose] || 'Use the code below to complete your request.';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1e40af;padding:28px 32px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                🎨 Paint Shop
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#bfdbfe;">
                Painter Management Platform
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 24px;">
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0f172a;">
                ${heading}
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#475569;line-height:1.6;">
                ${bodyText}
              </p>
              <!-- OTP Box -->
              <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748b;letter-spacing:1px;text-transform:uppercase;">
                  Verification Code
                </p>
                <p style="margin:0;font-size:38px;font-weight:800;color:#1e40af;letter-spacing:8px;font-family:'Courier New',monospace;">
                  ${otp}
                </p>
              </div>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">
                ⏱ This code expires in <strong>10 minutes</strong>.
              </p>
              <p style="margin:0;font-size:13px;color:#64748b;">
                🔒 If you did not request this, please ignore this email. Your account remains secure.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                This is an automated message from your Paint Shop admin system.
                Do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    // Plain-text fallback (no OTP in logs — only the format string)
    text: `${heading}\n\n${bodyText}\n\nYour verification code: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
  });
}
