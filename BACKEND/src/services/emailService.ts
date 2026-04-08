import { Resend } from 'resend';
 
// Resend client — only initialised when API key is present
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
 
const FROM = process.env.EMAIL_FROM ?? 'reserVUT <noreply@reservut.cz>';
 
// ── Helpers ───────────────────────────────────────────────────────────────────
 
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}
 
function baseHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <!-- header -->
        <tr>
          <td style="background:#7c3aed;padding:24px 32px;display:flex;align-items:center;gap:8px;">
            <span style="background:#e11d48;color:#fff;font-weight:900;font-size:18px;padding:4px 10px;border-radius:6px;">T</span>
            <span style="background:#fff;color:#374151;font-weight:900;font-size:18px;padding:4px 10px;border-radius:6px;">FP</span>
            <span style="color:#fff;font-size:14px;font-weight:600;margin-left:12px;opacity:.9;">reserVUT</span>
          </td>
        </tr>
        <!-- body -->
        <tr><td style="padding:32px;">${body}</td></tr>
        <!-- footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
              reserVUT · Technická fakulta FP · Tento email byl vygenerován automaticky, neodpovídejte na něj.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
 
async function send(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error('[email] Resend error:', error);
    else console.log(`[email] Sent "${subject}" to ${to}`);
  } catch (e) {
    console.error('[email] Send failed:', e);
  }
}
 
// ── Public API ────────────────────────────────────────────────────────────────
 
export async function sendWelcomeEmail(to: string, firstName: string): Promise<void> {
  const html = baseHtml('Vítejte v reserVUT', `
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Vítejte, ${firstName}! 🎉</h1>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">
      Váš účet v systému <strong>reserVUT</strong> byl úspěšně vytvořen.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;border-radius:10px;padding:16px;margin-bottom:20px;">
      <tr><td>
        <p style="margin:0;font-size:13px;color:#374151;">
          ✅ Nyní se můžete přihlásit jako <strong>Student</strong> a rezervovat místnosti.<br/>
          🔒 Pokud chcete roli <em>Leader</em> nebo <em>Guide</em>, počkejte na ověření od Head Admina.
        </p>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      V případě dotazů kontaktujte správce systému.
    </p>
  `);
  await send(to, 'Vítejte v reserVUT — účet vytvořen', html);
}
 
export async function sendReservationConfirmation(params: {
  to: string;
  firstName: string;
  roomName: string;
  startTime: string;
  endTime: string;
  description?: string;
  type: string;
}): Promise<void> {
  const { to, firstName, roomName, startTime, endTime, description, type } = params;
  const html = baseHtml('Rezervace potvrzena', `
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Rezervace potvrzena ✅</h1>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">
      Ahoj <strong>${firstName}</strong>, tvoje rezervace byla úspěšně vytvořena.
    </p>
    <table width="100%" cellpadding="12" cellspacing="0" style="background:#f3f4f6;border-radius:10px;margin-bottom:20px;">
      <tr>
        <td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding-bottom:2px;">Místnost</td>
      </tr>
      <tr>
        <td style="font-size:16px;font-weight:700;color:#111827;padding-top:0;">${roomName}</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding-bottom:2px;padding-top:12px;">Čas</td>
      </tr>
      <tr>
        <td style="font-size:15px;font-weight:600;color:#374151;padding-top:0;">
          ${formatDateTime(startTime)} – ${new Date(endTime).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
        </td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding-bottom:2px;padding-top:12px;">Typ</td>
      </tr>
      <tr>
        <td style="font-size:14px;color:#374151;padding-top:0;">${type}</td>
      </tr>
      ${description ? `
      <tr>
        <td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding-bottom:2px;padding-top:12px;">Popis</td>
      </tr>
      <tr>
        <td style="font-size:14px;color:#374151;padding-top:0;">${description}</td>
      </tr>` : ''}
    </table>
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Rezervaci můžeš zrušit kdykoliv přes aplikaci reserVUT.
    </p>
  `);
  await send(to, `Rezervace potvrzena — ${roomName}`, html);
}
 
export async function sendCancellationEmail(params: {
  to: string;
  firstName: string;
  roomName: string;
  startTime: string;
  cancelledBy?: string; // name of person who cancelled (if not self)
}): Promise<void> {
  const { to, firstName, roomName, startTime, cancelledBy } = params;
  const byAdmin = cancelledBy ? ` administrátorem <strong>${cancelledBy}</strong>` : '';
  const html = baseHtml('Rezervace zrušena', `
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Rezervace zrušena ❌</h1>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">
      Ahoj <strong>${firstName}</strong>, tvoje rezervace byla zrušena${byAdmin}.
    </p>
    <table width="100%" cellpadding="12" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin-bottom:20px;">
      <tr>
        <td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding-bottom:2px;">Místnost</td>
      </tr>
      <tr>
        <td style="font-size:16px;font-weight:700;color:#111827;padding-top:0;">${roomName}</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding-bottom:2px;padding-top:12px;">Původní čas</td>
      </tr>
      <tr>
        <td style="font-size:15px;font-weight:600;color:#374151;padding-top:0;">${formatDateTime(startTime)}</td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#6b7280;">
      Pokud máš zájem, můžeš si vytvořit novou rezervaci přes aplikaci reserVUT.
    </p>
  `);
  await send(to, `Rezervace zrušena — ${roomName}`, html);
}
 
export async function sendPreemptionEmail(params: {
  to: string;
  firstName: string;
  roomName: string;
  startTime: string;
  preemptedByRole: string;
}): Promise<void> {
  const { to, firstName, roomName, startTime, preemptedByRole } = params;
  const roleLabel = preemptedByRole === 'HEAD_ADMIN' ? 'Head Admin' : preemptedByRole === 'GUIDE' ? 'Guide' : 'Leader';
  const html = baseHtml('Tvoje rezervace byla přepsána', `
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Rezervace přepsána ⚠️</h1>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">
      Ahoj <strong>${firstName}</strong>, tvoje rezervace byla automaticky přepsána rezervací s vyšší prioritou (<strong>${roleLabel}</strong>).
    </p>
    <table width="100%" cellpadding="12" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:20px;">
      <tr>
        <td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding-bottom:2px;">Místnost</td>
      </tr>
      <tr>
        <td style="font-size:16px;font-weight:700;color:#111827;padding-top:0;">${roomName}</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding-bottom:2px;padding-top:12px;">Čas</td>
      </tr>
      <tr>
        <td style="font-size:15px;font-weight:600;color:#374151;padding-top:0;">${formatDateTime(startTime)}</td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#6b7280;">
      Zkus si najít jiný volný termín v aplikaci reserVUT.
    </p>
  `);
  await send(to, `Tvoje rezervace v ${roomName} byla přepsána`, html);
}