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

  // Outlook (Word renderer) strips border-radius, <code> backgrounds,
  // text-decoration-thickness, and ignores most CSS that's wrapped in <style>.
  // This template is designed to be copy-pasted directly into Outlook
  // compose: no outer page chrome, all inline styles, sharp corners, and
  // colored "border" stripes are real <td>s instead of border-left on a
  // single cell (which Outlook drops).
  const html = renderShell(
    subject,
    `<p style="margin:0 0 14px 0;font-size:15px;">Hi ${escapeHtml(parent.firstName)},</p>
    <p style="margin:0 0 22px 0;font-size:18px;line-height:1.45;">
      Quick update: <strong>${escapeHtml(student.firstName)} had a great trial today</strong>, and we'd love to enroll him in our <strong>${escapeHtml(org.programName)}</strong>.
    </p>

    ${calloutBlock(
      `What Coach noticed about ${escapeHtml(student.firstName)}`,
      escapeHtml(coachParagraph),
      "#F5D000",
      "#FFFBDC"
    )}

    ${ctaButton(`Register ${escapeHtml(student.firstName)} →`, org.registrationUrl)}

    ${sectionHeader("What happens next")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px 0;border-collapse:collapse;font-size:15px;line-height:1.55;">
      ${stepRow(
        "1",
        `<strong>Register</strong> on the portal (link above).`
      )}
      ${stepRow(
        "2",
        `<strong>Send the ${escapeHtml(org.materialDepositLabel)} material deposit</strong> by Interac e-Transfer to <strong><u>${escapeHtml(org.materialPaymentEmail)}</u></strong>. In the e-Transfer message, write: &ldquo;Foundation &mdash; ${escapeHtml(student.fullName)} &mdash; ${escapeHtml(startDateLabel)}&rdquo;.`
      )}
      ${stepRow(
        "3",
        `<strong>You&rsquo;ll get a confirmation</strong> from us, plus an invite to our ${escapeHtml(org.programName)} parents&rsquo; WeChat group.`,
        true
      )}
    </table>

    ${sectionHeader("What it costs")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;border-collapse:collapse;font-size:14px;border:1px solid #E5E5E5;">
      <tr bgcolor="#FFFBDC" style="background:#FFFBDC;">
        <td width="35%" style="padding:10px 12px;border-bottom:1px solid #E5E5E5;"><strong>Now</strong></td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;">Material deposit</td>
        <td align="right" style="padding:10px 12px;border-bottom:1px solid #E5E5E5;font-weight:700;white-space:nowrap;">${escapeHtml(org.materialDepositLabel)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;">Monthly (auto)</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;">${escapeHtml(org.programName)} membership</td>
        <td align="right" style="padding:10px 12px;border-bottom:1px solid #E5E5E5;font-weight:700;white-space:nowrap;">${escapeHtml(org.monthlyFeeLabel)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;">End of ${escapeHtml(org.foundationDurationLabel)} Foundation</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E5E5;">Material balance</td>
        <td align="right" style="padding:10px 12px;border-bottom:1px solid #E5E5E5;font-weight:700;white-space:nowrap;">${escapeHtml(org.materialBalanceLabel)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;">Every 2 years</td>
        <td style="padding:10px 12px;">Material refresh</td>
        <td align="right" style="padding:10px 12px;font-weight:700;white-space:nowrap;">${escapeHtml(org.materialRefreshLabel)}</td>
      </tr>
    </table>
    <p style="margin:0 0 26px 0;font-size:13px;color:#525252;">All e-Transfers &rarr; <strong><u>${escapeHtml(org.materialPaymentEmail)}</u></strong></p>

    ${sectionHeader("Logistics")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px 0;border-collapse:collapse;font-size:15px;line-height:1.55;">
      <tr><td style="padding:0 0 8px 0;">&#128205; ${escapeHtml(org.programAddress)}</td></tr>
      <tr><td style="padding:0 0 8px 0;">&#128275; 24/7 facility access for enrolled students</td></tr>
      <tr><td style="padding:0;">&#128172; Questions? WhatsApp <strong><u>${escapeHtml(org.whatsappNumber)}</u></strong>, or just reply to this email.</td></tr>
    </table>

    <p style="margin:0 0 24px 0;color:#525252;font-size:13.5px;font-style:italic;">
      Bonus: if you&rsquo;re thinking about ${escapeHtml(student.firstName)}&rsquo;s university and career path, our AI coding program complements the ${escapeHtml(org.programName)} well &mdash; <a href="${escapeAttr(org.aiProgramUrl)}" style="color:#2563EB;text-decoration:underline;">portfolio.ct839.com</a>.
    </p>

    <p style="margin:0 0 22px 0;font-size:16px;font-weight:600;">Welcome aboard. Looking forward to seeing ${escapeHtml(student.firstName)} next Saturday.</p>

    ${signature(org)}`
  );

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

  const html = renderShell(
    subject,
    `<p style="margin:0 0 14px 0;font-size:15px;">Hi ${escapeHtml(parent.firstName)},</p>
    <p style="margin:0 0 18px 0;font-size:15px;">
      Thank you for bringing ${escapeHtml(student.firstName)} in for a trial today. Here&rsquo;s what our coach observed:
    </p>

    ${calloutBlock(null, escapeHtml(coachParagraph), "#A3A3A3", "#F5F5F5")}

    <p style="margin:0 0 18px 0;font-size:15px;">
      We&rsquo;d love to stay in touch and welcome ${escapeHtml(student.firstName)} back when the timing is right. If you have questions about the path forward, just reply to this email or message us on WhatsApp at <strong><u>${escapeHtml(org.whatsappNumber)}</u></strong>.
    </p>
    <p style="margin:0 0 22px 0;font-size:15px;">Thanks again,</p>

    ${signature(org)}`
  );

  return { subject, to: parent.email, html, text };
}

// ──────────────────────────── helpers ────────────────────────────

/**
 * Wraps body content in a minimal Outlook-friendly shell. No outer page
 * frame (gray bg, centered card, brand bar) — those don't survive Outlook
 * compose paste. Just an html doc with system-font base styles so the
 * iframe preview renders close to what the recipient/Outlook will show.
 */
function renderShell(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:24px;background:#FFFFFF;font-family:'Segoe UI',Calibri,Arial,sans-serif;color:#171717;line-height:1.55;">
<div style="max-width:640px;margin:0 auto;font-family:'Segoe UI',Calibri,Arial,sans-serif;color:#171717;font-size:15px;line-height:1.55;">
${body}
</div>
</body>
</html>`;
}

/** Uppercase section header with a bottom rule. Outlook-safe (no border-radius). */
function sectionHeader(label: string): string {
  return `<p style="margin:0 0 14px 0;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#171717;border-bottom:2px solid #171717;padding-bottom:6px;">${escapeHtml(label)}</p>`;
}

/**
 * A "quote" callout — a colored stripe (real <td>, not border-left) plus
 * a tinted bg cell. Outlook drops border-left on a single cell, but a thin
 * sibling cell with bgcolor renders reliably.
 */
function calloutBlock(
  label: string | null,
  innerHtml: string,
  stripeColor: string,
  bgColor: string
): string {
  const labelRow = label
    ? `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#525252;margin:0 0 6px 0;">${label}</div>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px 0;border-collapse:collapse;">
<tr>
<td width="4" bgcolor="${stripeColor}" style="background:${stripeColor};width:4px;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
<td bgcolor="${bgColor}" style="background:${bgColor};padding:14px 18px;">
${labelRow}
<div style="font-size:15px;color:#171717;line-height:1.55;">${innerHtml}</div>
</td>
</tr>
</table>`;
}

/**
 * CTA button rendered as a table cell with bgcolor + a styled <a>.
 * Outlook respects the bgcolor attribute on td even when CSS background
 * is stripped, so the button keeps its color in compose paste.
 */
function ctaButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;border-collapse:collapse;">
<tr>
<td bgcolor="#F5D000" style="background:#F5D000;padding:14px 28px;">
<a href="${escapeAttr(href)}" style="color:#171717;text-decoration:none;font-weight:800;font-size:15px;letter-spacing:0.01em;">${label}</a>
</td>
</tr>
</table>`;
}

/**
 * One numbered step rendered as a 2-column table row (number + body).
 * More reliable than <ol> in Outlook, which often drops list-style or
 * collapses indentation.
 */
function stepRow(number: string, innerHtml: string, last: boolean = false): string {
  const padBottom = last ? "0" : "12px";
  return `<tr>
<td valign="top" width="28" style="padding:0 0 ${padBottom} 0;font-weight:800;color:#171717;font-size:15px;">${number}.</td>
<td valign="top" style="padding:0 0 ${padBottom} 0;">${innerHtml}</td>
</tr>`;
}

/** Signature block — bottom rule + sender info. */
function signature(org: EmailInputs["org"]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;border-collapse:collapse;border-top:1px solid #E5E5E5;">
<tr><td style="padding:14px 0 0 0;color:#525252;font-size:13.5px;line-height:1.55;">
<strong style="color:#171717;font-size:14px;">&mdash; ${escapeHtml(org.senderName)}</strong><br />
${escapeHtml(org.senderCompany)}<br />
${escapeHtml(org.programAddress)}<br />
WhatsApp: ${escapeHtml(org.whatsappNumber)}
</td></tr>
</table>`;
}

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
