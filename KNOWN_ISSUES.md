# Known Issues

## Step 5 - Payments Module Integration

### Issue: Circular Dependency in PaymentsModule
**Status**: Blocking integration  
**Severity**: High  
**Created**: October 21, 2025

#### Description
PaymentsModule cannot be imported into AppModule due to a circular dependency error detected by NestJS during module initialization. The error occurs even with simplified module structure and global PrismaModule.

#### Error Message
```
A circular dependency has been detected inside PaymentsModule. 
Please, make sure that each side of a bidirectional relationships are decorated with "forwardRef()". 
Note that circular relationships between custom providers (e.g., factories) are not supported since functions cannot be called more than once.
```

#### Current State
- ✅ PaymentsModule works in isolation (unit tests: 23/23 passing)
- ✅ Mock payment adapter fully functional (hold/capture/refund operations)
- ✅ Payment logging to audit_logs table working
- ❌ Cannot import PaymentsModule into AppModule without crash
- ❌ Cannot integrate with DealsService for escrow flow
- ❌ E2E tests fail (8 failed) - endpoints return 404 as module not loaded

#### Attempted Solutions
1. **forwardRef()** in DealsService - No effect
2. **Global PrismaModule** - No effect
3. **Simplified factory** (useClass instead of useFactory) - No effect
4. **Removed ConfigService dependency** - No effect
5. **Removed PaymentsModule from DealsModule imports** - Server runs without integration

#### Root Cause Analysis
The circular dependency appears to be internal to PaymentsModule itself, not between PaymentsModule and DealsModule. The issue persists even when:
- PaymentsModule is imported alone (without DealsModule using it)
- No bidirectional relationship exists between modules
- All providers are simplified

This suggests the problem may be:
- NestJS DI container issue with the specific provider configuration
- Unexpected dependency chain through global modules (ConfigModule/PrismaModule)
- Edge case in NestJS factory resolution

#### Recommended Solution
**Event-Driven Architecture Refactoring**

Instead of direct service injection, use NestJS EventEmitter to decouple modules:

```typescript
// In DealsService
async fundDeal(id: number, userId: number) {
  // ... validation ...
  
  // Emit event instead of direct service call
  this.eventEmitter.emit('payment.hold.requested', {
    dealId: deal.id,
    amount: deal.amount,
    currency: deal.currency,
  });
  
  return this.transitionState(deal.id, 'FUNDED', userId, 'DEAL_FUNDED');
}

// In PaymentsService
@OnEvent('payment.hold.requested')
async handlePaymentHold(payload: PaymentHoldEvent) {
  await this.holdPayment(payload.dealId, payload.amount, payload.currency);
}
```

**Benefits**:
- Eliminates circular dependencies
- Better separation of concerns
- Async processing capability
- Easier to add retry logic and error handling
- Scalable to message queues (RabbitMQ, Redis) in future

**Alternative**: Webhook-based integration where payments are processed externally and results are posted back via HTTP endpoints.

#### Impact
- Core escrow flow (deal state machine) works without payments
- Payment adapter tested and ready for integration
- No data loss or corruption risk
- User authentication and authorization still pending (Step 5 remaining tasks)

#### Next Steps
1. Implement NestJS EventEmitter pattern
2. Refactor DealsService to emit payment events
3. Refactor PaymentsService to listen to payment events
4. Add event-driven tests
5. Update documentation with new architecture

#### Workaround (Temporary)
PaymentsModule is excluded from AppModule. Core escrow functionality works. Payments can be manually tested via unit tests.
