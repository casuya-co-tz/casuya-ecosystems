"""
Casuya Payments Python Client
Usage:
    from casuya_payments import CasuyaPaymentsClient
    client = CasuyaPaymentsClient("http://localhost:3002")
    payment = client.create_payment(user_id="u1", amount=5000)
"""

from __future__ import annotations

import os
from typing import Any

import httpx


class CasuyaPaymentsClient:
    """HTTP client for the casuya-payments microservice."""

    def __init__(self, base_url: str | None = None, timeout: float = 30.0):
        self.base_url = (base_url or os.getenv("CASUYA_PAYMENTS_URL", "http://localhost:3002")).rstrip("/")
        self.http = httpx.Client(base_url=self.base_url, timeout=timeout)

    def _get(self, path: str, params: dict | None = None) -> Any:
        resp = self.http.get(path, params=params)
        resp.raise_for_status()
        return resp.json()

    def _post(self, path: str, json: dict | None = None) -> Any:
        resp = self.http.post(path, json=json)
        resp.raise_for_status()
        return resp.json()

    # ── Health ────────────────────────────────────────────────────────────

    def health(self) -> dict:
        return self._get("/health")

    # ── Payments ──────────────────────────────────────────────────────────

    def list_payments(self, user_id: str | None = None, status: str | None = None,
                      limit: int = 100, offset: int = 0) -> list[dict]:
        params: dict[str, Any] = {"limit": limit, "offset": offset}
        if user_id:
            params["user_id"] = user_id
        if status:
            params["status"] = status
        return self._get("/payments", params=params)

    def get_payment(self, payment_id: str) -> dict:
        return self._get(f"/payments/{payment_id}")

    def create_payment(self, user_id: str, amount: float, currency: str = "TZS",
                       provider: str = "azampay", metadata: dict | None = None) -> dict:
        return self._post("/payments", json={
            "user_id": user_id,
            "amount": amount,
            "currency": currency,
            "provider": provider,
            "metadata": metadata or {},
        })

    def process_payment(self, payment_id: str) -> dict:
        return self._post(f"/payments/{payment_id}/process")

    def refund_payment(self, payment_id: str, amount: float | None = None,
                       reason: str = "") -> dict:
        return self._post(f"/payments/{payment_id}/refund", json={
            "amount": amount,
            "reason": reason,
        })

    def cancel_payment(self, payment_id: str) -> dict:
        return self._post(f"/payments/{payment_id}/cancel")

    # ── Checkout (AzamPay) ────────────────────────────────────────────────

    def checkout(self, amount: float, mobile_number: str, provider: str = "m-pesa",
                 user_id: str | None = None, idempotency_key: str | None = None) -> dict:
        return self._post("/checkout", json={
            "amount": amount,
            "mobile_number": mobile_number,
            "provider": provider,
            "user_id": user_id,
            "idempotency_key": idempotency_key,
        })

    def webhook(self, payload: dict) -> dict:
        return self._post("/webhook", json=payload)

    # ── Transactions ──────────────────────────────────────────────────────

    def list_transactions(self, payment_id: str | None = None,
                          user_id: str | None = None) -> list[dict]:
        params: dict[str, Any] = {}
        if payment_id:
            params["payment_id"] = payment_id
        if user_id:
            params["user_id"] = user_id
        return self._get("/transactions", params=params)

    # ── Subscriptions ─────────────────────────────────────────────────────

    def list_subscriptions(self, user_id: str | None = None,
                           status: str | None = None) -> list[dict]:
        params: dict[str, Any] = {}
        if user_id:
            params["user_id"] = user_id
        if status:
            params["status"] = status
        return self._get("/subscriptions", params=params)

    def get_subscription(self, subscription_id: str) -> dict:
        return self._get(f"/subscriptions/{subscription_id}")

    def create_subscription(self, user_id: str, plan_id: str,
                            amount: float, currency: str = "TZS") -> dict:
        return self._post("/subscriptions", json={
            "user_id": user_id,
            "plan_id": plan_id,
            "amount": amount,
            "currency": currency,
        })

    def cancel_subscription(self, subscription_id: str, immediate: bool = False) -> dict:
        return self._post(f"/subscriptions/{subscription_id}/cancel", json={
            "immediate": immediate,
        })

    def pause_subscription(self, subscription_id: str) -> dict:
        return self._post(f"/subscriptions/{subscription_id}/pause")

    def resume_subscription(self, subscription_id: str) -> dict:
        return self._post(f"/subscriptions/{subscription_id}/resume")

    # ── Invoices ──────────────────────────────────────────────────────────

    def list_invoices(self, user_id: str | None = None, status: str | None = None,
                      subscription_id: str | None = None) -> list[dict]:
        params: dict[str, Any] = {}
        if user_id:
            params["user_id"] = user_id
        if status:
            params["status"] = status
        if subscription_id:
            params["subscription_id"] = subscription_id
        return self._get("/invoices", params=params)

    def get_invoice(self, invoice_id: str) -> dict:
        return self._get(f"/invoices/{invoice_id}")

    def create_invoice(self, user_id: str, amount: float, currency: str = "TZS",
                       tax_amount: float = 0, discount_amount: float = 0,
                       items: list[dict] | None = None, due_date: str | None = None,
                       payment_id: str | None = None,
                       subscription_id: str | None = None) -> dict:
        return self._post("/invoices", json={
            "user_id": user_id,
            "payment_id": payment_id,
            "subscription_id": subscription_id,
            "amount": amount,
            "currency": currency,
            "tax_amount": tax_amount,
            "discount_amount": discount_amount,
            "items": items or [],
            "due_date": due_date,
        })

    def pay_invoice(self, invoice_id: str) -> dict:
        return self._post(f"/invoices/{invoice_id}/pay")

    # ── Refunds ───────────────────────────────────────────────────────────

    def list_refunds(self, payment_id: str | None = None,
                     user_id: str | None = None) -> list[dict]:
        params: dict[str, Any] = {}
        if payment_id:
            params["payment_id"] = payment_id
        if user_id:
            params["user_id"] = user_id
        return self._get("/refunds", params=params)

    # ── Billing ───────────────────────────────────────────────────────────

    def list_billing(self, user_id: str | None = None) -> list[dict]:
        params: dict[str, Any] = {}
        if user_id:
            params["user_id"] = user_id
        return self._get("/billing", params=params)

    def create_billing(self, user_id: str, amount: float, currency: str = "TZS",
                       period: str = "monthly", due_date: str | None = None,
                       subscription_id: str | None = None) -> dict:
        return self._post("/billing", json={
            "user_id": user_id,
            "subscription_id": subscription_id,
            "amount": amount,
            "currency": currency,
            "period": period,
            "due_date": due_date,
        })

    # ── Audit ─────────────────────────────────────────────────────────────

    def list_audit_logs(self, user_id: str | None = None, action: str | None = None,
                        resource_type: str | None = None) -> list[dict]:
        params: dict[str, Any] = {}
        if user_id:
            params["user_id"] = user_id
        if action:
            params["action"] = action
        if resource_type:
            params["resource_type"] = resource_type
        return self._get("/audit", params=params)

    def log_audit(self, action: str, resource_type: str, user_id: str | None = None,
                  resource_id: str | None = None, metadata: dict | None = None) -> dict:
        return self._post("/audit", json={
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "metadata": metadata or {},
        })

    # ── Stats ─────────────────────────────────────────────────────────────

    def get_stats(self, user_id: str | None = None) -> dict:
        params: dict[str, Any] = {}
        if user_id:
            params["user_id"] = user_id
        return self._get("/stats", params=params)

    # ── Currencies ────────────────────────────────────────────────────────

    def list_currencies(self) -> list[dict]:
        return self._get("/currencies")

    def convert_currency(self, amount: float, from_currency: str, to_currency: str) -> dict:
        return self._get("/currencies/convert", params={
            "amount": amount,
            "from": from_currency,
            "to": to_currency,
        })

    def close(self):
        self.http.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
