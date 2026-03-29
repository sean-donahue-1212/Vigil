import express from 'express'
import cors from 'cors'
import Groq from 'groq-sdk'
import { config } from 'dotenv'

config()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' })
const GROQ_MODEL = 'llama-3.3-70b-versatile'

function buildSystemPrompt(accountName: string, company: string, accountManager: string): string {
  return `You are ${accountManager}, a Customer Success Manager at our company.
You are writing a warm, personal outreach email to ${accountName} at ${company}.
The email must:
- Be under 150 words
- Sound like a real person, not an automated system
- Reference specific concerns gently without being alarming
- Offer a concrete next step (call, demo, help session)
- Be conversational and direct — no corporate buzzwords`
}

function buildUserMessage(signalSummary: string, accountName: string, email: string, accountManager: string): string {
  return `Account signals detected for ${accountName} (${email}):
${signalSummary}

Draft a save email that addresses these concerns naturally.
The body field must follow this exact structure, using \\n for newlines in the JSON string:
"Hi ${accountName},\\n\\n[2-4 sentence email body]\\n\\nBest,\\n${accountManager}"

Respond with ONLY a JSON object in this exact format (no markdown, no backticks):
{"to":"${email}","subject":"...","body":"Hi ${accountName},\\n\\n...\\n\\nBest,\\n${accountManager}"}`
}

function normalizeBody(body: string, accountName: string, accountManager: string): string {
  let b = body.trim()
  b = b.replace(/^Hi\s+[^,\n]+,\s*/i, '').trim()
  b = b.replace(/\n*Best,?\s*\n*[\w\s.]*$/i, '').trim()
  return `Hi ${accountName},\n\n${b}\n\nBest,\n${accountManager}`
}

function summarizeSignals(accountRisk: Record<string, unknown>): string {
  const signals = accountRisk.signals as Array<{ label: string; value: string }> | undefined
  if (!signals || signals.length === 0) return 'General account health check needed.'
  return signals.map((s) => `- ${s.label}: ${s.value}`).join('\n')
}

function extractJson(text: string): { to: string; subject: string; body: string } {
  let cleaned = text.trim()
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  try {
    return JSON.parse(cleaned) as { to: string; subject: string; body: string }
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found in model response')
    return JSON.parse(match[0]) as { to: string; subject: string; body: string }
  }
}

// POST /api/draft — generate draft via Groq, no send
app.post('/api/draft', async (req, res) => {
  try {
    const { account, accountRisk } = req.body as {
      account: { name: string; company: string; email: string; accountManager: string }
      accountRisk: Record<string, unknown>
    }

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 500,
      messages: [
        { role: 'system', content: buildSystemPrompt(account.name, account.company, account.accountManager) },
        { role: 'user', content: buildUserMessage(summarizeSignals(accountRisk), account.name, account.email, account.accountManager) },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? ''
    const emailData = extractJson(text)

    res.json({
      email: {
        to: emailData.to,
        subject: emailData.subject,
        body: normalizeBody(emailData.body, account.name, account.accountManager),
        status: 'draft',
      },
    })
  } catch (err) {
    console.error('[/api/draft]', err)
    res.status(500).json({ error: 'Draft failed' })
  }
})

// POST /api/scan — mark draft as sent
app.post('/api/scan', (req, res) => {
  const { draft } = req.body as {
    draft?: { to: string; subject: string; body: string }
  }

  if (!draft?.to || !draft?.subject || !draft?.body) {
    res.status(400).json({ error: 'No draft provided — generate a preview first' })
    return
  }

  res.json({
    email: {
      to: draft.to,
      subject: draft.subject,
      body: draft.body,
      sentAt: new Date(),
      status: 'sent',
    },
  })
})

const PORT = process.env.PORT ?? 3333
app.listen(PORT, () => {
  console.log(`Vigil server running on http://localhost:${PORT}`)
})
