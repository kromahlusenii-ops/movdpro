import sgMail from '@sendgrid/mail'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

// Remove trailing slash if present to avoid double slashes in URLs
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://movdaway.com').replace(/\/$/, '')
const FROM_EMAIL = process.env.FROM_EMAIL || 'lou@civicvoices.ai'

interface SendMagicLinkParams {
  to: string
  token: string
}

export async function sendMagicLinkEmail({ to, token }: SendMagicLinkParams): Promise<{ success: boolean; error?: string }> {
  const magicLinkUrl = `${APP_URL}/auth/verify?token=${token}`

  if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set - cannot send magic link email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: 'Your movd away login link',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 48px; height: 48px; background: #2563eb; border-radius: 12px; line-height: 48px; color: white; font-weight: bold; font-size: 24px;">m</div>
              </div>

              <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 16px; text-align: center;">
                Sign in to movd away
              </h1>

              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Click the button below to securely sign in to your account. This link expires in 15 minutes.
              </p>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${magicLinkUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px;">
                  Sign in to movd away
                </a>
              </div>

              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0; text-align: center;">
                If you didn't request this email, you can safely ignore it.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${magicLinkUrl}" style="color: #2563eb; word-break: break-all;">${magicLinkUrl}</a>
              </p>
            </div>
          </body>
        </html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send magic link email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

interface SendConfirmationEmailParams {
  to: string
  sessionId: string
}

export async function sendConfirmationEmail({ to, sessionId }: SendConfirmationEmailParams): Promise<{ success: boolean; error?: string }> {
  const reportUrl = `${APP_URL}/report/${sessionId}`
  const loginUrl = `${APP_URL}/auth/login`

  if (!SENDGRID_API_KEY) {
    return { success: false, error: 'Email service not configured' }
  }

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: "You're in—here's what happens next",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
            <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 48px; height: 48px; background: #2563eb; border-radius: 12px; line-height: 48px; color: white; font-weight: bold; font-size: 24px;">m</div>
              </div>

              <h1 style="font-size: 28px; font-weight: 600; color: #111827; margin: 0 0 16px; text-align: center;">
                Thanks for trusting movd away!
              </h1>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                Your personalized Charlotte neighborhood report is ready. We've analyzed 311 data, crime statistics, social sentiment, and more to find your perfect match.
              </p>

              <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h2 style="font-size: 16px; font-weight: 600; color: #1e40af; margin: 0 0 12px;">
                  What happens next
                </h2>
                <ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Your apartment locator will reach out within the next few days</li>
                  <li>They'll help you find listings that match your preferences</li>
                  <li>You have lifetime access to your report—update preferences anytime</li>
                </ul>
              </div>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${reportUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px;">
                  View Your Report
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 8px; text-align: center;">
                Want to access your report later or update your preferences?
              </p>
              <p style="margin: 0; text-align: center;">
                <a href="${loginUrl}" style="color: #2563eb; font-size: 14px;">Sign in to your account</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Questions? Reply to this email or reach out to hello@movdaway.com
              </p>
            </div>
          </body>
        </html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

interface SendShareReportEmailParams {
  to: string
  clientName: string
  shareUrl: string
  listingCount: number
}

export async function sendShareReportEmail({
  to,
  clientName,
  shareUrl,
  listingCount,
}: SendShareReportEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set - cannot send share report email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: `Your apartment recommendations are ready`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
            <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 48px; height: 48px; background: #18181b; border-radius: 12px; line-height: 48px; color: white; font-weight: bold; font-size: 24px;">m</div>
              </div>

              <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 16px; text-align: center;">
                Hi ${clientName}!
              </h1>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 24px; text-align: center;">
                Your apartment locator has curated ${listingCount} recommendation${listingCount !== 1 ? 's' : ''} just for you. Check them out below.
              </p>

              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${shareUrl}" style="display: inline-block; background: #18181b; color: white; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px;">
                  View Your Recommendations
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                This link will give you access to view all the details, photos, and amenities for each listing.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Powered by <a href="${APP_URL}" style="color: #9ca3af;">MOVD</a>
              </p>
            </div>
          </body>
        </html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send share report email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}
