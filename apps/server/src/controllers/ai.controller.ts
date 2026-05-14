import { Request, Response } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(48000),
});

const chatBodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  workspaceId: z.string().max(256).optional(),
  workspaceName: z.string().max(256).optional(),
});

export class AiController {
  static async chat(req: Request, res: Response) {
    const parsed = chatBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'AI is not configured on this Kairo instance. Set OPENAI_API_KEY on the orchestrator.',
      });
    }

    const { messages, workspaceId, workspaceName } = parsed.data;
    const contextLine =
      workspaceId || workspaceName
        ? `Active workspace — id: ${workspaceId ?? 'n/a'}, name: ${workspaceName ?? 'n/a'}. Tailor answers to this session when relevant.`
        : 'No specific workspace is selected; give general Kairo / developer guidance.';

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: [
              'You are Kairo Copilot: an AI embedded in a browser-native cloud developer workspace.',
              'Users run VS Code (code-server) in Docker, remote terminals, and future voice actions.',
              'Be concise, senior-engineer direct, and action-oriented. Prefer small code blocks.',
              contextLine,
            ].join(' '),
          },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      });

      const reply = completion.choices[0]?.message?.content?.trim() ?? '';
      res.json({ reply, model });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'OpenAI request failed';
      res.status(502).json({ error: message });
    }
  }
}
