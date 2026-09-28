import { env } from '../config/env.js';

export const sendInvitationEmail = async ({ email, name, role, zoneNames = [], rawToken, password = null }) => {
  const appUrl = env.APP_URL || 'http://localhost:5173';
  const loginUrl = `${appUrl}/login`;
  const inviteUrl = rawToken ? `${appUrl}/accept-invite?token=${rawToken}` : loginUrl;
  const roleDisplay = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Staff Member';
  const zonesDisplay = zoneNames.length > 0 ? zoneNames.join(', ') : 'All / Organization-wide';

  const subject = "You're invited to Assetly - Credentials & Access Link";
  const bodyText = `Hello ${name},

You have been assigned a new account on Assetly.

Role:
${roleDisplay}

Assigned Zone(s):
${zonesDisplay}

Login Credentials:
Email: ${email}
${password ? `Password: ${password}\n` : ''}
Direct Login Link: ${loginUrl}
${rawToken ? `One-Click Activation Link: ${inviteUrl}\n` : ''}

You can log in directly at ${loginUrl} using your assigned credentials.`;

  console.log(`\n========================================`);
  console.log(`📧 INVITATION EMAIL SENT TO: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Email ID: ${email}`);
  if (password) console.log(`Password: ${password}`);
  console.log(`Login URL: ${loginUrl}`);
  if (rawToken) console.log(`Activation Link: ${inviteUrl}`);
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
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #0D3A35;">Hello ${name},</h2>
          <p>You have been assigned a staff account on <strong>Assetly Infrastructure Platform</strong>.</p>
          
          <div style="background-color: #f4f6f5; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Role:</strong> ${roleDisplay}</p>
            <p style="margin: 5px 0;"><strong>Assigned Zone(s):</strong> ${zonesDisplay}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            ${password ? `<p style="margin: 5px 0;"><strong>Initial Password:</strong> <code style="background:#e0e0e0; padding:2px 6px; border-radius:4px;">${password}</code></p>` : ''}
          </div>

          <p style="margin: 25px 0; display: flex; gap: 10px;">
            <a href="${loginUrl}" style="background-color: #0D3A35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Login Portal</a>
          </p>

          ${rawToken ? `<p><small>Alternatively, set your own password via activation link: <a href="${inviteUrl}">${inviteUrl}</a></small></p>` : ''}
        </div>`
      });
      console.log(`✅ Email sent successfully to ${email}`);
    } catch (err) {
      console.error(`❌ Failed to send email via SMTP:`, err.message);
    }
  }
};
