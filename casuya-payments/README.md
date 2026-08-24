# @casuya/payments

**Finance Office — Digital Treasury.**

Part of the Casuya Phase 3 Platform Services. Handles financial transactions securely across the ecosystem.

## Modules

```
transactions/  — Payment transaction processing
invoices/      — Invoice generation and management
subscriptions/ — Recurring billing and subscriptions
billing/       — Billing system and cycles
refunds/       — Refund processing
receipts/      — Receipt generation
providers/     — Payment providers (Stripe, PayPal, Mobile Money, Bank Transfer)
currencies/    — Multi-currency support
fraud/         — Fraud detection and prevention
reconciliation/— Transaction reconciliation
logs/          — Financial audit trail
```

## Phase 3 Compliance

- [x] Shared service — not feature-specific
- [x] Provider-based — all modules are pluggable
- [x] Replaceable — providers swap without rewrites
- [x] API-first — only interfaces exposed
- [x] Scalable — designed for millions of transactions
- [x] Extensible — add payment providers, currencies
