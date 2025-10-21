# Escrow Platform - NestJS Backend

## Overview
This project is a NestJS-based backend API for an escrow platform, built with TypeScript. Its purpose is to facilitate secure escrow transactions with a focus on a robust state machine, payment integration, and administrative dispute resolution. The platform aims to provide a reliable foundation for safe deal management.

## User Preferences
- Bilingual communication (English/Russian) comfortable
- Prefers clear step-by-step progress tracking
- Values comprehensive documentation
- Expects all tests to pass before completion
- Requires GitHub sync after each major step

## System Architecture
The platform is built on NestJS 10.x with TypeScript 5.x, following a modular, feature-based architecture. PostgreSQL is used as the database, managed by Prisma ORM 6.17.1 for type-safe interactions and declarative migrations. Jest is used for comprehensive unit and end-to-end testing, complemented by ESLint and Prettier for code quality.

Key features and architectural decisions include:
- **Deal State Machine**: A 6-state state machine (PENDING, FUNDED, IN_PROGRESS, DISPUTED, COMPLETED, CANCELLED) manages the lifecycle of escrow deals, with defined transition rules and authorization checks.
- **Payment Integration**: A dedicated Payments module handles payment operations (hold, capture, refund) via an adapter pattern, currently with a MockPaymentAdapter.
- **Webhooks**: A WebhooksModule processes payment provider callbacks, ensuring idempotency and signature verification.
- **Admin Arbitration**: An AdminModule provides functionality for manual dispute resolution by authorized administrators/moderators, including actions to complete, refund, or cancel deals.
- **Audit Logging**: All significant state transitions and actions are logged to an `audit_logs` table.
- **Security**: Password hashes are excluded from API responses, and DTO validation is applied.
- **UI/UX**: Not directly specified for the backend, but the API design supports a clear flow for buyer/seller interactions and admin oversight.
- **Database Schema**: Core tables include `users` (with roles), `deals`, `payments`, and `audit_logs`, with defined relationships.

## External Dependencies
- **Database**: PostgreSQL (hosted via Neon on Replit).
- **ORM**: Prisma (version 6.17.1).
- **Payment Gateway**: Currently uses a MockPaymentAdapter; planned integration with ЮKassa.
- **Testing Frameworks**: Jest.
- **Code Quality Tools**: ESLint, Prettier.
- **Version Control**: GitHub (repository `mspro_escrow_mvp`).