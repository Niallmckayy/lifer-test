import { Resend } from 'resend'

// Lazy — avoids throwing at module load time when key is not yet set
function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? '')
}

const FROM = () => process.env.RESEND_FROM_EMAIL ?? 'updates@example.com'

export async function sendDraftReadyEmail(
  to: string,
  clientName: string,
  dashboardUrl: string,
): Promise<void> {
  await getResend().emails.send({
    from: FROM(),
    to,
    subject: `Your website draft is ready — ${clientName}`,
    text: [
      `Hi,`,
      ``,
      `Your website draft is ready to preview.`,
      ``,
      `Log in to your dashboard to review it and request any changes:`,
      dashboardUrl,
      ``,
      `Studio`,
    ].join('\n'),
  })
}

export async function sendDeployedEmail(
  to: string,
  clientName: string,
  liveUrl: string,
): Promise<void> {
  await getResend().emails.send({
    from: FROM(),
    to,
    subject: `Your website is now live — ${clientName}`,
    text: [
      `Hi,`,
      ``,
      `Your website update is now live:`,
      liveUrl,
      ``,
      `Studio`,
    ].join('\n'),
  })
}
