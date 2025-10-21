# Known Issues

## Step 5 - Payments Module
- PaymentsModule has circular dependency issue when imported into AppModule
- Unit tests pass (23/23)
- Integration needs refactoring (consider using events/queues instead of direct service injection)
- Temporary workaround: Keep PaymentsModule separate until architecture review
