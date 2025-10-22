import { z } from 'zod';

export const notificationSettingsSchema = z.object({
  userId: z.string().uuid(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});
