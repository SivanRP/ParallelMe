import { NextRequest, NextResponse } from 'next/server'
import type { SimulateResponse } from '@/app/api/simulate/route'
import { Resend } from 'resend'

interface LetterRequest {
  message: string
  email: string
  data: SimulateResponse
  chosenPath: 'A' | 'B'
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildLetterPrompt(message: string, data: SimulateResponse, chosenPath: 'A' | 'B'): string {
  const path = chosenPath === 'A' ? data.optionA : data.optionB
  const milestones = path.milestones.map(
    (m) => `Year ${m.year}: "${m.title}" — ${m.description} Memory: "${m.memory}" Metric: ${m.metric}`
  ).join('\n')
  const timeline = path.timeline.map(
    (t) => `Year ${t.year}: income=${t.income}/100, stress=${t.stress}/100, freedom=${t.freedom}/100. ${t.description}`
  ).join('\n')

  return `You are writing a letter back to your younger self. You are now 10 years into the "${path.label}" path after the decision: "${data.decision}".

Here is exactly how your decade unfolded:

MILESTONES:
${milestones}

LIFE METRICS ACROSS THE DECADE:
${timeline}

Your younger self wrote you this message:
"${message}"

Write a deeply personal, honest letter BACK to your younger self. You are 10 years older now and have lived every moment of this path.

RULES:
- Write as the year-10 version of yourself, speaking directly to your younger self ("you" = the person writing, "I" = the 10-year version)
- Reference at least 2 specific milestones or memories from the data above — use the exact details
- Be brutally honest about what the path cost you AND what it gave you
- Address what they asked or expressed in their message directly
- Do NOT be generic or motivational-poster vague. Be specific and real.
- If stress was high (70+), acknowledge the toll. If freedom was low, acknowledge the cage. If income was low, don't pretend it was fine.
- Tone: intimate, like a letter to yourself. Not a therapy session. Not a pep talk. A real conversation across time.
- Length: 3-5 paragraphs. No sign-off headers like "Sincerely" — just end naturally.
- Start with something specific, not "Dear younger me" — start mid-thought, like you've been waiting to say this.

Return only the letter text. No subject line, no greeting header, no metadata.`
}

// ─── Groq letter generation ───────────────────────────────────────────────────

async function generateLetter(message: string, data: SimulateResponse, chosenPath: 'A' | 'B'): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return generateFallbackLetter(message, data, chosenPath)

  const prompt = buildLetterPrompt(message, data, chosenPath)

  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
  for (const model of models) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        max_tokens: 800,
        messages: [
          { role: 'system', content: 'You write deeply personal, specific letters from a future self to a past self. You ground every sentence in the actual simulation data provided. You are not a motivational speaker. You are a real person who lived this.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (res.ok) {
      const json = await res.json()
      return json.choices?.[0]?.message?.content?.trim() ?? generateFallbackLetter(message, data, chosenPath)
    }
    if (res.status === 429 && model === models[0]) continue
    break
  }

  return generateFallbackLetter(message, data, chosenPath)
}

function generateFallbackLetter(message: string, data: SimulateResponse, chosenPath: 'A' | 'B'): string {
  const path = chosenPath === 'A' ? data.optionA : data.optionB
  const first = path.milestones[0]
  const last = path.milestones[path.milestones.length - 1]
  return `You asked me "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}" — I've been thinking about how to answer that for a while.

The first thing you need to know is that year one was nothing like you imagined. ${first.description} I remember thinking: ${first.memory.replace(/^I (still remember|'ll never forget)/, 'this was the moment I realized')}. The metric that mattered at the end of it? ${first.metric}.

Ten years later, here's what I can tell you from ${last.title}: ${last.description} I won't pretend it was clean. But it was real. And it was ours.

Whatever you decide — and you will decide, even if you think you're still weighing it — know that the version of us that lives this path is not who you think we are right now. We become someone else. That's not a warning. That's just the truth.

Don't overthink the beginning. The beginning is just the beginning.`
}

// ─── Email sender (Resend SDK) ────────────────────────────────────────────────

interface EmailDeliveryResult {
  sent: boolean
  reason?: string
  providerId?: string
  from?: string
}

async function sendEmail(to: string, letter: string, pathLabel: string, decision: string): Promise<EmailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY
  const configuredFrom = process.env.RESEND_FROM?.trim()
  const from = configuredFrom && configuredFrom.length > 0
    ? configuredFrom
    : 'Parallel Me <onboarding@resend.dev>'
  if (!apiKey) {
    console.log('[letter] No RESEND_API_KEY — email delivery disabled')
    return { sent: false, reason: 'Email provider is not configured (missing RESEND_API_KEY).' }
  }
  const resend = new Resend(apiKey)

  const paragraphs = letter.split('\n\n').filter(Boolean)
  const htmlBody = paragraphs.map((p) => `<p style="margin:0 0 18px 0;line-height:1.7;">${p.replace(/\n/g, '<br/>')}</p>`).join('')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:48px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;overflow:hidden;border:2px solid #222;">
        <!-- Header -->
        <tr>
          <td style="padding:28px 36px 24px;border-bottom:2px solid #1a1a1a;">
            <p style="margin:0 0 4px 0;font-family:monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#444;">PARALLEL ME · FUTURE SELF</p>
            <p style="margin:0;font-size:13px;color:#666;font-family:monospace;">Re: ${decision}</p>
          </td>
        </tr>
        <!-- Path badge -->
        <tr>
          <td style="padding:20px 36px 0;">
            <span style="display:inline-block;background:#FF475722;border:1px solid #FF4757;color:#FF4757;font-family:monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border-radius:6px;">
              Year 10 · ${pathLabel}
            </span>
          </td>
        </tr>
        <!-- Letter body -->
        <tr>
          <td style="padding:24px 36px 32px;color:#ccc;font-size:15px;line-height:1.8;">
            ${htmlBody}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:2px solid #1a1a1a;">
            <p style="margin:0;font-family:monospace;font-size:10px;color:#333;letter-spacing:1px;">
              Simulated by Parallel Me · This letter was generated based on your life simulation
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: `A letter from year 10 — ${pathLabel}`,
    text: letter,
    html,
  })
  if (error) {
    console.error('[letter] Resend error:', error)
    throw new Error(`Email failed: ${error.message}`)
  }

  return { sent: true, providerId: data?.id, from }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as LetterRequest
    const { message, email, data, chosenPath } = body

    if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })
    if (!email?.includes('@')) return NextResponse.json({ error: 'valid email required' }, { status: 400 })
    if (!data || !chosenPath) return NextResponse.json({ error: 'simulation data required' }, { status: 400 })

    const letter = await generateLetter(message, data, chosenPath)
    const delivery = await sendEmail(
      email,
      letter,
      chosenPath === 'A' ? data.optionA.label : data.optionB.label,
      data.decision
    )

    return NextResponse.json({ success: true, letter, delivery })
  } catch (err) {
    console.error('[letter]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
