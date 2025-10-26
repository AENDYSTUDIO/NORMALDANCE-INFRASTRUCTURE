@echo off
echo 🔐 Setting up GitHub Secrets for NORMAL DANCE...

REM Check if GitHub CLI is installed
gh --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ GitHub CLI not found. Install from: https://cli.github.com/
    pause
    exit /b 1
)

REM Set secrets
gh secret set DATABASE_URL --body "postgresql://user:pass@localhost:5432/normaldance"
gh secret set NEXTAUTH_SECRET --body "cfXe_kAS2DW5a15z20Ykf4OeDmLkwoHnoMXsLlc6qOkA2iFxjCY5em86jFrhZBv5Hr28DFJ07QDePfAAJwd5DA"
gh secret set JWT_SECRET --body "a70603a00b852823d286446049148b2622dddccf7ee6e0cafca2cc2f6ce6d39a"
gh secret set PINATA_API_KEY --body "nd_258bf5c3c417e1922789ed46e7bf7be081a661746777bd26"
gh secret set PINATA_SECRET_KEY --body "7a874fa2d1164ca0f20727fd99a12c188572199b595f25167ef9e93b0efa5b05"
gh secret set OPENAI_API_KEY --body "sk-c07ffd19eaf33627f163f2be8c34098ff15bde7fceb6fa30"
gh secret set UPSTASH_REDIS_REST_TOKEN --body "5d499295eacac08ec548106bd79a2491d1bbab85a62201569b272640e32911a9"

echo ✅ GitHub Secrets configured successfully!
pause