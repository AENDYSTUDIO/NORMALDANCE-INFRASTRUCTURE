/**
 * Telegram Bot API Type Definitions
 * Based on Telegram Bot API 7.0+
 */

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  first_name?: string
  last_name?: string
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  sender_chat?: TelegramChat
  date: number
  chat: TelegramChat
  text?: string
  entities?: TelegramMessageEntity[]
  caption?: string
  photo?: TelegramPhotoSize[]
  document?: TelegramDocument
  audio?: TelegramAudio
  video?: TelegramVideo
  voice?: TelegramVoice
  reply_to_message?: TelegramMessage
  [key: string]: unknown
}

export interface TelegramMessageEntity {
  type: string
  offset: number
  length: number
  url?: string
  user?: TelegramUser
}

export interface TelegramPhotoSize {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  file_size?: number
}

export interface TelegramDocument {
  file_id: string
  file_unique_id: string
  thumb?: TelegramPhotoSize
  file_name?: string
  mime_type?: string
  file_size?: number
}

export interface TelegramAudio {
  file_id: string
  file_unique_id: string
  duration: number
  performer?: string
  title?: string
  file_size?: number
  mime_type?: string
}

export interface TelegramVideo {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  duration: number
  thumb?: TelegramPhotoSize
  file_size?: number
  mime_type?: string
}

export interface TelegramVoice {
  file_id: string
  file_unique_id: string
  duration: number
  mime_type?: string
  file_size?: number
}

export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  inline_message_id?: string
  chat_instance: string
  data?: string
  game_short_name?: string
}

export interface TelegramInlineQuery {
  id: string
  from: TelegramUser
  query: string
  offset: string
  chat_type?: 'sender' | 'private' | 'group' | 'supergroup' | 'channel'
  location?: TelegramLocation
}

export interface TelegramLocation {
  longitude: number
  latitude: number
  horizontal_accuracy?: number
  live_period?: number
  heading?: number
  proximity_alert_radius?: number
}

export interface TelegramPreCheckoutQuery {
  id: string
  from: TelegramUser
  currency: string
  total_amount: number
  invoice_payload: string
  shipping_option_id?: string
  order_info?: TelegramOrderInfo
}

export interface TelegramOrderInfo {
  name?: string
  phone_number?: string
  email?: string
  shipping_address?: TelegramShippingAddress
}

export interface TelegramShippingAddress {
  country_code: string
  state: string
  city: string
  street_line1: string
  street_line2: string
  post_code: string
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
  channel_post?: TelegramMessage
  edited_channel_post?: TelegramMessage
  inline_query?: TelegramInlineQuery
  chosen_inline_result?: TelegramChosenInlineResult
  callback_query?: TelegramCallbackQuery
  shipping_query?: TelegramShippingQuery
  pre_checkout_query?: TelegramPreCheckoutQuery
  poll?: TelegramPoll
  poll_answer?: TelegramPollAnswer
  my_chat_member?: TelegramChatMemberUpdated
  chat_member?: TelegramChatMemberUpdated
  chat_join_request?: TelegramChatJoinRequest
}

export interface TelegramChosenInlineResult {
  result_id: string
  from: TelegramUser
  location?: TelegramLocation
  inline_message_id?: string
  query: string
}

export interface TelegramShippingQuery {
  id: string
  from: TelegramUser
  invoice_payload: string
  shipping_address: TelegramShippingAddress
}

export interface TelegramPoll {
  id: string
  question: string
  options: TelegramPollOption[]
  total_voter_count: number
  is_closed: boolean
  is_anonymous: boolean
  type: 'regular' | 'quiz'
  allows_multiple_answers: boolean
  correct_option_id?: number
  explanation?: string
}

export interface TelegramPollOption {
  text: string
  voter_count: number
}

export interface TelegramPollAnswer {
  poll_id: string
  voter_chat?: TelegramChat
  user?: TelegramUser
  option_ids: number[]
}

export interface TelegramChatMemberUpdated {
  chat: TelegramChat
  from: TelegramUser
  date: number
  old_chat_member: TelegramChatMember
  new_chat_member: TelegramChatMember
  invite_link?: TelegramChatInviteLink
  via_chat_folder_invite_link?: boolean
}

export interface TelegramChatMember {
  user: TelegramUser
  status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked'
  [key: string]: unknown
}

export interface TelegramChatInviteLink {
  invite_link: string
  creator: TelegramUser
  creates_join_request: boolean
  is_primary: boolean
  is_revoked: boolean
  name?: string
  expire_date?: number
  member_limit?: number
  pending_join_request_count?: number
}

export interface TelegramChatJoinRequest {
  chat: TelegramChat
  from: TelegramUser
  user_chat_id: number
  date: number
  bio?: string
  invite_link?: TelegramChatInviteLink
}

// Web App types
export interface TelegramWebAppUser {
  id: number
  is_bot?: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export interface TelegramWebAppInitData {
  query_id?: string
  user?: TelegramWebAppUser
  receiver?: TelegramWebAppUser
  chat?: TelegramChat
  chat_type?: 'sender' | 'private' | 'group' | 'supergroup' | 'channel'
  chat_instance?: string
  start_param?: string
  can_send_after?: number
  auth_date: number
  hash: string
}
