import { ICurrencyManager, ICurrency, EventBus } from '../../interfaces';

const DEFAULT_CURRENCIES: ICurrency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2, exchange_rate: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimal_places: 2, exchange_rate: 0.85 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimal_places: 2, exchange_rate: 0.73 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimal_places: 0, exchange_rate: 110.25 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimal_places: 2, exchange_rate: 410.50 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', decimal_places: 2, exchange_rate: 115.30 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', decimal_places: 2, exchange_rate: 8.75 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimal_places: 2, exchange_rate: 15.20 },
];

export class CurrencyService implements ICurrencyManager {
  private currencies: Map<string, ICurrency> = new Map();

  constructor(private eventBus: EventBus) {
    for (const currency of DEFAULT_CURRENCIES) {
      this.currencies.set(currency.code, currency);
    }
  }

  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    const from = this.currencies.get(fromCurrency.toUpperCase());
    const to = this.currencies.get(toCurrency.toUpperCase());
    if (!from || !to) {
      throw new Error(`Unsupported currency: ${!from ? fromCurrency : toCurrency}`);
    }
    const baseAmount = amount / (from.exchange_rate || 1);
    return Math.round((baseAmount * (to.exchange_rate || 1)) * 100) / 100;
  }

  formatAmount(amount: number, currency: string): string {
    const currencyInfo = this.currencies.get(currency.toUpperCase());
    if (!currencyInfo) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    return `${currencyInfo.symbol}${amount.toFixed(currencyInfo.decimal_places)}`;
  }

  getExchangeRate(fromCurrency: string, toCurrency: string): number {
    const from = this.currencies.get(fromCurrency.toUpperCase());
    const to = this.currencies.get(toCurrency.toUpperCase());
    if (!from || !to) {
      throw new Error(`Unsupported currency: ${!from ? fromCurrency : toCurrency}`);
    }
    return (to.exchange_rate || 1) / (from.exchange_rate || 1);
  }

  getSupportedCurrencies(): string[] {
    return Array.from(this.currencies.keys());
  }

  addCurrency(currency: ICurrency): void {
    this.currencies.set(currency.code.toUpperCase(), currency);
    this.eventBus.publish({
      id: `currency_added_${Date.now()}`,
      type: 'CURRENCY_ADDED',
      payload: { currency },
      timestamp: new Date(),
      source: 'CurrencyService',
    });
  }
}
