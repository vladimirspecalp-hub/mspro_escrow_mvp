# MSPRO Escrow Platform — MVP
Escrow / Safe Deal System (Hold & Release + Crypto Gateway)

🔗 **Repository**: [github.com/vladimirspecalp-hub/mspro_escrow_mvp](https://github.com/vladimirspecalp-hub/mspro_escrow_mvp)

📦 **Current Version**: **v1.3 - KYC & User Verification**

## ✅ Step Progress
- **Step 1** — Initialization (NestJS scaffold, /health endpoint) — ✅ Completed
- **Step 2** — Repository Setup (GitHub sync, README, CI-ready) — ✅ Completed
- **Step 3** — Database & ORM Setup (PostgreSQL + Prisma) — ✅ Completed
- **Step 4** — Deals Module & State Machine (6-state MVP) — ✅ Completed
- **Step 5** — Payment Integration (Mock Payment Adapter) — ✅ Completed
- **Step 6** — Webhooks & Admin Arbitration — ✅ Completed
- **Step 7** — Security & Audit Hardening — ✅ Completed
- **Step 8** — Notifications & Integrations (Email + Telegram) — ✅ Completed
- **Step 9** — KYC & User Verification (Identity verification, deal limits) — ✅ Completed

## 🗺️ Roadmap to v2.0
- **Step 10** — ЮKassa Integration (Real Payment Gateway) — 📋 Planned
- **Step 11** — Frontend Dashboard (Admin Panel) — 📋 Planned
- **Step 12** — Crypto Gateway, Multi-currency — 📋 Planned

## 🧠 Architecture

### Technology Stack
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL (Neon-hosted via Replit)
- **ORM**: Prisma 6.17.1
- **Runtime**: Node.js 20.x
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier
- **Deployment**: Docker-ready

### Implemented Modules
- `health` — System health monitoring ✅
- `database` — Database health checks and statistics ✅
- `deals` — Escrow transaction management with state machine ✅
- `payments` — Payment processing and tracking (MockPaymentAdapter) ✅
- `webhooks` — Payment provider webhook handling ✅
- `admin` — Administrative dispute resolution ✅
- `notifications` — Email (mocked) and **Telegram (live integration)** ✅
- `fraud` — Anti-fraud and KYC checks (mocked) ✅
- `kyc` — **KYC & User Verification (deal limits, risk scoring)** ✅

### Planned Modules
- `crypto_gateway` — Cryptocurrency integration
- `users` — User authentication and management
- `dashboard` — Admin frontend panel

## 🧩 Current State

### ✅ Implemented Features
- Project initialized and operational
- NestJS server running on port 3000
- `/health` endpoint returns `{ status: "ok" }`
- **PostgreSQL database connected via Prisma ORM**
- **Database schema with 4 tables: users, deals, payments, audit_logs**
- **/db/health endpoint for database health checks**
- **/db/stats endpoint for database statistics**
- **Prisma migrations configured and applied**
- **Deals module with state machine for escrow workflow**
- **Audit logging for all state transitions**
- Jest unit tests: 17 passed
- Jest e2e tests: 9 passed
- TypeScript compilation working
- ESLint and Prettier configured
- Hot reload development environment
- GitHub repository synced and maintained

### 📁 Project Structure
```
escrow-platform/
├── src/
│   ├── modules/
│   │   ├── health/
│   │   │   ├── health.module.ts
│   │   │   ├── health.controller.ts
│   │   │   └── health.controller.spec.ts
│   │   ├── database/
│   │   │   ├── database.module.ts
│   │   │   ├── database.controller.ts
│   │   │   ├── database.controller.spec.ts
│   │   │   └── database.service.ts
│   │   └── deals/
│   │       ├── deals.module.ts
│   │       ├── deals.controller.ts
│   │       ├── deals.service.ts
│   │       ├── deals.service.spec.ts
│   │       └── dto/
│   │           ├── create-deal.dto.ts
│   │           └── index.ts
│   ├── prisma.service.ts
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   └── app.service.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 20251021034052_init_escrow_schema/
│           └── migration.sql
├── test/
│   ├── app.e2e-spec.ts
│   ├── database.e2e-spec.ts
│   ├── deals.e2e-spec.ts
│   └── jest-e2e.json
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .eslintrc.js
├── .prettierrc
├── .env
├── .gitignore
└── README.md
```

## 🗄️ Database Schema

The PostgreSQL database includes the following tables:

### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| email | VARCHAR | UNIQUE, NOT NULL |
| username | VARCHAR | UNIQUE, NOT NULL |
| password_hash | VARCHAR | NOT NULL |
| role | ENUM(USER, ADMIN, MODERATOR) | DEFAULT USER |
| is_active | BOOLEAN | DEFAULT true |
| **kyc_status** | ENUM(UNVERIFIED, PENDING, VERIFIED, REJECTED) | DEFAULT UNVERIFIED |
| **risk_score** | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | AUTO UPDATE |

### `deals`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| buyer_id | INTEGER | FOREIGN KEY → users(id) |
| seller_id | INTEGER | FOREIGN KEY → users(id) |
| title | VARCHAR | NOT NULL |
| description | TEXT | NULLABLE |
| amount | DECIMAL(10,2) | NOT NULL |
| currency | VARCHAR(3) | DEFAULT 'USD' |
| status | ENUM | DEFAULT PENDING |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | AUTO UPDATE |

**Status values**: PENDING, FUNDED, IN_PROGRESS, DISPUTED, COMPLETED, CANCELLED

### `payments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| deal_id | INTEGER | FOREIGN KEY → deals(id) |
| amount | DECIMAL(10,2) | NOT NULL |
| currency | VARCHAR(3) | DEFAULT 'USD' |
| status | ENUM | DEFAULT PENDING |
| payment_method | VARCHAR | NULLABLE |
| transaction_id | VARCHAR | UNIQUE, NULLABLE |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | AUTO UPDATE |

**Status values**: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED

### `audit_logs`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INTEGER | FOREIGN KEY → users(id), NULLABLE |
| action | VARCHAR | NOT NULL |
| entity | VARCHAR | NOT NULL |
| entity_id | INTEGER | NULLABLE |
| details | JSON | NULLABLE |
| ip_address | VARCHAR | NULLABLE |
| created_at | TIMESTAMP | DEFAULT now() |

### Relationships
- **User → Deals**: One-to-Many (as buyer)
- **User → Deals**: One-to-Many (as seller)
- **User → Audit Logs**: One-to-Many
- **Deal → Payments**: One-to-Many

## 📐 Database Design (Step 3)

### ORM Selection: Prisma

**Decision**: Prisma ORM 6.17.1

**Rationale**:
- **Type Safety**: Auto-generated TypeScript types from schema
- **Developer Experience**: Intuitive API, excellent VS Code integration
- **NestJS Integration**: First-class support via injectable services
- **Migration Management**: Declarative schema with automatic migration generation
- **Performance**: Optimized queries, connection pooling built-in
- **Ecosystem**: Strong community, Prisma Studio for database visualization

**Alternatives Considered**:
- **TypeORM**: More verbose, annotations-based approach
- **MikroORM**: Similar to TypeORM, less NestJS adoption
- **Sequelize**: Promise-based, but lacks TypeScript-first approach

### Migration Strategy

#### Development Workflow
```bash
# 1. Modify prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name descriptive_name

# 3. Prisma Client auto-regenerates
# 4. Test changes locally
npm test && npm run test:e2e
```

#### Production Deployment
```bash
# 1. Apply migrations (CI/CD pipeline)
npx prisma migrate deploy

# 2. Verify with health check
curl /db/health
```

#### Migration Rules
- **Never** manually edit migration SQL unless absolutely necessary
- **Always** review generated SQL before committing
- **Backwards compatible** changes preferred (additive, not destructive)
- **Rollback plan** required for breaking changes
- **Data migrations** handled via seed scripts when needed

#### Schema Evolution Process
1. **Design Phase**: Document schema changes in issue/PR
2. **Implementation**: Update `schema.prisma`
3. **Migration**: Run `prisma migrate dev`
4. **Code Update**: Update DTOs, services, controllers
5. **Testing**: Unit + E2E tests for new schema
6. **Review**: Architect review before merge
7. **Deploy**: `prisma migrate deploy` in production

### Data Validation Strategy

#### Database-Level Validation
- **Constraints**: PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL
- **Types**: Strong typing (INTEGER, VARCHAR, DECIMAL, ENUM)
- **Defaults**: Sensible default values (timestamps, status enums)
- **Indexes**: Automatic on PRIMARY KEY and FOREIGN KEY

#### Application-Level Validation (Planned for Step 4)
```typescript
// Example: DTO validation with class-validator
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsEnum(UserRole)
  role: UserRole;
}
```

#### Multi-Layer Validation Approach
1. **DTO Layer**: Request validation via `class-validator`
2. **Service Layer**: Business logic validation
3. **Database Layer**: Constraints enforce data integrity
4. **Custom Validators**: Unique email, username existence checks

### Testing Strategy

#### Current Implementation (Step 3)
**Unit Tests** (5 passing):
- DatabaseController methods
- Mock PrismaService for isolation
- Test health check logic
- Test statistics aggregation

**E2E Tests** (3 passing):
- `/db/health` endpoint integration
- `/db/stats` endpoint integration
- Real database connection verification

#### Future Testing Strategy (Step 4+)

**1. Test Database Approach**
```typescript
// Option A: In-memory SQLite (fast, limited features)
// Option B: Test PostgreSQL instance (slow, full features)
// CHOSEN: Test PostgreSQL via Replit environment
```

**2. Test Data Management**
```typescript
// Before each test suite
beforeAll(async () => {
  await prisma.$connect();
});

// Clean up after tests
afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.$disconnect();
});
```

**3. Integration Testing Layers**
- **Repository Tests**: Prisma queries return correct data
- **Service Tests**: Business logic with mocked Prisma
- **Controller Tests**: HTTP layer with mocked services
- **E2E Tests**: Full stack with real database

**4. Test Scenarios**
- CRUD operations for each entity
- Foreign key constraints enforcement
- Unique constraint violations
- Transaction rollback on errors
- Concurrent access handling

### ORM Integration Plan (NestJS Modules)

#### Architecture Pattern

```
┌─────────────────────────────────────────┐
│          NestJS Application             │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │  User    │  │  Deal    │  │Payment ││
│  │  Module  │  │  Module  │  │ Module ││
│  └────┬─────┘  └────┬─────┘  └───┬────┘│
│       │             │             │     │
│  ┌────▼─────────────▼─────────────▼───┐ │
│  │         PrismaService               │ │
│  │  (Global Injectable Singleton)      │ │
│  └────────────────┬────────────────────┘ │
│                   │                      │
└───────────────────┼──────────────────────┘
                    │
            ┌───────▼────────┐
            │   PostgreSQL   │
            │   (Neon Cloud) │
            └────────────────┘
```

#### Integration Steps

**Step 1: PrismaService (✅ Implemented)**
```typescript
// src/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Step 2: Module-Level Injection**
```typescript
// Future: src/modules/users/users.module.ts
@Module({
  imports: [DatabaseModule],  // Provides PrismaService
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

**Step 3: Service-Level Usage**
```typescript
// Future: src/modules/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({ data });
  }
}
```

#### Dependency Flow
1. **DatabaseModule** exports PrismaService
2. **Feature Modules** (Users, Deals, Payments) import DatabaseModule
3. **Services** inject PrismaService for database operations
4. **Controllers** inject Services for business logic
5. **DTOs** define data shape with validation decorators

#### Transaction Management (Future)
```typescript
// Complex operations requiring atomicity
async createDealWithPayment(dealData, paymentData) {
  return this.prisma.$transaction(async (tx) => {
    const deal = await tx.deal.create({ data: dealData });
    const payment = await tx.payment.create({
      data: { ...paymentData, dealId: deal.id }
    });
    return { deal, payment };
  });
}
```

### Health Check Implementation

**Endpoint**: `GET /db/health`

**Purpose**: Verify database connectivity and readiness

**Implementation**:
```typescript
// src/modules/database/database.service.ts
async checkDatabaseHealth() {
  const isHealthy = await this.prisma.healthCheck();
  return {
    status: isHealthy ? 'ok' : 'error',
    database: 'postgresql',
    timestamp: new Date().toISOString(),
  };
}

// src/prisma.service.ts
async healthCheck(): Promise<boolean> {
  try {
    await this.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}
```

**Usage in Production**:
- Kubernetes liveness/readiness probes
- Load balancer health checks
- Monitoring/alerting systems
- CI/CD pipeline verification

### Database Statistics

**Endpoint**: `GET /db/stats`

**Purpose**: Monitor data growth and application usage

**Implementation**:
```typescript
async getDatabaseStats() {
  const [users, deals, payments, auditLogs] = await Promise.all([
    this.prisma.user.count(),
    this.prisma.deal.count(),
    this.prisma.payment.count(),
    this.prisma.auditLog.count(),
  ]);
  return { users, deals, payments, auditLogs };
}
```

**Future Enhancements**:
- Table size statistics
- Query performance metrics
- Connection pool status
- Slow query logging

### Readiness for Step 4

✅ **Database Infrastructure Ready**:
- PostgreSQL provisioned and connected
- Prisma ORM configured and tested
- Migration system operational
- Health monitoring in place

✅ **Next Implementation Targets**:
1. **User Module**: CRUD operations, authentication
2. **Deal Module**: State machine for escrow workflow
3. **Payment Module**: Transaction tracking
4. **Crypto Gateway**: External payment integration

✅ **State Machine Design (Deals)**:
```
PENDING → FUNDED → IN_PROGRESS → COMPLETED
    ↓                   ↓
CANCELLED           DISPUTED
```

Transitions will be enforced at service layer with proper validation and audit logging.

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database (or use Replit's managed database)
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/vladimirspecalp-hub/mspro_escrow_mvp.git
cd mspro_escrow_mvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL
```

### Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### Development
```bash
# Start development server with hot reload
npm run start:dev

# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format
```

### Build
```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## 📋 API Endpoints

| Method | Endpoint | Description | Response | Status |
|--------|----------|-------------|----------|--------|
| GET | `/` | Root endpoint | `"Escrow Platform API"` | ✅ |
| GET | `/health` | Application health | `{ status: "ok" }` | ✅ |
| GET | `/db/health` | Database health | `{ status, database, timestamp }` | ✅ |
| GET | `/db/stats` | Database statistics | `{ users, deals, payments, auditLogs }` | ✅ |

### Example Responses

**GET /db/health**
```json
{
  "status": "ok",
  "database": "postgresql",
  "timestamp": "2025-10-21T03:42:37.648Z"
}
```

**GET /db/stats**
```json
{
  "users": 0,
  "deals": 0,
  "payments": 0,
  "auditLogs": 0
}
```

## 🧪 Testing

All tests are passing:
- **Unit tests**: 17 passed
- **E2E tests**: 9 passed
- **Total**: 26 tests passed

Run tests with:
```bash
npm test           # Unit tests
npm run test:e2e   # End-to-end tests
npm run test:cov   # Coverage report
```

## 🔄 Deals Module & State Machine

### State Machine Flow

The deals module implements a state machine for managing escrow transactions:

```
PENDING → FUNDED → IN_PROGRESS → COMPLETED
   ↓         ↓           ↓
CANCELLED  CANCELLED  DISPUTED → IN_PROGRESS / COMPLETED / CANCELLED
```

### State Transition Rules

| From State | To States | Trigger Action |
|------------|-----------|----------------|
| PENDING | FUNDED, CANCELLED | fundDeal, cancelDeal |
| FUNDED | IN_PROGRESS, CANCELLED | confirmExecution, cancelDeal |
| IN_PROGRESS | COMPLETED, DISPUTED, CANCELLED | acceptByBuyer, raiseDispute, cancelDeal |
| DISPUTED | IN_PROGRESS, COMPLETED, CANCELLED | Resolution actions |
| COMPLETED | - | Final state |
| CANCELLED | - | Final state |

### API Endpoints

All deals endpoints are prefixed with `/api/v1/deals`:

**Create Deal**
```http
POST /api/v1/deals
Content-Type: application/json

{
  "buyerId": 1,
  "sellerId": 2,
  "title": "Product Purchase",
  "description": "Optional description",
  "amount": 100.00,
  "currency": "USD"
}
```

**Get All Deals**
```http
GET /api/v1/deals
```

**Get Deal by ID**
```http
GET /api/v1/deals/:id
```

**Fund Deal** (Buyer only)
```http
POST /api/v1/deals/:id/fund
Content-Type: application/json

{
  "userId": 1
}
```

**Confirm Execution** (Seller only)
```http
POST /api/v1/deals/:id/confirm
Content-Type: application/json

{
  "userId": 2
}
```

**Accept Deal** (Buyer only)
```http
POST /api/v1/deals/:id/accept
Content-Type: application/json

{
  "userId": 1
}
```

**Raise Dispute** (Buyer or Seller)
```http
POST /api/v1/deals/:id/dispute
Content-Type: application/json

{
  "userId": 1,
  "reason": "Quality issues"
}
```

**Cancel Deal** (Buyer or Seller)
```http
POST /api/v1/deals/:id/cancel
Content-Type: application/json

{
  "userId": 1,
  "reason": "Changed my mind"
}
```

### Audit Logging

All state transitions are automatically logged to the `audit_logs` table with:
- User ID who triggered the action
- Action type (e.g., DEAL_CREATED, DEAL_FUNDED, DEAL_CONFIRMED)
- Entity type (deal) and entity ID
- Previous and new status
- Additional details (reason for disputes/cancellations)
- Timestamp

## 🔐 KYC & User Verification Flow

The platform implements identity verification (KYC - Know Your Customer) to ensure secure transactions and prevent fraud. Users must verify their identity before creating deals, with transaction limits based on verification status.

### KYC Statuses

| Status | Description | Transaction Limit | Can Create Deals |
|--------|-------------|-------------------|------------------|
| `UNVERIFIED` | Initial status, no verification submitted | $500 USD | ❌ No (blocked above limit) |
| `PENDING` | Verification in progress | $500 USD | ❌ No (blocked above limit) |
| `VERIFIED` | Identity verified successfully | $10,000 USD | ✅ Yes (up to limit) |
| `REJECTED` | Verification failed or rejected | $0 USD | ❌ No (completely blocked) |

### KYC API Endpoints

#### Submit KYC Verification

Submit identity documents for verification.

```http
POST /api/v1/kyc/submit
Content-Type: application/json

{
  "fullName": "John Doe",
  "documentType": "passport",
  "documentNumber": "AB123456",
  "address": "123 Main St, City",
  "dateOfBirth": "1990-01-01"
}
```

**Response** (200 OK):
```json
{
  "status": "verified",
  "riskScore": 30,
  "kycStatus": "VERIFIED"
}
```

**Behavior**:
- Automatically processes verification using mock KYC provider
- Users with risk score < 50 are auto-approved
- Users with risk score ≥ 50 are rejected
- Sends Telegram notification to admin on approval/rejection
- Logs all actions to audit trail

#### Get KYC Status

Retrieve current KYC verification status for a user.

```http
GET /api/v1/kyc/status/:userId
```

**Response** (200 OK):
```json
{
  "userId": 1,
  "kycStatus": "VERIFIED",
  "riskScore": 30,
  "canCreateDeal": true,
  "transactionLimit": 10000
}
```

#### Admin: Approve/Reject KYC

Manually approve or reject KYC verification (requires ADMIN or MODERATOR role).

```http
PATCH /api/v1/kyc/approve/:userId?adminId=2
Content-Type: application/json

{
  "decision": "approve",
  "reason": "Valid documents verified"
}
```

**Request Parameters**:
- `decision`: `"approve"` or `"reject"`
- `reason` (optional): Explanation for decision

**Response** (200 OK):
```json
{
  "userId": 1,
  "kycStatus": "VERIFIED",
  "message": "User approved"
}
```

### Deal Creation Pre-check

Before creating a deal, the system automatically checks:

1. **User KYC Status**:
   - `REJECTED` → ❌ Blocked (403 Forbidden)
   - `UNVERIFIED` / `PENDING` → ⚠️ Limited to $500
   - `VERIFIED` → ✅ Allowed up to $10,000

2. **Transaction Limit**:
   - Compares deal amount against user's limit
   - Returns 403 Forbidden if amount exceeds limit

**Example Error Response** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "Amount exceeds limit for UNVERIFIED status. Max: 500 USD"
}
```

### Telegram Notifications

The system sends Telegram notifications for KYC events:

#### KYC Verified
```
✅ KYC ВЕРИФИКАЦИЯ ОДОБРЕНА

Пользователь: john_doe (john@example.com)
ID пользователя: #123
Оценка риска: 30/100
Статус: Верифицирован

Пользователь теперь может создавать сделки до 10,000 USD.
```

#### KYC Rejected
```
❌ KYC ВЕРИФИКАЦИЯ ОТКЛОНЕНА

Пользователь: john_doe (john@example.com)
ID пользователя: #123
Оценка риска: 85/100
Причина: High risk score detected

Статус: Отклонено. Пользователь не может создавать сделки.
```

### Risk Scoring

The mock KYC provider calculates a deterministic risk score (0-100) based on the document number:

- **Score < 50**: ✅ Auto-approved, status = `VERIFIED`
- **Score ≥ 50**: ❌ Auto-rejected, status = `REJECTED`

This scoring is deterministic, meaning the same document number always produces the same risk score for consistent testing.

### Environment Variables

```env
# KYC Configuration
FEATURE_KYC=true
KYC_MOCK_MODE=true
KYC_LIMIT_UNVERIFIED=500
KYC_LIMIT_VERIFIED=10000
```

### Testing KYC Flow

**Example Test Scenarios**:

1. **Successful Verification** (Low Risk):
```bash
curl -X POST http://localhost:3000/api/v1/kyc/submit \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Alice Test",
    "documentType": "passport",
    "documentNumber": "LOWRISK123",
    "address": "123 Test St",
    "dateOfBirth": "1990-01-01"
  }'
```

2. **Failed Verification** (High Risk):
```bash
curl -X POST http://localhost:3000/api/v1/kyc/submit \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Bob Test",
    "documentType": "passport",
    "documentNumber": "HIGHRISK999",
    "address": "456 Test Ave",
    "dateOfBirth": "1985-05-15"
  }'
```

3. **Check KYC Status**:
```bash
curl http://localhost:3000/api/v1/kyc/status/1
```

4. **Test Deal Creation with Unverified User**:
```bash
# Should fail with 403 Forbidden if amount > $500
curl -X POST http://localhost:3000/api/v1/deals \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": 1,
    "sellerId": 2,
    "title": "High Value Deal",
    "amount": 1000,
    "currency": "USD"
  }'
```

## 📝 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (Provided by Replit or custom)
DATABASE_URL="postgresql://user:password@host:port/database"

# Telegram Bot Configuration (Step 8 - Notifications)
TELEGRAM_BOT_TOKEN="your_bot_token_from_@BotFather"
TELEGRAM_CHAT_ID="your_admin_chat_id"

# Encryption (Step 7 - Security)
ENCRYPTION_KEY="32_character_hex_string_for_AES256"
SESSION_SECRET="random_session_secret"
```

### Telegram Integration Setup

To enable Telegram notifications:

1. **Create a Telegram Bot**:
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` and follow instructions
   - Copy the **bot token** (format: `123456:ABC-DEF1234...`)

2. **Get Your Chat ID**:
   - Search for `@userinfobot` in Telegram
   - Send any message to get your **Chat ID**

3. **Add to Replit Secrets** (recommended) or `.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_chat_id
   ```

4. **Test the integration**:
   ```bash
   curl -X POST http://localhost:3000/test/telegram \
     -H "Content-Type: application/json" \
     -d '{"message": "Test from Escrow Platform"}'
   ```

## 🗄️ Database Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only - WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio to view/edit data
npx prisma studio

# Check database connection
npx prisma db pull
```

## 📄 Changelog

### Step 8 — Notifications & Integrations (October 21, 2025) ✅
- ✅ Installed @nestjs/event-emitter for event-driven architecture
- ✅ Created notifications module with email and Telegram submodules
- ✅ **Email Notifications**:
  - Mock email adapter for testing
  - Interface-based design (ready for Resend/SendGrid integration)
  - Event handlers for: deal.created, deal.released, dispute.opened
  - Sends notifications to both buyer and seller
- ✅ **Telegram Notifications** (LIVE INTEGRATION 🚀):
  - **RealTelegramAdapter** using Telegram Bot API
  - Live integration with bot: **@MSPro_Escrow_Bot**
  - Admin notifications for: deal.created, dispute.opened
  - HTML formatting support
  - Test endpoint: `POST /test/telegram` for verification
- ✅ **Event Integration**:
  - EventEmitter2 integrated into DealsService using emitAsync()
  - Automatic event emission on state transitions
  - Events logged to audit_logs with full context (userId: null for system events)
- ✅ **Testing**:
  - Unit tests: 91/91 passed ✅
  - E2E tests: 6/6 notifications tests passing ✅
  - Live Telegram test: Message ID #11 delivered successfully ✅
- ✅ Updated README.md and replit.md with Step 8 documentation
- ✅ Version updated to **v1.2 - Notifications & Integrations**

### Step 7 — Security & Audit Hardening (October 21, 2025) ✅
- ✅ Created crypto.util.ts with AES-256-GCM encryption/decryption
- ✅ Added ENCRYPTION_KEY to Replit Secrets for secure key management
- ✅ Extended Prisma schema: userAgent, actionContext to audit_logs; PENDING_REVIEW deal status
- ✅ Created AuditMiddleware for HTTP request logging
- ✅ Created FraudService with mock KYC/fraud detection
- ✅ Fraud detection rules: >$50k deals blocked, >10 deals/24h flagged
- ✅ Unit tests: 78/78 passing
- ✅ E2E tests: Security 4/4 passing

### Step 6 — Webhooks & Admin Arbitration (October 21, 2025) ✅
- ✅ Created WebhooksModule for payment provider callbacks
- ✅ Implemented webhook idempotency and signature verification
- ✅ Created AdminModule with RBAC guard
- ✅ Implemented manual dispute resolution actions
- ✅ Unit tests: 52/52 passing
- ✅ E2E tests: Webhooks 3/3, Admin 5/5 passing

### Step 5 — Payment Integration (October 21, 2025) ✅
- ✅ Created Payments module with MockPaymentAdapter
- ✅ Implemented hold/capture/refund operations
- ✅ Enhanced deal funding flow with payment holds
- ✅ Extended Prisma schema with payment tracking

### Step 4 — Deals Module & State Machine (October 21, 2025) — **v0.9**
- ✅ Created deals module with controller, service, and DTOs
- ✅ Implemented **6-state state machine** (PENDING, FUNDED, IN_PROGRESS, DISPUTED, COMPLETED, CANCELLED)
- ✅ **Design Decision**: Simplified state machine for MVP; full version planned for Step 6
- ✅ Implemented state transition validation and enforcement
- ✅ Created 8 API endpoints for deal management:
  - POST /api/v1/deals (createDeal)
  - GET /api/v1/deals (findAll)
  - GET /api/v1/deals/:id (findOne)
  - POST /api/v1/deals/:id/fund (fundDeal)
  - POST /api/v1/deals/:id/confirm (confirmExecution)
  - POST /api/v1/deals/:id/accept (acceptByBuyer)
  - POST /api/v1/deals/:id/dispute (raiseDispute)
  - POST /api/v1/deals/:id/cancel (cancelDeal)
- ✅ Integrated automatic audit logging for all state transitions
- ✅ Added authorization checks (buyer-only, seller-only actions)
- ✅ **Security fixes**: Excluded passwordHash from all API responses, added DTO validation
- ✅ Enabled global ValidationPipe with whitelist and transformation
- ✅ Created comprehensive unit tests (12 test cases)
- ✅ Created e2e tests covering full deal lifecycle
- ✅ All tests passing (26/26: 17 unit + 9 e2e)
- ✅ Updated documentation with state machine flow and API reference
- ✅ **Version locked as "Escrow Core MVP (v0.9)"** - ready for Step 5 integration

### Step 3 — Database & ORM Setup (October 21, 2025)
- ✅ Configured PostgreSQL database via Replit integration
- ✅ Installed and configured Prisma ORM 6.17.1
- ✅ Designed database schema with 4 tables (users, deals, payments, audit_logs)
- ✅ Created and applied initial database migration
- ✅ Implemented PrismaService for database connection management
- ✅ Created Database module with health check and statistics endpoints
- ✅ Added `/db/health` endpoint returning database status
- ✅ Added `/db/stats` endpoint returning table counts
- ✅ Created comprehensive unit tests for database controller (5 total)
- ✅ Created e2e tests for database endpoints (3 total)
- ✅ All tests passing (8/8)
- ✅ Updated documentation with schema and API endpoints

### Step 2 — Repository Setup (October 20, 2025)
- ✅ Created comprehensive README.md with architecture documentation
- ✅ Configured .gitignore for Node.js/NestJS projects
- ✅ Updated project documentation (replit.md)
- ✅ Synced repository to GitHub
- ✅ Renamed repository to mspro_escrow_mvp
- ✅ Documented architecture, current state, and roadmap

### Step 1 — Initialization (October 20, 2025)
- ✅ Initialized NestJS project with TypeScript
- ✅ Configured ESLint and Prettier
- ✅ Implemented `/health` endpoint returning `{ status: "ok" }`
- ✅ Set up Jest testing framework (unit + e2e tests)
- ✅ Created modular structure with `src/modules/` directory
- ✅ Configured development workflow with hot reload

## 🛠️ Roadmap: v0.9 → v1.0

### Step 5 — ЮKassa Integration (Payment Hold/Release)
**Goal**: Integrate ЮKassa payment gateway with hold/release functionality
- [ ] Configure ЮKassa API connection and credentials
- [ ] Implement payment hold on deal creation
- [ ] Implement payment release on deal completion
- [ ] Add webhook handlers for payment status updates
- [ ] Create Payment module with transaction tracking
- [ ] Add User authentication (JWT-based)
- [ ] Add role-based authorization guards
- [ ] Write comprehensive tests for payment flows

### Step 6 — Extended State Machine & Arbitration
**Goal**: Expand state machine to full escrow workflow with arbitration
- [ ] **New States**: DRAFT, PENDING_CONFIRMATION, RELEASED, CLOSED, REFUNDED, CANCELLED_BY_BUYER, CANCELLED_BY_SELLER
- [ ] Database migration for extended states
- [ ] Implement admin arbitration for DISPUTED deals
- [ ] Add resolution workflows (refund, force-complete)
- [ ] Create Admin panel endpoints
- [ ] Add dispute resolution timeline tracking
- [ ] Implement automated state transitions based on timeouts
- [ ] WebSocket notifications for real-time updates

### Step 7+ — Advanced Features
- [ ] Crypto Gateway integration (Bitcoin, Ethereum, USDT)
- [ ] Multi-currency support
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Rate limiting and security hardening
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker containerization for production
- [ ] Performance optimization and caching
- [ ] Analytics and reporting dashboard

## 📄 Notes

Each step appends results and changelog here for architectural supervision.
The project follows NestJS best practices with a modular architecture to ensure scalability and maintainability.

## 📜 License

MIT

## 👤 Author

MSPRO Team
