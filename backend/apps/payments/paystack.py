import logging
from typing import Any, Dict, List, Optional
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

PAYSTACK_API_BASE = 'https://api.paystack.co'

# Fallback popular Nigerian banks if Paystack bank API is unreachable or during offline dev
DEFAULT_NIGERIAN_BANKS = [
    {"name": "Access Bank", "code": "044", "slug": "access-bank"},
    {"name": "Guaranty Trust Bank (GTBank)", "code": "058", "slug": "guaranty-trust-bank"},
    {"name": "First Bank of Nigeria", "code": "011", "slug": "first-bank-of-nigeria"},
    {"name": "United Bank For Africa (UBA)", "code": "033", "slug": "united-bank-for-africa"},
    {"name": "Zenith Bank", "code": "057", "slug": "zenith-bank"},
    {"name": "Kuda Bank", "code": "50211", "slug": "kuda-bank"},
    {"name": "OPay Digital Services", "code": "999992", "slug": "paycom"},
    {"name": "PalmPay", "code": "999991", "slug": "palmpay"},
    {"name": "Stanbic IBTC Bank", "code": "221", "slug": "stanbic-ibtc-bank"},
    {"name": "Sterling Bank", "code": "232", "slug": "sterling-bank"},
    {"name": "Fidelity Bank", "code": "070", "slug": "fidelity-bank"},
    {"name": "Wema Bank", "code": "035", "slug": "wema-bank"},
]


class PaystackError(Exception):
    def __init__(self, message: str, status_code: int = 400, raw_response: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.raw_response = raw_response or {}


def get_paystack_headers() -> Dict[str, str]:
    secret_key = settings.PAYSTACK_SECRET_KEY
    if not secret_key:
        raise PaystackError("Paystack secret key is not configured on this server.", status_code=503)
    return {
        'Authorization': f'Bearer {secret_key}',
        'Content-Type': 'application/json',
    }


def list_banks(country: str = 'nigeria') -> List[Dict[str, str]]:
    """Fetch banks supported in Nigeria from Paystack, falling back to top banks if unavailable."""
    if not settings.PAYSTACK_SECRET_KEY:
        return DEFAULT_NIGERIAN_BANKS

    try:
        url = f"{PAYSTACK_API_BASE}/bank?country={country}"
        response = requests.get(url, headers=get_paystack_headers(), timeout=10)
        data = response.json()
        if response.ok and data.get('status') and isinstance(data.get('data'), list):
            return [
                {
                    'name': b.get('name', ''),
                    'code': b.get('code', ''),
                    'slug': b.get('slug', ''),
                }
                for b in data['data']
                if b.get('active', True)
            ]
    except Exception as exc:
        logger.warning("Error fetching banks from Paystack: %s. Using default bank list.", exc)

    return DEFAULT_NIGERIAN_BANKS


def resolve_bank_account(account_number: str, bank_code: str) -> Dict[str, str]:
    """Verify Nigerian account number with Paystack and return the account name."""
    account_number = str(account_number).strip()
    bank_code = str(bank_code).strip()

    if not account_number.isdigit() or len(account_number) != 10:
        raise PaystackError("Account number must be exactly 10 digits.")
    if not bank_code:
        raise PaystackError("Bank code is required.")

    if not settings.PAYSTACK_SECRET_KEY:
        raise PaystackError("Payment provider credentials not configured.", status_code=503)

    try:
        url = f"{PAYSTACK_API_BASE}/bank/resolve?account_number={account_number}&bank_code={bank_code}"
        response = requests.get(url, headers=get_paystack_headers(), timeout=12)
        data = response.json()
    except requests.RequestException as exc:
        logger.error("Paystack account resolve network error: %s", exc)
        raise PaystackError("Could not reach payment provider to verify bank account.", status_code=502)

    if not response.ok or not data.get('status'):
        msg = data.get('message', 'Could not resolve account with this bank.')
        raise PaystackError(msg, status_code=400, raw_response=data)

    resolved_data = data.get('data') or {}
    account_name = resolved_data.get('account_name', '').strip()
    if not account_name:
        raise PaystackError("Account name could not be resolved.")

    return {
        'account_name': account_name,
        'account_number': account_number,
        'bank_code': bank_code,
    }


def create_subaccount(
    business_name: str,
    settlement_bank: str,
    account_number: str,
    percentage_charge: float,
) -> Dict[str, Any]:
    """
    Create a Paystack subaccount for a creator.
    percentage_charge is the percentage of the fee that Bio Gatekeeper retains (e.g. 10.0).
    """
    if not settings.PAYSTACK_SECRET_KEY:
        raise PaystackError("Payment provider credentials not configured.", status_code=503)

    payload = {
        'business_name': business_name[:100],
        'settlement_bank': settlement_bank,
        'account_number': account_number,
        'percentage_charge': float(percentage_charge),
        'description': f"Bio Gatekeeper subaccount for {business_name}",
    }

    try:
        url = f"{PAYSTACK_API_BASE}/subaccount"
        response = requests.post(url, json=payload, headers=get_paystack_headers(), timeout=15)
        data = response.json()
    except requests.RequestException as exc:
        logger.error("Paystack create subaccount network error: %s", exc)
        raise PaystackError("Could not reach Paystack to configure subaccount.", status_code=502)

    if not response.ok or not data.get('status'):
        msg = data.get('message', 'Failed to create Paystack subaccount.')
        raise PaystackError(msg, status_code=400, raw_response=data)

    subaccount_data = data.get('data') or {}
    subaccount_code = subaccount_data.get('subaccount_code')
    if not subaccount_code:
        raise PaystackError("No subaccount code returned by payment provider.")

    return {
        'subaccount_code': subaccount_code,
        'business_name': subaccount_data.get('business_name', business_name),
        'id': subaccount_data.get('id'),
    }


def calculate_split_allocation(amount_kobo: int, fee_percent: int = 10) -> Dict[str, int]:
    """
    Calculate platform fee and creator allocation in kobo.
    Example: ₦2,500 (250,000 kobo) at 10% fee:
      platform_fee_kobo = 25,000 kobo (₦250)
      creator_amount_kobo = 225,000 kobo (₦2,250)
    """
    fee_kobo = int(round(amount_kobo * (fee_percent / 100.0)))
    creator_kobo = amount_kobo - fee_kobo
    return {
        'total_amount_kobo': amount_kobo,
        'platform_fee_kobo': fee_kobo,
        'creator_amount_kobo': creator_kobo,
        'fee_percent': fee_percent,
    }
