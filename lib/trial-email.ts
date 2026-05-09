/**
 * Renders the parent acceptance email for a trial student. Returns both an
 * HTML version (for rich-paste into Gmail/Outlook) and a plain-text version
 * (for fallback or anyone who pastes into a text-only client). The page at
 * /trial-students/[id]/email shows these side-by-side and lets Ingrid copy
 * either one.
 */

export interface EmailInputs {
  parent: {
    firstName: string;
    email: string;
  };
  student: {
    firstName: string;
    fullName: string;
  };
  /** Coach's chip-composed paragraph from the assessment. */
  coachParagraph: string;
  /** True for "Enroll" recommendations; false routes to a "not yet" template. */
  recommend: boolean;
  /** Org settings, all admin-editable. */
  org: {
    senderName: string;
    senderCompany: string;
    programName: string;
    programAddress: string;
    whatsappNumber: string;
    registrationUrl: string;
    aiProgramUrl: string;
    materialPaymentEmail: string;
    monthlyFeeLabel: string;
    materialDepositLabel: string;
    materialBalanceLabel: string;
    materialRefreshLabel: string;
    foundationDurationLabel: string;
  };
  /** Used in the e-Transfer note line — defaults to the next Saturday. */
  startDateLabel: string;
}

export interface RenderedEmail {
  subject: string;
  to: string;
  html: string;
  text: string;
}

export function renderTrialEmail(input: EmailInputs): RenderedEmail {
  return input.recommend ? renderAccept(input) : renderNotYet(input);
}

// ──────────────────────────── Accept template ────────────────────────────

function renderAccept(i: EmailInputs): RenderedEmail {
  const { parent, student, coachParagraph, org, startDateLabel } = i;

  const subject = `${student.firstName}'s trial today — we'd love to enroll him in our ${org.programName}`;

  const text = [
    `Hi ${parent.firstName},`,
    "",
    `Quick update: ${student.firstName} had a great trial today, and we'd love to enroll him in our ${org.programName}.`,
    "",
    `What Coach noticed about ${student.firstName}:`,
    `> ${coachParagraph}`,
    "",
    `Register ${student.firstName}: ${org.registrationUrl}`,
    "",
    "What happens next",
    `1. Register on the portal (link above).`,
    `2. Send the ${org.materialDepositLabel} material deposit by Interac e-Transfer to ${org.materialPaymentEmail}. In the e-Transfer message, write: "Foundation — ${student.fullName} — ${startDateLabel}".`,
    `3. You'll get a confirmation from us, plus an invite to our ${org.programName} parents' WeChat group.`,
    "",
    "What it costs",
    `Now: Material deposit — ${org.materialDepositLabel}`,
    `Monthly (auto): ${org.programName} membership — ${org.monthlyFeeLabel}`,
    `End of ${org.foundationDurationLabel} Foundation: Material balance — ${org.materialBalanceLabel}`,
    `Every 2 years: Material refresh — ${org.materialRefreshLabel}`,
    `All e-Transfers → ${org.materialPaymentEmail}`,
    "",
    "Logistics",
    `📍 ${org.programAddress}`,
    `🔓 24/7 facility access for enrolled students`,
    `💬 Questions? WhatsApp ${org.whatsappNumber}, or just reply to this email.`,
    "",
    `Bonus: if you're thinking about ${student.firstName}'s university and career path, our AI coding program complements the ${org.programName} well — ${org.aiProgramUrl}`,
    "",
    `Welcome aboard. Looking forward to seeing ${student.firstName} next Saturday.`,
    "",
    `— ${org.senderName}`,
    org.senderCompany,
    org.programAddress,
    `WhatsApp: ${org.whatsappNumber}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:'Segoe UI',Inter,system-ui,-apple-system,sans-serif;color:#171717;line-height:1.55;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F5F5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:10px;overflow:hidden;">

        <!-- Brand bar -->
        <tr><td style="background:#171717;padding:14px 20px;color:#F5D000;font-weight:800;letter-spacing:0.04em;font-size:13px;">
          ${escapeHtml(org.senderCompany)}
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 28px 8px 28px;">
          <p style="margin:0 0 14px 0;font-size:15px;">Hi ${escapeHtml(parent.firstName)},</p>
          <p style="margin:0 0 18px 0;font-size:15px;">
            Quick update: <strong>${escapeHtml(student.firstName)} had a great trial today</strong>, and we'd love to enroll him in our ${escapeHtml(org.programName)}.
          </p>

          <!-- Coach quote -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
            <tr><td style="border-left:4px solid #F5D000;background:#FFFBDC;padding:14px 16px;border-radius:6px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#737373;margin-bottom:6px;">
                What Coach noticed about ${escapeHtml(student.firstName)}
              </div>
              <div style="font-size:14.5px;color:#171717;">${escapeHtml(coachParagraph)}</div>
            </td></tr>
          </table>

          <!-- CTA -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
            <tr><td style="background:#F5D000;border-radius:6px;">
              <a href="${escapeAttr(org.registrationUrl)}" style="display:inline-block;padding:12px 22px;font-weight:700;color:#171717;text-decoration:none;font-size:14px;">
                Register ${escapeHtml(student.firstName)} →
              </a>
            </td></tr>
          </table>

          <!-- Next steps -->
          <h3 style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#171717;text-transform:uppercase;letter-spacing:0.04em;">What happens next</h3>
          <ol style="margin:0 0 22px 0;padding-left:20px;font-size:14.5px;">
            <li style="margin-bottom:8px;">
              <strong>Register</strong> on the portal (link above).
            </li>
            <li style="margin-bottom:8px;">
              <strong>Send the ${escapeHtml(org.materialDepositLabel)} material deposit</strong> by Interac e-Transfer to <code style="background:#F5F5F5;padding:1px 5px;border-radius:3px;font-size:13px;">${escapeHtml(org.materialPaymentEmail)}</code>. In the e-Transfer message, write: <em>"Foundation — ${escapeHtml(student.fullName)} — ${escapeHtml(startDateLabel)}"</em>.
            </li>
            <li>
              <strong>You'll get a confirmation</strong> from us, plus an invite to our ${escapeHtml(org.programName)} parents' WeChat group.
            </li>
          </ol>

          <!-- Cost table -->
          <h3 style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#171717;text-transform:uppercase;letter-spacing:0.04em;">What it costs</h3>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E5E5E5;border-radius:8px;border-collapse:separate;font-size:14px;margin:0 0 8px 0;">
            <tr style="background:#FFFBDC;">
              <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;width:40%;"><strong>Now</strong></td>
              <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;">Material deposit</td>
              <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;text-align:right;font-weight:700;">${escapeHtml(org.materialDepositLabel)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;">Monthly (auto)</td>
              <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;">${escapeHtml(org.programName)} membership</td>
              <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;text-align:right;font-weight:700;">${escapeHtml(org.monthlyFeeLabel)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;">End of ${escapeHtml(org.foundationDurationLabel)} Foundation</td>
              <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;">Material balance</td>
              <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;text-align:right;font-weight:700;">${escapeHtml(org.materialBalanceLabel)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;">Every 2 years</td>
              <td style="padding:10px 12px;">Material refresh</td>
              <td style="padding:10px 12px;text-align:right;font-weight:700;">${escapeHtml(org.materialRefreshLabel)}</td>
            </tr>
          </table>
          <p style="margin:0 0 22px 0;font-size:13px;color:#525252;">All e-Transfers → <strong>${escapeHtml(org.materialPaymentEmail)}</strong></p>

          <!-- Logistics -->
          <h3 style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#171717;text-transform:uppercase;letter-spacing:0.04em;">Logistics</h3>
          <ul style="margin:0 0 22px 0;padding-left:20px;font-size:14.5px;">
            <li style="margin-bottom:6px;">📍 ${escapeHtml(org.programAddress)}</li>
            <li style="margin-bottom:6px;">🔓 24/7 facility access for enrolled students</li>
            <li>💬 Questions? WhatsApp <strong>${escapeHtml(org.whatsappNumber)}</strong>, or just reply to this email.</li>
          </ul>

          <!-- Bonus -->
          <p style="margin:0 0 22px 0;padding:12px 14px;background:#F5F5F5;border-radius:6px;font-size:13.5px;color:#404040;">
            <em>Bonus: if you're thinking about ${escapeHtml(student.firstName)}'s university and career path, our AI coding program complements the ${escapeHtml(org.programName)} well — <a href="${escapeAttr(org.aiProgramUrl)}" style="color:#2563EB;">portfolio.ct839.com</a>.</em>
          </p>

          <p style="margin:0 0 6px 0;font-size:15px;">Welcome aboard. Looking forward to seeing ${escapeHtml(student.firstName)} next Saturday.</p>
        </td></tr>

        <!-- Signature -->
        <tr><td style="padding:14px 28px 28px 28px;border-top:1px solid #E5E5E5;color:#525252;font-size:13px;">
          <strong style="color:#171717;">— ${escapeHtml(org.senderName)}</strong><br />
          ${escapeHtml(org.senderCompany)}<br />
          ${escapeHtml(org.programAddress)}<br />
          WhatsApp: ${escapeHtml(org.whatsappNumber)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, to: parent.email, html, text };
}

// ──────────────────────────── Not-yet template ────────────────────────────

function renderNotYet(i: EmailInputs): RenderedEmail {
  const { parent, student, coachParagraph, org } = i;

  const subject = `${student.firstName}'s trial today — feedback from our coach`;

  const text = [
    `Hi ${parent.firstName},`,
    "",
    `Thank you for bringing ${student.firstName} in for a trial today. Here's what our coach observed:`,
    "",
    `> ${coachParagraph}`,
    "",
    `We'd love to stay in touch and welcome ${student.firstName} back when the timing is right. If you have questions about the path forward, just reply to this email or message us on WhatsApp at ${org.whatsappNumber}.`,
    "",
    `Thanks again,`,
    `— ${org.senderName}`,
    org.senderCompany,
    org.programAddress,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:'Segoe UI',Inter,system-ui,-apple-system,sans-serif;color:#171717;line-height:1.55;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F5F5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:10px;overflow:hidden;">
        <tr><td style="background:#171717;padding:14px 20px;color:#F5D000;font-weight:800;letter-spacing:0.04em;font-size:13px;">
          ${escapeHtml(org.senderCompany)}
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 14px 0;font-size:15px;">Hi ${escapeHtml(parent.firstName)},</p>
          <p style="margin:0 0 18px 0;font-size:15px;">
            Thank you for bringing ${escapeHtml(student.firstName)} in for a trial today. Here's what our coach observed:
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
            <tr><td style="border-left:4px solid #A3A3A3;background:#F5F5F5;padding:14px 16px;border-radius:6px;font-size:14.5px;">
              ${escapeHtml(coachParagraph)}
            </td></tr>
          </table>
          <p style="margin:0 0 18px 0;font-size:15px;">
            We'd love to stay in touch and welcome ${escapeHtml(student.firstName)} back when the timing is right. If you have questions about the path forward, just reply to this email or message us on WhatsApp at <strong>${escapeHtml(org.whatsappNumber)}</strong>.
          </p>
          <p style="margin:0;font-size:15px;">Thanks again,</p>
        </td></tr>
        <tr><td style="padding:14px 28px 28px 28px;border-top:1px solid #E5E5E5;color:#525252;font-size:13px;">
          <strong style="color:#171717;">— ${escapeHtml(org.senderName)}</strong><br />
          ${escapeHtml(org.senderCompany)}<br />
          ${escapeHtml(org.programAddress)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, to: parent.email, html, text };
}

// ──────────────────────────── helpers ────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  // Same set as escapeHtml — kept separate so an audit grep finds attribute uses.
  return escapeHtml(s);
}

/** Pretty label for the next Saturday: "May 17". Used in the e-Transfer note. */
export function nextSaturdayLabel(today = new Date()): string {
  const d = new Date(today);
  const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}
