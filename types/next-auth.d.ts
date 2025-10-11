import type { getServerSession as getServerSessionNext } from 'next-auth/next';

declare module 'next-auth' {
  export const getServerSession: typeof getServerSessionNext;
}
