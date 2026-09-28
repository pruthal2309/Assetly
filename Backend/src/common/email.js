import { env } from '../config/env.js';

export const sendInvitationEmail = async ({ email, name, role, zoneNames = [], rawToken }) => {
  const appUrl = env.APP_URL || 'http://localhost:5173';
  const inviteUrl = `${appUrl}/accept-invite?token=${rawToken}`;
  const roleDisplay = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Staff Member';
  const zonesDisplay = zoneNames.length > 0 ? zoneNames.join(', ') : 'All / Organization-wide';

  const subject = "You're invited to Assetly";
  const bodyText = `Hello ${name},

You have been invited to join Assetly.

Role:
${roleDisplay}

Assigned Zone(s):
${zonesDisplay}

Click the link below to activate your Assetly account:
${inviteUrl}

This invitation expires in 24 hours.

If you did not expect this invitation, you can ignore this email.`;

  console.log(`\n========================================`);
  console.log(`📧 INVITATION EMAIL TO: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`URL: ${inviteUrl}`);
  console.log(`========================================\n`);

  if (env.EMAIL_HOST && env.EMAIL_USER) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        secure: env.EMAIL_PORT === 465,
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD
        }
      });

      await transporter.sendMail({
        from: env.EMAIL_FROM || '"Assetly" <no-reply@assetly.com>',
        to: email,
        subject,
        text: bodyText,
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hello ${name},</h2>
          <p>You have been invited to join <strong>Assetly</strong>.</p>
          <p><strong>Role:</strong> ${roleDisplay}</p>
          <p><strong>Assigned Zone(s):</strong> ${zonesDisplay}</p>
          <p style="margin: 25px 0;">
            <a href="${inviteUrl}" style="background-color: #0D3A35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
          </p>
          <p><small>This invitation expires in 24 hours.</small></p>
          <p><small>If you did not expect this invitation, you can ignore this email.</small></p>
        </div>`
      });
      console.log(`✅ Email sent successfully to ${email}`);
    } catch (err) {
      console.error(`❌ Failed to send email via SMTP:`, err.message);
    }
  }
};
