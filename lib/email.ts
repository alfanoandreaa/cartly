type EmailInput = {
  to: string;
  subject: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

export async function sendCartlyEmail(input: EmailInput) {
  if (!process.env.RESEND_API_KEY) {
    console.info(`[Cartly email preview] ${input.subject} → ${input.to}`);
    return;
  }

  const cta = input.cta
    ? `<p style="margin:28px 0"><a href="${input.cta.href}" style="background:#C8FF00;color:#0F0F0F;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">${input.cta.label}</a></p>`
    : "";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      // Configurable so it works with Resend's pre-verified onboarding@resend.dev
      // for testing, or your own verified domain once set up.
      from: process.env.EMAIL_FROM || "Cartly <onboarding@resend.dev>",
      to: input.to,
      subject: input.subject,
      html: `<div style="font-family:Inter,Arial,sans-serif;background:#0F0F0F;color:#fff;padding:40px"><div style="max-width:560px;margin:auto"><div style="font-size:22px;font-weight:800;color:#C8FF00">Cartly</div><h1 style="font-size:28px;margin:32px 0 12px">${input.title}</h1><p style="color:#A3A3A3;line-height:1.7">${input.body}</p>${cta}<p style="color:#666;font-size:12px;margin-top:40px">Save it. Track it. Buy it when it’s right.</p></div></div>`
    })
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
}
