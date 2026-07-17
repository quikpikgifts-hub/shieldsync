export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export type EmailTemplateKey = "email-verification" | "password-reset" | "new-device-login-alert";

/**
 * Every variable interpolated into HTML is escaped — templates receive
 * `Record<string, string>` from arbitrary call sites (including, indirectly, a display
 * name a user chose for themselves), and it would be a stored/reflected XSS bug in the
 * rendered email client the moment one of those strings contains `<script>` or similar.
 * Plain-text bodies don't need escaping (no markup context to break out of).
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapHtml(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="font-family: -apple-system, Helvetica, Arial, sans-serif; background:#f6f6f7; padding:24px; margin:0;">
    <table role="presentation" width="100%" style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:8px; padding:32px;">
      <tr><td>
        <h1 style="font-size:20px; margin:0 0 16px;">Ember</h1>
        ${bodyHtml}
        <p style="color:#8a8a8e; font-size:12px; margin-top:32px;">
          If you didn't expect this email, you can safely ignore it.
        </p>
      </td></tr>
    </table>
  </body>
</html>`;
}

function renderEmailVerification(variables: Record<string, string>): RenderedEmail {
  const link = variables.verificationLink;
  return {
    subject: "Verify your email address",
    html: wrapHtml(`
      <p>Confirm your email address to finish setting up your account.</p>
      <p><a href="${escapeHtml(link)}" style="display:inline-block; background:#ff5864; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none;">Verify email</a></p>
      <p style="color:#8a8a8e; font-size:13px;">This link expires in ${escapeHtml(variables.expiresInHours)} hours.</p>
    `),
    text: `Confirm your email address: ${link}\n\nThis link expires in ${variables.expiresInHours} hours.`,
  };
}

function renderPasswordReset(variables: Record<string, string>): RenderedEmail {
  const link = variables.resetLink;
  return {
    subject: "Reset your password",
    html: wrapHtml(`
      <p>We received a request to reset your password.</p>
      <p><a href="${escapeHtml(link)}" style="display:inline-block; background:#ff5864; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none;">Reset password</a></p>
      <p style="color:#8a8a8e; font-size:13px;">This link expires in ${escapeHtml(variables.expiresInMinutes)} minutes. If you didn't request this, your password is still safe — no action is needed.</p>
    `),
    text:
      `Reset your password: ${link}\n\nThis link expires in ${variables.expiresInMinutes} minutes. ` +
      "If you didn't request this, your password is still safe — no action is needed.",
  };
}

function renderNewDeviceLoginAlert(variables: Record<string, string>): RenderedEmail {
  return {
    subject: "New sign-in to your account",
    html: wrapHtml(`
      <p>We noticed a sign-in from a new device or location:</p>
      <ul style="color:#3a3a3c;">
        <li>Device: ${escapeHtml(variables.userAgent)}</li>
        <li>Location/IP: ${escapeHtml(variables.ipAddress)}</li>
      </ul>
      <p style="color:#8a8a8e; font-size:13px;">If this was you, no action is needed. If you don't recognize this activity, change your password immediately.</p>
    `),
    text:
      `We noticed a sign-in from a new device or location.\nDevice: ${variables.userAgent}\nLocation/IP: ${variables.ipAddress}\n\n` +
      "If this was you, no action is needed. If you don't recognize this activity, change your password immediately.",
  };
}

const RENDERERS: Record<EmailTemplateKey, (variables: Record<string, string>) => RenderedEmail> = {
  "email-verification": renderEmailVerification,
  "password-reset": renderPasswordReset,
  "new-device-login-alert": renderNewDeviceLoginAlert,
};

export function renderEmailTemplate(templateKey: string, variables: Record<string, string>): RenderedEmail {
  const renderer = RENDERERS[templateKey as EmailTemplateKey];
  if (!renderer) {
    throw new Error(`Unknown email template key: "${templateKey}"`);
  }
  return renderer(variables);
}
