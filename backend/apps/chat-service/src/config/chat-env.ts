import { z } from 'zod';

export const chatEnvSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    SERVICE_NAME: z.literal('chat-service'),    
    HTTP_HOST: z.string().min(1).default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1024).max(65535),
    CHAT_DATABASE_URL: z.url(),
    FRONTEND_ORIGIN: z.url(),
    JWT_PUBLIC_KEY: z.string().min(1),
    INTERNAL_SERVICE_KEY: z.string().min(32),
});
export type ChatEnv = z.infer<typeof chatEnvSchema>;

export function validateChatEnv(raw: Record<string, unknown>): ChatEnv {
    const parsed = chatEnvSchema.safeParse(raw);
    if (!parsed.success) {
        throw new Error('Chat env sai: ' + parsed.error.issues
        .map(issue => issue.path.join('.')).join(', '));
    }
    return parsed.data;
}