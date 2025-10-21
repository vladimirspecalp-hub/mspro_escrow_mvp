# Escrow Platform - NestJS Backend

## Overview
This project is a NestJS-based backend API for an escrow platform, built with TypeScript. Its purpose is to facilitate secure escrow transactions with a focus on a robust state machine, payment integration, and administrative dispute resolution. The platform aims to provide a reliable foundation for safe deal management.

**Current Version**: v1.0  
**Current State**: Step 6 Complete - Webhooks & Admin Arbitration  
**Last Updated**: October 21, 2025

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
- **Database Schema**: Core tables include `users` (with roles), `deals`, `payments`, `webhook_events`, and `audit_logs`, with defined relationships.

## Recent Changes
**Step 6 (October 21, 2025) - Webhooks & Admin Arbitration**:
- Created WebhooksModule for payment provider callback processing
- Implemented webhook idempotency via WebhookEvent table
- Implemented webhook signature verification (mock provider)
- Created AdminModule with RBAC guard for admin/moderator access
- Implemented manual dispute resolution (COMPLETE, REFUND, CANCEL actions)
- Extended Prisma schema: WebhookEvent table, Deal.resolvedBy/resolvedAt fields
- Added registerTestTransaction helper method for test seeding
- **Unit tests: 52/52 passing** ✅ (webhooks: 5, admin: 8, payments: 23, deals: 12, database: 4)
- **E2E tests: 16/26 passing** (webhooks: 3/3 ✅, admin: 5/5 ✅, legacy issues from Step 5)

**Step 5 (October 21, 2025) - Payment Integration**:
- Created Payments module with MockPaymentAdapter
- Implemented hold/capture/refund payment operations
- Enhanced deal funding flow with payment holds
- Added comprehensive payment logging and audit trail
- Extended Prisma schema with payment tracking fields

## External Dependencies
- **Database**: PostgreSQL (hosted via Neon on Replit).
- **ORM**: Prisma (version 6.17.1).
- **Payment Gateway**: Currently uses MockPaymentAdapter; planned integration with ЮKassa.
- **Testing Frameworks**: Jest.
- **Code Quality Tools**: ESLint, Prettier.
- **Version Control**: GitHub (repository `mspro_escrow_mvp`).
