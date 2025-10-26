# NormalDance Microservices Makefile

.PHONY: help build up down logs test scan release deploy clean

# Default target
help: ## Show this help message
	@echo "NormalDance Microservices Management"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	docker compose -f docker-compose.yml -f docker-compose.override.yml --profile dev up -d
	@echo "Development environment started. Access:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  API: http://localhost:4000"
	@echo "  PGAdmin: http://localhost:5050"
	@echo "  MailHog: http://localhost:8025"

dev-build: ## Build and start development environment
	docker compose -f docker-compose.yml -f docker-compose.override.yml --profile dev up -d --build

dev-logs: ## Show development logs
	docker compose -f docker-compose.yml -f docker-compose.override.yml --profile dev logs -f

dev-down: ## Stop development environment
	docker compose -f docker-compose.yml -f docker-compose.override.yml --profile dev down

# Production commands
prod: ## Start production environment
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod up -d

prod-build: ## Build and start production environment
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod up -d --build

prod-logs: ## Show production logs
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod logs -f

prod-down: ## Stop production environment
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod down

# Build commands
build: ## Build all services
	docker buildx bake --load

build-prod: ## Build production images
	docker buildx bake --push --set *.platform=linux/amd64,linux/arm64

build-nextjs: ## Build Next.js service
	docker build -f nextjs.Dockerfile -t normaldance/nextjs .

build-backend: ## Build backend service
	docker build -f backend.Dockerfile -t normaldance/backend .

build-ipfs: ## Build IPFS service
	docker build -f ipfs-service.Dockerfile -t normaldance/ipfs-service .

build-regru: ## Build Reg.Ru service
	docker build -f regru.Dockerfile -t normaldance/regru .

build-smart-contracts: ## Build smart contracts service
	docker build -f smart-contracts.Dockerfile -t normaldance/smart-contracts .

# Testing commands
test: ## Run all tests
	npm run test

test-unit: ## Run unit tests
	npm run test:unit

test-e2e: ## Run e2e tests
	npm run test:e2e

test-integration: ## Run integration tests
	npm run test:integration

# Security and quality
lint: ## Run ESLint
	npm run lint

typecheck: ## Run TypeScript type checking
	npm run typecheck

format: ## Format code with Prettier
	npm run format

scan: ## Run security scan with Trivy
	trivy image --format table --output trivy-report.txt normaldance/backend:latest

sbom: ## Generate SBOM with Syft
	syft normaldance/backend:latest --output spdx-json=sbom.json

# Deployment commands
deploy-dev: ## Deploy to development environment
	@echo "Deploying to development..."
	# Add your deployment commands here
	# Example: ansible-playbook -i inventory/dev deploy.yml

deploy-staging: ## Deploy to staging environment
	@echo "Deploying to staging..."
	# Add your deployment commands here

deploy-prod: ## Deploy to production environment
	@echo "Deploying to production..."
	# Add your deployment commands here
	# Example: ansible-playbook -i inventory/prod deploy.yml

rollback: ## Rollback to previous version
	@echo "Rolling back..."
	# Add rollback commands here

# Monitoring commands
monitoring: ## Start monitoring stack
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod up -d prometheus grafana loki promtail

monitoring-logs: ## Show monitoring logs
	docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod logs -f prometheus grafana loki promtail

# Database commands
db-migrate: ## Run database migrations
	docker compose exec backend npm run db:migrate

db-seed: ## Seed database with initial data
	docker compose exec backend npm run db:seed

db-reset: ## Reset database
	docker compose exec backend npm run db:reset

# Utility commands
clean: ## Clean up containers and volumes
	docker compose down -v --remove-orphans
	docker system prune -f

clean-all: ## Clean up everything including images
	docker compose down -v --remove-orphans
	docker system prune -a -f --volumes

logs: ## Show all logs
	docker compose logs -f

status: ## Show status of all services
	docker compose ps

health: ## Check health of all services
	@echo "Checking service health..."
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# CI/CD commands
ci-build: ## Build for CI
	docker buildx bake --load --set *.cache-from=type=gha,*.cache-to=type=gha

ci-test: ## Run tests in CI
	npm ci
	npm run lint
	npm run typecheck
	npm run test:unit

ci-deploy: ## Deploy from CI
	@echo "CI Deploy command"
	# Add CI deployment logic here

# Release commands
release-patch: ## Create patch release
	npm version patch
	git push --follow-tags

release-minor: ## Create minor release
	npm version minor
	git push --follow-tags

release-major: ## Create major release
	npm version major
	git push --follow-tags

# Help for specific services
help-dev: ## Show development help
	@echo "Development Environment:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  API: http://localhost:4000"
	@echo "  PGAdmin: http://localhost:5050"
	@echo "  MailHog: http://localhost:8025"
	@echo "  Traefik Dashboard: http://localhost:8080"

help-prod: ## Show production help
	@echo "Production Environment:"
	@echo "  Frontend: https://frontend.example.com"
	@echo "  API: https://api.example.com"
	@echo "  Prometheus: https://prometheus.example.com"
	@echo "  Grafana: https://grafana.example.com"
	@echo "  Traefik Dashboard: https://traefik.example.com"