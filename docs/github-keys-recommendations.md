## Дополнение: расширенные рекомендации для GitHub (ключи, безопасность, правила)

Ниже — дополнительный набор практик и ключей, которые стоит внедрить для повышения безопасности, управляемости и прозрачности в репозитории AENDYSTUDIO/NORMALDANCE-INFRASTRUCTURE.

1. Обязательная подпись коммитов и проверка в правилах

- Включить "Require signed commits" через Rulesets (Repository Rules). Это заставит все коммиты быть GPG-подписанными.
- Сопровождающая документация по CI/CD и безопасности: [.github/CI_CD_README.md](.github/CI_CD_README.md:1), [.github/SECRETS_MANAGEMENT.md](.github/SECRETS_MANAGEMENT.md:1).
- Рекомендуется добавить Variable `GPG_FINGERPRINT` со значением отпечатка: 360DDEA8AF21189686E5005FF3C28E27494E77F7.

2. Branch Protection и Rules

- Применить правила из файла [.github/branch-protection-rules.json](.github/branch-protection-rules.json:1) и включить:
  - Required status checks (все ключевые джобы из [ci-cd.yml](.github/workflows/ci-cd.yml:1), [docker-build.yml](.github/workflows/docker-build.yml:1), [e2e-and-deploy.yml](.github/workflows/e2e-and-deploy.yml:1), [ci-main.yml](.github/workflows/ci-main.yml:1))
  - Require linear history
  - Restrict who can push to protected branches
  - Require approvals от CODEOWNERS (см. CODEOWNERS, если добавите в .github/CODEOWNERS)
- Подтвердить "Require conversation resolution" для PR — исключает незакрытые обсуждения при мерже.

3. Secrets Scanning + Push Protection

- Включить GitHub Advanced Security (если доступен) для:
  - Secret scanning alerting
  - Push protection (блокирует пушы, содержащие секреты)
- Вести ротацию секретов по плану: [scripts/rotate-secrets.js](scripts/rotate-secrets.js:1), документация по ротации: SECURITY документы: [SECURITY.md](SECURITY.md:1), [SECURITY_IMPLEMENTATION_PLAN.md](SECURITY_IMPLEMENTATION_PLAN.md:1), [SECURITY_FIXES_APPLIED.md](SECURITY_FIXES_APPLIED.md:1).

4. Cosign (Sigstore) для подписи контейнеров

- Рекомендовано применить keyless подпись (OIDC) для образов, которые собираются в [docker-build.yml](.github/workflows/docker-build.yml:1) и/или [ci-cd.yml](.github/workflows/ci-cd.yml:1).
- Здесь ключи хранить не нужно; при необходимости fallback — `COSIGN_PRIVATE`, `COSIGN_PASSPHRASE`, `COSIGN_PUBLIC`.
- Добавьте шаги:
  - Установить cosign
  - Подписать образы после push
  - Верифицировать подписи перед деплоем (в deploy job)

5. Минимизация прав токена в воркфлоу

- Устанавливать permissions на уровне workflow и job ровно по потребности (пример уже есть в [docker-build.yml](.github/workflows/docker-build.yml:1) — packages: write, contents: read).
- Для остальных workflow файлов проверьте и сократите права (contents: read; при деплое — нужные скоупы для kubectl/helm).

6. Environments (production/staging) и ограничения

- Использовать GitHub Environments:
  - production, staging (см. [.github/SECRETS_MANAGEMENT.md](.github/SECRETS_MANAGEMENT.md:26))
  - Хранить чувствительные секреты в env secrets (KUBECONFIG_BASE64 и др.) с ограничениями на reviewers/approvers для деплоя.
- Разнести Secrets:
  - Repository Secrets — общие (например, GPG_PRIVATE/PASSPHRASE)
  - Environment Secrets — окружение-специфичные (KUBECONFIG, DATABASE_URL_prod/staging)

7. OIDC провайдеры облаков

- Уйти от long-lived ключей облака (AWS/GCP/Azure). Настроить trust policy для GitHub OIDC:
  - Репозиторий и ветки как условия доверия
  - Выдача временных прав (STS), без хранения ACCESS_KEY/SECRET_KEY
- Привязать это к деплою из [ci-cd.yml](.github/workflows/ci-cd.yml:1) / [e2e-and-deploy.yml](.github/workflows/e2e-and-deploy.yml:1) в зависимости от среды.

8. Dependabot и обновления безопасности

- Включить Dependabot security updates.
- Рассмотреть файл для конфигурации Dependabot (если нужен) и определить интервал обновлений; интеграция с Rulesets для обязательных проверок.

9. Управление PAT (Personal Access Tokens)

- Не использовать PAT в CI, если можно обойтись GITHUB_TOKEN/OIDC.
- Если неизбежно — использовать Fine-grained PAT, с минимальными правами и сроком действия; хранить в Secrets только при острой необходимости.

10. Audit Logging и мониторинг действий

- Подключить мониторинг событий репозитория:
  - Просмотр логов действий и аномалий (Security tab)
  - Alerts по секретам/уязвимостям
- Внешние уведомления — Slack/Telegram:
  - `SLACK_WEBHOOK_URL` (см. [.github/SECRETS_MANAGEMENT.md](.github/SECRETS_MANAGEMENT.md:18))
  - Telegram — токен: [src/lib/telegram-integration-2025.ts](src/lib/telegram-integration-2025.ts:1) (проверить, что секреты не коммитятся; конфигурация только через Secrets)

11. Репозиторные ключи и Deploy Keys

- Создать ключ ed25519:
  - Публичный — в Deploy Keys (read-only или write-в зависимости от задач)
  - Приватный — в Secrets `DEPLOY_SSH_KEY`
- При использовании `ssh-agent` — загружать ключ в job деплоя, настроить known_hosts.

12. Шифрование конфигов через SOPS/age

- Сгенерировать `AGE_PRIVATE_KEY` (Secrets), публичный age-ключ — в `.sops.yaml`.
- Хранить чувствительные yaml/json (k8s values) в зашифрованном виде; расшифровывать в CI‑джобах при деплое.

13. CODEOWNERS и обязательные ревью

- Добавить .github/CODEOWNERS и включить Required approvals от владельцев перед merge.
- Совместить с Rulesets и Branch Protection для единообразия.

14. SLSA provenance и аттестации

- Добавить `actions/attest-build-provenance` для артефактов, чтобы прикреплять доказательства происхождения сборок.
- Проверять аттестации в деплое (верификация перед установкой релиза).

15. Токен hygiene в workflow

- Не выводить секреты в логах.
- Использовать `env:` и `secrets.*` только там, где необходимо; не прокидывать токены в дочерние процессы без нужды.
- Применять `concurrency` и `cancel-in-progress` (см. [gemini-scheduled-triage.yml](.github/workflows/gemini-scheduled-triage.yml:20)) для экономии ресурсов и предотвращения гонок.

16. Регулярная проверка конфигураций

- Проводить ревью всех файлов из `.github/workflows/` (перечень см. list_files) и держать отключённые файлы \*.DISABLED синхронизированными с актуальной политикой безопасности.
- Поддерживать документацию: [GITHUB_ACTIONS_FIX.md](GITHUB_ACTIONS_FIX.md:1), [INFRASTRUCTURE_DEPLOYMENT_GUIDE.md](INFRASTRUCTURE_DEPLOYMENT_GUIDE.md:1), [FINAL_CI_CD_FIXES_SUMMARY.md](FINAL_CI_CD_FIXES_SUMMARY.md:1).

17. Верификация текущих секретов — статус

- Проверено: в репозитории присутствуют Secrets `GPG_PRIVATE`, `GPG_PASSPHRASE` (см. вывод gh secret list).
- Артефакты ключей локально: [gpg_public.asc](gpg_public.asc:1), [gpg_private.asc](gpg_private.asc:1), [gpg-batch.txt](gpg-batch.txt:1).
- Скрипт автоматизации: [scripts/setup-gpg-gh.ps1](scripts/setup-gpg-gh.ps1:1) — можно повторно запустить при ротации.

18. Следующие действия (практические шаги)

- Добавить Variable `GPG_FINGERPRINT`.
- Создать Deploy SSH Key и секрет `DEPLOY_SSH_KEY`.
- Закодировать kubeconfig (base64) и добавить секрет `KUBECONFIG`.
- Включить Push Protection (Secret Scanning) и Required signed commits в Rulesets.
- Запланировать интеграцию Cosign (keyless) в [docker-build.yml](.github/workflows/docker-build.yml:1).
- Настроить OIDC с облаком для деплоя без статичных ключей.

Эти рекомендации вместе с уже выполненной генерацией GPG‑ключа и добавлением секретов обеспечивают базовую криптографическую опору (подписи коммитов/артефактов), улучшенную безопасность пайплайна и управляемость доступа к ключевым операциям.

## Дополнение 2: «Ещё» рекомендации для GitHub (углублённая безопасность, автоматизация, соответствие)

Запрошено: «ДАЙ ЕЩЕ РЕКОМЕНДАЦИЙ ДЛЯ ГИТХАБА». Ниже — расширенный перечень практик и конкретных шагов, дополняющих предыдущие разделы.

A) Политики GitHub Actions и токены

- Ограничить `GITHUB_TOKEN` на уровне каждого workflow: `permissions:` только необходимые (например, в [ci-cd.yml](.github/workflows/ci-cd.yml:1), [docker-build.yml](.github/workflows/docker-build.yml:1)).
- Запретить использование несанкционированных сторонних actions через Organization Policies; разрешить только проверенные `verified` издатели.
- Включить Mandatory Review для новых/обновлённых Actions версий в Rulesets.
- Разделить Secrets: репозиторные (общие) и Environment secrets (production/staging), как описано в [.github/SECRETS_MANAGEMENT.md](.github/SECRETS_MANAGEMENT.md:1).

B) Подпись артефактов и supply chain

- Внедрить SLSA attestations: шаги `actions/attest-build-provenance` в [ci-cd.yml](.github/workflows/ci-cd.yml:1) и [docker-build.yml](.github/workflows/docker-build.yml:1).
- Верифицировать аттестации на этапе деплоя (перед `helm upgrade` в [e2e-and-deploy.yml](.github/workflows/e2e-and-deploy.yml:1)).
- Использовать Cosign «keyless» (OIDC) для подписания контейнеров (без хранения приватного ключа); fallback — Secrets `COSIGN_PRIVATE`, `COSIGN_PASSPHRASE`.

C) Verified commits и строгие правила веток

- Включить Require signed commits (Rulesets) + проверку «Verified» подписи commit’ов.
- Включить Require linear history, Require conversation resolution, Required status checks (все ключевые джобы из [ci-cd.yml](.github/workflows/ci-cd.yml:1) и [ci-main.yml](.github/workflows/ci-main.yml:1)).
- Включить ограничение push в защищённые ветки только для ограниченного круга пользователей/ботов.

D) 2FA, SSO и управление доступом

- Обязательная 2FA для всех участников организации.
- SSO и SCIM (если доступно) для централизованного управления доступами.
- Регулярный аудит `outside collaborators`; минимизация прав по принципу наименьших привилегий.

E) Dependabot и Codespaces Secrets

- Активировать Dependabot security updates и triage.
- Для Codespaces — использовать `codespaces` secrets (отдельно от Actions) и не хранить долгоживущих ключей; интегрировать с OIDC где возможно.

F) Self-hosted runners (если используются)

- Изолировать self-hosted runners в отдельной сети/ВМ с ограничением доступа.
- Не хранить секреты на runner; использовать ephemeral runners и «job-level» секреты.
- Мониторить runner’ы на предмет утечек/инцидентов.

G) Процедуры отзывов и ротаций

- План экстренного отзыва ключей: сразу удалять публичный GPG в Signing keys, ревокация Cosign (если использовался ключевой режим), ротация `KUBECONFIG`, `REGISTRY_*`, API ключей.
- Регулярная ротация: см. [scripts/rotate-secrets.js](scripts/rotate-secrets.js:1); журнал в SECURITY документах ([SECURITY.md](SECURITY.md:1), [SECURITY_FIXES_APPLIED.md](SECURITY_FIXES_APPLIED.md:1)).

H) Примеры фрагментов для workflow (подпись коммитов/тегов)

- Импорт GPG-ключа из секретов (в шаге job):
  - `echo "$GPG_PRIVATE" | gpg --import`
  - `git tag -s vX.Y.Z -m "Release vX.Y.Z" && git push --tags`
  - Хранить fingerprint как Variable `GPG_FINGERPRINT`; использовать в шагах для верификации подписи.
- Cosign keyless подписание:
  - Установить `cosign`, выполнить `cosign sign --keyless $IMAGE_REF`, затем `cosign verify --keyless $IMAGE_REF` перед деплоем.

I) Kubernetes и секреты

- `KUBECONFIG` в виде base64 (Environment secret для production/staging); права service account — минимальные.
- Рассмотреть OIDC для доступа к кластеру (вместо статичных kubeconfig): короткоживущие креды по пулу доверия.

J) Документация и прозрачность

- Обновлять сводный гайд: [INFRASTRUCTURE_DEPLOYMENT_GUIDE.md](INFRASTRUCTURE_DEPLOYMENT_GUIDE.md:1), [FINAL_CI_CD_FIXES_SUMMARY.md](FINAL_CI_CD_FIXES_SUMMARY.md:1), [GITHUB_ACTIONS_FIX.md](GITHUB_ACTIONS_FIX.md:1).
- Поддерживать файл рекомендаций — текущий: [docs/github-keys-recommendations.md](docs/github-keys-recommendations.md:1).

K) Проверка текущего статуса ключей/секретов

- В репозитории присутствуют Secrets `GPG_PRIVATE`, `GPG_PASSPHRASE` (проверено `gh secret list`).
- Публичный GPG ключ зарегистрирован (или выполнен запрос на расширение прав токена `admin:gpg_key` для регистрации).
- Файл сценария автоматизации доступен: [scripts/setup-gpg-gh.ps1](scripts/setup-gpg-gh.ps1:1). Для повторного запуска/ротации: `pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-gpg-gh.ps1`.

Итог: внедрение указанных практик усилит защищённость CI/CD, обеспечит доказуемость происхождения сборок, минимизирует риски утечек ключей/токенов и приведёт управление доступом и криптографией к уровню индустриальных стандартов.
