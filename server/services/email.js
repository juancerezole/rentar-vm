import { Resend } from 'resend';
import { config } from '../config.js';
import logger from '../logger.js';

const resend = config.email.resendApiKey ? new Resend(config.email.resendApiKey) : null;

export async function sendPasswordReset(email, nombre, resetUrl) {
  // Sin API key: log en consola para desarrollo local.
  if (!resend) {
    logger.info({ to: email, resetUrl }, '[email DEV] password reset link');
    return;
  }

  await resend.emails.send({
    from:    config.email.from,
    to:      email,
    subject: 'Recuperá tu contraseña — Rentar',
    html:    buildResetEmail(nombre, resetUrl),
  });
}

function buildResetEmail(nombre, resetUrl) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#F7F9FC;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #E1E5EA;padding:40px;">
        <tr><td>
          <div style="font-size:22px;font-weight:800;color:#1E3A5F;margin-bottom:24px;letter-spacing:-0.5px;">
            Rentar
          </div>
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#2B2F33;">
            Recuperá tu contraseña
          </h1>
          <p style="margin:0 0 8px;color:#6E757D;font-size:15px;line-height:1.6;">
            Hola <strong>${nombre}</strong>, recibimos una solicitud para restablecer
            la contraseña de tu cuenta en Rentar.
          </p>
          <p style="margin:0 0 28px;color:#6E757D;font-size:15px;line-height:1.6;">
            El link es válido por <strong>1 hora</strong>.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#1E3A5F;color:#ffffff;text-decoration:none;
                    padding:13px 28px;border-radius:10px;font-weight:600;font-size:15px;">
            Restablecer contraseña
          </a>
          <p style="margin:28px 0 0;color:#9BA3AC;font-size:12px;line-height:1.6;">
            Si no solicitaste esto, ignorá este email. Tu contraseña no va a cambiar.<br/>
            Si el botón no funciona, copiá este link: <br/>
            <a href="${resetUrl}" style="color:#4F8CC9;word-break:break-all;">${resetUrl}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
