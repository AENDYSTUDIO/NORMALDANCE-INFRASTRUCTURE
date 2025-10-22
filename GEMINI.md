# Gemini Customization File

This file provides instructions to the Gemini AI on how to interact with the NORMALDANCE project.

## Project Overview

NORMALDANCE is a complex, full-stack web application with a focus on music and blockchain technology. It appears to include a Next.js frontend, a Node.js/Express backend, and smart contracts. The project is set up with Docker for containerization and has a CI/CD pipeline.

## Tech Stack

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS
*   **Backend:** Node.js, Express, TypeScript
*   **Database:** MariaDB (from `fix-mariadb.sh`)
*   **Blockchain:** Solidity (from `contracts/GraveMemorialNFT.sol`), Hardhat
*   **Containerization:** Docker
*   **CI/CD:** GitLab CI, GitHub Actions

## Instructions for Gemini

*   **Be concise:** Provide brief and direct answers.
*   **Adhere to conventions:** Follow the existing coding style, structure, and conventions.
*   **Verify before acting:** Do not assume libraries or frameworks are available. Check `package.json` and other configuration files first.
*   **Run tests:** After making changes, run the relevant tests to ensure nothing is broken. The project seems to use Jest (`jest.grave.config.js`) and Playwright (`playwright.config.ts`).
*   **Use shell scripts:** The project has many `.sh` scripts for common tasks. Use them when appropriate.

## Common Commands

*   **Run tests:** `npm test` (or a more specific command if available in `package.json`)
*   **Start the application:** `npm start` or `docker-compose up`
*   **Linting:** `npm run lint` (assuming it's defined in `package.json`)
