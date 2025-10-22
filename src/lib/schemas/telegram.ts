import { z } from 'zod';

export const TelegramUserSchema = z.object({
  id: z.number(),
  is_bot: z.boolean(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  is_premium: z.boolean().optional(),
});

export const TelegramChatSchema = z.object({
  id: z.number(),
  type: z.enum(['private', 'group', 'supergroup', 'channel']),
  title: z.string().optional(),
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export const TelegramMessageEntitySchema = z.object({
  type: z.string(),
  offset: z.number(),
  length: z.number(),
  url: z.string().optional(),
  user: TelegramUserSchema.optional(),
});

export const TelegramPhotoSizeSchema = z.object({
  file_id: z.string(),
  file_unique_id: z.string(),
  width: z.number(),
  height: z.number(),
  file_size: z.number().optional(),
});

export const TelegramDocumentSchema = z.object({
  file_id: z.string(),
  file_unique_id: z.string(),
  thumb: TelegramPhotoSizeSchema.optional(),
  file_name: z.string().optional(),
  mime_type: z.string().optional(),
  file_size: z.number().optional(),
});

export const TelegramAudioSchema = z.object({
  file_id: z.string(),
  file_unique_id: z.string(),
  duration: z.number(),
  performer: z.string().optional(),
  title: z.string().optional(),
  file_size: z.number().optional(),
  mime_type: z.string().optional(),
});

export const TelegramVideoSchema = z.object({
  file_id: z.string(),
  file_unique_id: z.string(),
  width: z.number(),
  height: z.number(),
  duration: z.number(),
  thumb: TelegramPhotoSizeSchema.optional(),
  file_size: z.number().optional(),
  mime_type: z.string().optional(),
});

export const TelegramVoiceSchema = z.object({
  file_id: z.string(),
  file_unique_id: z.string(),
  duration: z.number(),
  mime_type: z.string().optional(),
  file_size: z.number().optional(),
});

const BaseTelegramMessageSchema = z.object({
  message_id: z.number(),
  from: TelegramUserSchema.optional(),
  sender_chat: TelegramChatSchema.optional(),
  date: z.number(),
  chat: TelegramChatSchema,
  text: z.string().optional(),
  entities: z.array(TelegramMessageEntitySchema).optional(),
  caption: z.string().optional(),
  photo: z.array(TelegramPhotoSizeSchema).optional(),
  document: TelegramDocumentSchema.optional(),
  audio: TelegramAudioSchema.optional(),
  video: TelegramVideoSchema.optional(),
  voice: TelegramVoiceSchema.optional(),
});

type TelegramMessage = z.infer<typeof BaseTelegramMessageSchema> & {
  reply_to_message?: TelegramMessage;
};

export const TelegramMessageSchema: z.ZodType<TelegramMessage> = BaseTelegramMessageSchema.extend({
  reply_to_message: z.lazy(() => TelegramMessageSchema).optional(),
});

export const TelegramCallbackQuerySchema = z.object({
  id: z.string(),
  from: TelegramUserSchema,
  message: TelegramMessageSchema.optional(),
  inline_message_id: z.string().optional(),
  chat_instance: z.string(),
  data: z.string().optional(),
  game_short_name: z.string().optional(),
});

export const TelegramLocationSchema = z.object({
  longitude: z.number(),
  latitude: z.number(),
  horizontal_accuracy: z.number().optional(),
  live_period: z.number().optional(),
  heading: z.number().optional(),
  proximity_alert_radius: z.number().optional(),
});

export const TelegramInlineQuerySchema = z.object({
  id: z.string(),
  from: TelegramUserSchema,
  query: z.string(),
  offset: z.string(),
  chat_type: z.enum(['sender', 'private', 'group', 'supergroup', 'channel']).optional(),
  location: TelegramLocationSchema.optional(),
});

export const TelegramShippingAddressSchema = z.object({
  country_code: z.string(),
  state: z.string(),
  city: z.string(),
  street_line1: z.string(),
  street_line2: z.string(),
  post_code: z.string(),
});

export const TelegramOrderInfoSchema = z.object({
  name: z.string().optional(),
  phone_number: z.string().optional(),
  email: z.string().optional(),
  shipping_address: TelegramShippingAddressSchema.optional(),
});

export const TelegramPreCheckoutQuerySchema = z.object({
  id: z.string(),
  from: TelegramUserSchema,
  currency: z.string(),
  total_amount: z.number(),
  invoice_payload: z.string(),
  shipping_option_id: z.string().optional(),
  order_info: TelegramOrderInfoSchema.optional(),
});

export const TelegramUpdateSchema = z.object({
  update_id: z.number(),
  message: TelegramMessageSchema.optional(),
  edited_message: TelegramMessageSchema.optional(),
  channel_post: TelegramMessageSchema.optional(),
  edited_channel_post: TelegramMessageSchema.optional(),
  inline__query: TelegramInlineQuerySchema.optional(),
  callback_query: TelegramCallbackQuerySchema.optional(),
  pre_checkout_query: TelegramPreCheckoutQuerySchema.optional(),
});

export const telegramStarsPaymentSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().max(200),
  userId: z.number().int().positive(),
});

export const telegramConnectWalletSchema = z.object({
  walletAddress: z.string(),
  walletType: z.string(),
});

export const telegramTransferTokensSchema = z.object({
  recipientAddress: z.string(),
  tokenType: z.enum(['SOL', 'NDT']),
  amount: z.number().positive(),
});

export const telegramStakeTokensSchema = z.object({
  amount: z.number().positive(),
  duration: z.number().positive(),
});

export const telegramUnstakeTokensSchema = z.object({
  stakeId: z.string(),
});

export const telegramSwapTokensSchema = z.object({
  fromToken: z.enum(['SOL', 'NDT']),
  toToken: z.enum(['SOL', 'NDT']),
  amount: z.number().positive(),
  slippage: z.number().positive().optional(),
});

export const telegramMintNFTSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  mediaUrl: z.string().url(),
  attributes: z.record(z.unknown()).optional(),
});

export const telegramMusicFeaturePlaySchema = z.object({
  trackId: z.string().uuid(),
});

export const telegramMusicFeatureSearchSchema = z.object({
  query: z.string(),
});

export const telegramNftFeatureBuySchema = z.object({
  nftId: z.string().uuid(),
  amount: z.number().positive(),
});

export const telegramNftFeatureSellSchema = z.object({
  nftId: z.string().uuid(),
  amount: z.number().positive(),
});

export const telegramStakingFeatureStakeSchema = z.object({
  amount: z.number().positive(),
});

export const telegramStakingFeatureUnstakeSchema = z.object({
  stakeId: z.string().uuid(),
});

export const telegramPaymentsFeatureSendSchema = z.object({
  recipientId: z.string().uuid(),
  amount: z.number().positive(),
  message: z.string().optional(),
});

export const telegramNotificationsFeatureSettingsSchema = z.object({
  settings: z.record(z.boolean()),
});
