// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailTemplate = "limit-warning" | "limit-reached" | "limit-recovery";

interface EmailData {
  conversationsUsed?: number;
  conversationsLeft?: number;
  userName?: string;
  widgetName?: string;
}

/**
 * Send a transactional email
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  data: EmailData = {}
) {
  const templates = {
    "limit-warning": {
      subject: "🎉 Your widget is getting traction!",
      html: getLimitWarningEmail(data),
    },
    "limit-reached": {
      subject: "⚠️ Your widget reached its limit",
      html: getLimitReachedEmail(data),
    },
    "limit-recovery": {
      subject: "We miss you! (Your widget is paused)",
      html: getLimitRecoveryEmail(data),
    },
  };

  const emailContent = templates[template];

  try {
    const result = await resend.emails.send({
      from: "Lil Widget <noreply@mediadrink.com>", // Use your verified domain
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent:", result);
    return result;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

/**
 * Email template: 80% limit warning
 */
function getLimitWarningEmail(data: EmailData): string {
  const { conversationsUsed = 8, conversationsLeft = 2, userName = "there" } = data;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Great news!</h1>
        </div>

        <p style="font-size: 16px;">Hey ${userName},</p>

        <p style="font-size: 16px;">
          Your Lil Widget has handled <strong>${conversationsUsed} out of 10 conversations</strong> this month!
        </p>

        <p style="font-size: 16px;">
          Your visitors are engaging, and that means you're solving real problems for them.
        </p>

        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="margin: 0 0 15px 0; font-weight: 600; color: #2d3748;">
            To keep the momentum going, consider upgrading to unlock:
          </p>
          <ul style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">✅ Unlimited conversations</li>
            <li style="margin-bottom: 8px;">✅ Multiple widgets (perfect for different sites/pages)</li>
            <li style="margin-bottom: 8px;">✅ Expanded crawl (10+ pages for better answers)</li>
            <li style="margin-bottom: 8px;">✅ Analytics (see what visitors are asking)</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/upgrade"
             style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Upgrade to Pro - $79/mo
          </a>
        </div>

        <p style="font-size: 14px; color: #718096;">
          Not ready yet? No worries - you have ${conversationsLeft} conversations left this month.
        </p>

        <p style="font-size: 16px; margin-top: 30px;">
          Questions? Just reply to this email.
        </p>

        <p style="font-size: 16px;">
          -Lil Widget Team
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0;">

        <p style="font-size: 12px; color: #a0aec0; text-align: center;">
          Lil Widget • AI-powered chat widgets for your website
        </p>
      </body>
    </html>
  `;
}

/**
 * Email template: 100% limit reached
 */
function getLimitReachedEmail(data: EmailData): string {
  const { conversationsUsed = 10, userName = "there" } = data;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Widget Limit Reached</h1>
        </div>

        <p style="font-size: 16px;">Hey ${userName},</p>

        <p style="font-size: 16px;">
          Your Lil Widget just hit <strong>${conversationsUsed} conversations</strong> this month.
          That means ${conversationsUsed} visitors got instant answers instead of leaving your site.
        </p>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: 600; color: #92400e;">
            ⚡ The next visitor who needs help won't get a response until you upgrade.
          </p>
        </div>

        <p style="font-size: 16px; font-weight: 600; margin: 25px 0 10px 0;">
          What you're missing right now:
        </p>
        <ul style="margin: 0 0 25px 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">More customer conversations (revenue opportunities)</li>
          <li style="margin-bottom: 8px;">Insights into what visitors are asking</li>
          <li style="margin-bottom: 8px;">Ability to run multiple widgets</li>
        </ul>

        <p style="font-size: 16px; font-weight: 600; margin: 25px 0 10px 0;">
          Upgrade to Pro and unlock:
        </p>
        <ul style="margin: 0 0 25px 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">✅ Unlimited conversations ($79/mo)</li>
          <li style="margin-bottom: 8px;">✅ Multiple widgets across your sites</li>
          <li style="margin-bottom: 8px;">✅ Expanded crawl for better product knowledge</li>
          <li style="margin-bottom: 8px;">✅ See what people are actually asking</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/upgrade"
             style="display: inline-block; background: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 10px;">
            Upgrade Now
          </a>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/pricing"
             style="display: inline-block; border: 2px solid #cbd5e0; color: #4a5568; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            View Pricing
          </a>
        </div>

        <p style="font-size: 14px; color: #718096; font-style: italic;">
          P.S. - We keep your widget history, so nothing's lost. Just upgrade and you're back in business.
        </p>

        <p style="font-size: 16px; margin-top: 30px;">
          -Lil Widget Team
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0;">

        <p style="font-size: 12px; color: #a0aec0; text-align: center;">
          Lil Widget • AI-powered chat widgets for your website
        </p>
      </body>
    </html>
  `;
}

/**
 * Email template: 7-day recovery email
 */
function getLimitRecoveryEmail(data: EmailData): string {
  const { userName = "there" } = data;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">We miss you! 👋</h1>
        </div>

        <p style="font-size: 16px;">Hey ${userName},</p>

        <p style="font-size: 16px;">
          It's been a week since your widget hit its conversation limit.
        </p>

        <p style="font-size: 16px;">
          I'm curious - what's holding you back from upgrading?
        </p>

        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="margin: 0 0 15px 0; font-weight: 600;">Is it:</p>
          <ul style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><strong>Price?</strong> Let's talk - I can work with you</li>
            <li style="margin-bottom: 8px;"><strong>Features?</strong> Tell me what's missing</li>
            <li style="margin-bottom: 8px;"><strong>Timing?</strong> I get it, but your visitors are waiting</li>
          </ul>
        </div>

        <p style="font-size: 16px;">
          Reply and let me know. I read every email.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/upgrade"
             style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Upgrade to Pro - $79/mo
          </a>
        </div>

        <p style="font-size: 14px; color: #718096; font-style: italic;">
          P.S. - Your widget helped 10 visitors. Imagine what unlimited could do.
        </p>

        <p style="font-size: 16px; margin-top: 30px;">
          -[Your Name]<br>
          Founder, Lil Widget
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0;">

        <p style="font-size: 12px; color: #a0aec0; text-align: center;">
          Lil Widget • AI-powered chat widgets for your website
        </p>
      </body>
    </html>
  `;
}
