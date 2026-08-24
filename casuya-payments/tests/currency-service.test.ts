import { CurrencyService } from '../src/modules/currencies/currency.service';
import { EventBusImpl } from '../src/events/event-bus';

describe('CurrencyService', () => {
  let eventBus: EventBusImpl;
  let service: CurrencyService;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    service = new CurrencyService(eventBus);
  });

  describe('getSupportedCurrencies', () => {
    it('should return default currencies', () => {
      const currencies = service.getSupportedCurrencies();
      expect(currencies).toContain('USD');
      expect(currencies).toContain('EUR');
      expect(currencies).toContain('GBP');
      expect(currencies).toContain('JPY');
      expect(currencies).toContain('NGN');
      expect(currencies).toContain('KES');
      expect(currencies).toContain('GHS');
      expect(currencies).toContain('ZAR');
      expect(currencies.length).toBe(8);
    });
  });

  describe('convert', () => {
    it('should convert USD to EUR', () => {
      const result = service.convert(100, 'USD', 'EUR');
      expect(result).toBe(85);
    });

    it('should convert USD to GBP', () => {
      const result = service.convert(100, 'USD', 'GBP');
      expect(result).toBe(73);
    });

    it('should return same value for same currency', () => {
      const result = service.convert(100, 'USD', 'USD');
      expect(result).toBe(100);
    });

    it('should handle lowercase currency codes', () => {
      const result = service.convert(100, 'usd', 'eur');
      expect(result).toBe(85);
    });

    it('should throw for unsupported source currency', () => {
      expect(() => service.convert(100, 'XYZ', 'USD')).toThrow('Unsupported currency');
    });

    it('should throw for unsupported target currency', () => {
      expect(() => service.convert(100, 'USD', 'XYZ')).toThrow('Unsupported currency');
    });

    it('should round result to 2 decimal places', () => {
      const result = service.convert(1, 'USD', 'NGN');
      expect(result).toBe(Math.round(410.5 * 100) / 100);
    });

    it('should convert JPY (0 decimal places) correctly', () => {
      const result = service.convert(1, 'USD', 'JPY');
      expect(result).toBe(Math.round(110.25 * 100) / 100);
    });
  });

  describe('formatAmount', () => {
    it('should format USD with $ symbol and 2 decimals', () => {
      expect(service.formatAmount(100, 'USD')).toBe('$100.00');
    });

    it('should format EUR with € symbol', () => {
      expect(service.formatAmount(50.5, 'EUR')).toBe('€50.50');
    });

    it('should format GBP with £ symbol', () => {
      expect(service.formatAmount(75, 'GBP')).toBe('£75.00');
    });

    it('should format JPY with ¥ and no decimals', () => {
      expect(service.formatAmount(1000, 'JPY')).toBe('¥1000');
    });

    it('should handle lowercase currency codes', () => {
      expect(service.formatAmount(100, 'usd')).toBe('$100.00');
    });

    it('should throw for unsupported currency', () => {
      expect(() => service.formatAmount(100, 'XYZ')).toThrow('Unsupported currency');
    });

    it('should format zero amounts', () => {
      expect(service.formatAmount(0, 'USD')).toBe('$0.00');
    });

    it('should format NGN with ₦ symbol', () => {
      expect(service.formatAmount(1000, 'NGN')).toBe('₦1000.00');
    });
  });

  describe('getExchangeRate', () => {
    it('should return rate between USD and EUR', () => {
      const rate = service.getExchangeRate('USD', 'EUR');
      expect(rate).toBeCloseTo(0.85);
    });

    it('should return inverse rate', () => {
      const rate = service.getExchangeRate('EUR', 'USD');
      expect(rate).toBeCloseTo(1 / 0.85);
    });

    it('should return 1 for same currency', () => {
      expect(service.getExchangeRate('USD', 'USD')).toBe(1);
    });

    it('should throw for unsupported currency', () => {
      expect(() => service.getExchangeRate('XYZ', 'USD')).toThrow('Unsupported currency');
    });
  });

  describe('addCurrency', () => {
    it('should add a new currency', () => {
      service.addCurrency({ code: 'BTC', name: 'Bitcoin', symbol: '₿', decimal_places: 8, exchange_rate: 0.000023 });
      const currencies = service.getSupportedCurrencies();
      expect(currencies).toContain('BTC');
    });

    it('should allow converting with new currency', () => {
      service.addCurrency({ code: 'BTC', name: 'Bitcoin', symbol: '₿', decimal_places: 8, exchange_rate: 0.000023 });
      const result = service.convert(100, 'USD', 'BTC');
      expect(result).toBe(Math.round((100 * 0.000023) * 100) / 100);
    });

    it('should publish CURRENCY_ADDED event', () => {
      const handler = jest.fn();
      eventBus.subscribe('CURRENCY_ADDED', handler);
      service.addCurrency({ code: 'BTC', name: 'Bitcoin', symbol: '₿', decimal_places: 8, exchange_rate: 0.000023 });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should overwrite existing currency', () => {
      service.addCurrency({ code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2, exchange_rate: 999 });
      expect(service.getExchangeRate('USD', 'EUR')).toBeCloseTo(0.85 / 999, 6);
    });
  });
});
