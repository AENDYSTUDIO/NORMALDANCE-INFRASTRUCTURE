import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string;
      wallet?: string;
      username?: string;
      isArtist?: boolean;
      level?: string;
      spotifyId?: string;
      spotifyProfile?: unknown;
      appleId?: string;
      appleProfile?: unknown;
    };
  }
}
