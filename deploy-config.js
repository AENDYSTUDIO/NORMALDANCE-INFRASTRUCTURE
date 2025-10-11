// Конфигурация для деплоя
export const deployConfig = {
  // Vercel конфигурация
  vercel: {
    name: 'normaldance',
    version: 2,
    builds: [
      { src: 'package.json', use: '@vercel/next' }
    ],
    env: {
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    }
  },
  
  // Railway конфигурация
  railway: {
    services: {
      web: {
        source: {
          repo: 'NORMALDANCE/AENDY_STUDIO'
        },
        variables: {
          NODE_ENV: 'production',
          PORT: '${{ PORT }}'
        }
      }
    }
  },
  
  // Supabase миграции
  supabase: {
    migrations: './prisma/migrations',
    seed: './prisma/seed.js'
  }
}