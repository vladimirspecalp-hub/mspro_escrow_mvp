# Escrow Platform - NestJS Backend

## Overview
This project is a NestJS-based backend API for an escrow platform, built with TypeScript. Its purpose is to facilitate secure escrow transactions with a focus on a robust state machine, payment integration, administrative dispute resolution, and comprehensive security & audit controls. The platform aims to provide a reliable foundation for safe deal management.

**Current Version**: v1.2  
**Current State**: Step 8 Complete - Notifications & Integrations  
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
- **Deal State Machine**: A 7-state state machine (PENDING, PENDING_REVIEW, FUNDED, IN_PROGRESS, DISPUTED, COMPLETED, CANCELLED) manages the lifecycle of escrow deals, with defined transition rules and authorization checks.
- **Payment Integration**: A dedicated Payments module handles payment operations (hold, capture, refund) via an adapter pattern, currently with a MockPaymentAdapter.
- **Webhooks**: A WebhooksModule processes payment provider callbacks, ensuring idempotency and signature verification.
- **Admin Arbitration**: An AdminModule provides functionality for manual dispute resolution by authorized administrators/moderators, including actions to complete, refund, or cancel deals.
- **Notifications System**: Email and Telegram notification modules with event-driven architecture using NestJS EventEmitter2. Supports deal.created, deal.released, dispute.opened events.
- **Audit Logging**: All significant state transitions, HTTP requests, fraud checks, and notifications are logged to an `audit_logs` table with IP address, user agent, and action context.
- **Fraud Detection**: FraudService provides mock anti-fraud checks for user signup, deal creation, and payment holds, with risk scoring and automatic blocking of high-risk transactions.
- **Encryption**: Sensitive data encryption utilities using AES-256-GCM (ENCRYPTION_KEY stored in Replit Secrets).
- **Security**: Password hashes are excluded from API responses, DTO validation applied, audit middleware logs all requests, fraud detection integrated.
- **Database Schema**: Core tables include `users` (with roles), `deals`, `payments`, `webhook_events`, and `audit_logs` (with IP/user-agent tracking), with defined relationships.

## Recent Changes
**Step 8 (October 21, 2025) - Notifications & Integrations**:
- Installed @nestjs/event-emitter for event-driven architecture
- Created NotificationsModule with email and Telegram submodules
- Implemented MockEmailAdapter and **RealTelegramAdapter** (live Telegram Bot API integration)
- EmailService handles: deal.created, deal.released, dispute.opened events (notifications to buyer & seller)
- TelegramService handles: deal.created, dispute.opened events (admin notifications with HTML formatting)
- EventEmitter2 integrated into DealsService using emitAsync() for proper async handler execution
- All notifications logged to audit_logs with userId: null (system events, avoids FK violations)
- **Telegram Integration**: Live bot (@MSPro_Escrow_Bot) sending real notifications
- **Secrets configured**: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
- **Test endpoint**: POST /test/telegram for manual testing
- **All unit tests passing (91/91)**: email service 6/6, telegram service 4/4, existing 81/81
- **E2E tests**: Notifications 6/6 passing ✅ (full deal lifecycle: create -> fund -> confirm -> accept with notifications)
- **Live test**: Message ID #11 delivered successfully to Telegram ✅
- **Status**: Production-ready notification infrastructure (Email ready for Resend/SendGrid, Telegram LIVE)

**Step 7 (October 21, 2025) - Security & Audit Hardening**:
- Created crypto.util.ts with AES-256-GCM encryption/decryption utilities
- Added ENCRYPTION_KEY to Replit Secrets for secure key management
- Extended Prisma schema: added userAgent, actionContext to audit_logs; added PENDING_REVIEW deal status
- Created AuditMiddleware for comprehensive HTTP request logging (IP, user-agent, method, path, duration)
- Created FraudService with mock KYC/fraud detection (risk scoring, velocity checks, amount limits)
- Integrated fraud hooks into deal creation (auto-PENDING_REVIEW for high risk) and payment holds (blocking)
- Fraud detection rules: >$50k deals blocked, >10 deals/24h flagged, payment amount mismatches blocked
- **All unit tests passing (78/78)**: crypto 11/11, audit middleware 3/3, fraud service 12/12, existing 52/52
- **E2E tests**: Security 4/4 passing ✅ (fraud detection, audit logging)
- **Status**: Production-ready security and audit infrastructure implemented

**Step 6 (October 21, 2025) - Webhooks & Admin Arbitration**:
- Created WebhooksModule for payment provider callback processing
- Implemented webhook idempotency via WebhookEvent table
- Implemented webhook signature verification (mock provider)
- Created AdminModule with RBAC guard for admin/moderator access
- Implemented manual dispute resolution (COMPLETE, REFUND, CANCEL actions)
- Extended Prisma schema: WebhookEvent table, Deal.resolvedBy/resolvedAt fields
- Added registerTestTransaction helper method for test seeding
- **Unit tests: 52/52 passing** ✅
- **E2E tests**: Webhooks 3/3 ✅, Admin 5/5 ✅

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
- **Encryption**: Native Node.js crypto module (AES-256-GCM).
