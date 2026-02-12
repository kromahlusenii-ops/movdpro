import sgMail from '@sendgrid/mail'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

// Remove trailing slash if present to avoid double slashes in URLs
const APP_URL = (process.env.NEXT_PUBLIC_MOVD_URL || 'https://movdpro.vercel.app').replace(/\/$/, '')
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

interface SendWelcomeProEmailParams {
  to: string
}

export async function sendWelcomeProEmail({ to }: SendWelcomeProEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set - cannot send welcome email')
    return { success: false, error: 'Email service not configured' }
  }

  const dashboardUrl = `${APP_URL}/dashboard`

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: 'Welcome to MOVD Pro — you\'re all set',
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
                Thanks for joining MOVD Pro!
              </h1>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 24px; text-align: center;">
                We appreciate you trusting us. Your subscription is now active and you have full unlimited access to everything MOVD Pro offers.
              </p>

              <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h2 style="font-size: 16px; font-weight: 600; color: #166534; margin: 0 0 12px;">
                  What you get
                </h2>
                <ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Search 600+ Charlotte apartments in one place</li>
                  <li>Compare properties side by side</li>
                  <li>Generate client-ready reports with your branding</li>
                  <li>50 credits per month, refreshed automatically</li>
                </ul>
              </div>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${dashboardUrl}" style="display: inline-block; background: #18181b; color: white; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px;">
                  Go to Dashboard
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                Questions or feedback? Just reply to this email — we read every one.
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
    console.error('Failed to send welcome pro email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

interface SendIntakeConfirmationEmailParams {
  to: string
  clientName: string
  locatorName: string
  budgetMin?: number
  budgetMax?: number
  moveInDate?: string
  vibes?: string[]
}

export async function sendIntakeConfirmationEmail({
  to,
  clientName,
  locatorName,
  budgetMin,
  budgetMax,
  moveInDate,
  vibes,
}: SendIntakeConfirmationEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set - cannot send intake confirmation email')
    return { success: false, error: 'Email service not configured' }
  }

  const budgetText = budgetMin && budgetMax
    ? `$${budgetMin.toLocaleString()} - $${budgetMax.toLocaleString()}/month`
    : budgetMin
    ? `Starting at $${budgetMin.toLocaleString()}/month`
    : budgetMax
    ? `Up to $${budgetMax.toLocaleString()}/month`
    : null

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: `You're in — ${locatorName} is on it`,
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
                Thanks, ${clientName}!
              </h1>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 24px; text-align: center;">
                ${locatorName} has received your info and will reach out soon to help find your perfect place in Charlotte.
              </p>

              <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h2 style="font-size: 16px; font-weight: 600; color: #166534; margin: 0 0 12px;">
                  What happens next
                </h2>
                <ul style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>${locatorName} will review your preferences</li>
                  <li>They'll reach out with personalized recommendations</li>
                  <li>You'll tour apartments that match your vibe</li>
                </ul>
              </div>

              ${(budgetText || moveInDate || (vibes && vibes.length > 0)) ? `
              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h2 style="font-size: 14px; font-weight: 600; color: #6b7280; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Your preferences
                </h2>
                <div style="color: #374151; font-size: 14px; line-height: 1.6;">
                  ${budgetText ? `<p style="margin: 0 0 8px;"><strong>Budget:</strong> ${budgetText}</p>` : ''}
                  ${moveInDate ? `<p style="margin: 0 0 8px;"><strong>Move-in:</strong> ${moveInDate}</p>` : ''}
                  ${vibes && vibes.length > 0 ? `<p style="margin: 0;"><strong>Vibe:</strong> ${vibes.join(', ')}</p>` : ''}
                </div>
              </div>
              ` : ''}

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                Questions? Just reply to this email.
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
    console.error('Failed to send intake confirmation email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

interface SendLocatorNotificationEmailParams {
  to: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  contactPreference?: string
  budgetMin?: number
  budgetMax?: number
  moveInDate?: string
  vibes?: string[]
  dashboardUrl: string
}

export async function sendLocatorNotificationEmail({
  to,
  clientName,
  clientEmail,
  clientPhone,
  contactPreference,
  budgetMin,
  budgetMax,
  moveInDate,
  vibes,
  dashboardUrl,
}: SendLocatorNotificationEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set - cannot send locator notification email')
    return { success: false, error: 'Email service not configured' }
  }

  const budgetText = budgetMin && budgetMax
    ? `$${budgetMin.toLocaleString()} - $${budgetMax.toLocaleString()}/month`
    : budgetMin
    ? `Starting at $${budgetMin.toLocaleString()}/month`
    : budgetMax
    ? `Up to $${budgetMax.toLocaleString()}/month`
    : 'Not specified'

  const contactPrefText = contactPreference === 'text' ? 'Text'
    : contactPreference === 'email' ? 'Email'
    : contactPreference === 'call' ? 'Phone call'
    : 'Not specified'

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: `New client: ${clientName}`,
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
                New Client Intake
              </h1>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 24px; text-align: center;">
                <strong>${clientName}</strong> just submitted an intake form and is waiting to hear from you.
              </p>

              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h2 style="font-size: 14px; font-weight: 600; color: #6b7280; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Contact Info
                </h2>
                <div style="color: #374151; font-size: 14px; line-height: 1.8;">
                  ${clientEmail ? `<p style="margin: 0 0 4px;"><strong>Email:</strong> <a href="mailto:${clientEmail}" style="color: #2563eb;">${clientEmail}</a></p>` : ''}
                  ${clientPhone ? `<p style="margin: 0 0 4px;"><strong>Phone:</strong> <a href="tel:${clientPhone}" style="color: #2563eb;">${clientPhone}</a></p>` : ''}
                  <p style="margin: 0;"><strong>Preferred contact:</strong> ${contactPrefText}</p>
                </div>
              </div>

              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h2 style="font-size: 14px; font-weight: 600; color: #6b7280; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Preferences
                </h2>
                <div style="color: #374151; font-size: 14px; line-height: 1.8;">
                  <p style="margin: 0 0 4px;"><strong>Budget:</strong> ${budgetText}</p>
                  <p style="margin: 0 0 4px;"><strong>Move-in:</strong> ${moveInDate || 'Not specified'}</p>
                  <p style="margin: 0;"><strong>Vibe:</strong> ${vibes && vibes.length > 0 ? vibes.join(', ') : 'Not specified'}</p>
                </div>
              </div>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${dashboardUrl}" style="display: inline-block; background: #18181b; color: white; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px;">
                  View in Dashboard
                </a>
              </div>

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
    console.error('Failed to send locator notification email:', error)
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
