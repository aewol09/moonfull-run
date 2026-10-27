import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillingService } from '../src/mobile/BillingService';
import { CASH_SHOP_PACKAGES, StorageManager } from '../src/core/StorageManager';
import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

vi.mock('@capgo/native-purchases', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    NativePurchases: {
      isBillingSupported: vi.fn().mockResolvedValue({ isBillingSupported: true }),
      getProducts: vi.fn().mockResolvedValue({ products: [] }),
      purchaseProduct: vi.fn(),
      getPurchases: vi.fn()
    }
  };
});

describe('BillingService', () => {
  let billingService: BillingService;
  let storage: StorageManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    storage = new StorageManager();
    billingService = new BillingService();
  });

  it('should identify web platform and provide simulation mode', async () => {
    expect(billingService.isSupported()).toBe(false);

    const starterPkg = CASH_SHOP_PACKAGES[0];
    const result = await billingService.purchasePackage(starterPkg);
    expect(result.success).toBe(true);
  });

  it('should call NativePurchases.purchaseProduct on native platform with correct options', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    const mockPurchase = vi.fn().mockResolvedValue({
      transactionId: 'GPA.1234-5678-9012-34567',
      productIdentifier: 'starter_pack',
      purchaseToken: 'test-purchase-token'
    });
    (NativePurchases.purchaseProduct as any) = mockPurchase;

    const nativeBilling = new BillingService();
    const starterPkg = CASH_SHOP_PACKAGES.find(p => p.id === 'starter_pack')!;
    const res = await nativeBilling.purchasePackage(starterPkg);

    expect(res.success).toBe(true);
    expect(mockPurchase).toHaveBeenCalledWith({
      productIdentifier: 'starter_pack',
      productType: PURCHASE_TYPE.INAPP,
      isConsumable: true,
      autoAcknowledgePurchases: true
    });
  });

  it('should treat vip_unlimited as non-consumable (isConsumable: false)', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    const mockPurchase = vi.fn().mockResolvedValue({
      transactionId: 'GPA.9999-8888-7777-66666',
      productIdentifier: 'vip_unlimited',
      purchaseToken: 'test-vip-token'
    });
    (NativePurchases.purchaseProduct as any) = mockPurchase;

    const nativeBilling = new BillingService();
    const vipPkg = CASH_SHOP_PACKAGES.find(p => p.id === 'vip_unlimited')!;
    const res = await nativeBilling.purchasePackage(vipPkg);

    expect(res.success).toBe(true);
    expect(mockPurchase).toHaveBeenCalledWith({
      productIdentifier: 'vip_unlimited',
      productType: PURCHASE_TYPE.INAPP,
      isConsumable: false,
      autoAcknowledgePurchases: true
    });
  });

  it('should correctly detect user cancellation', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    (NativePurchases.purchaseProduct as any) = vi.fn().mockRejectedValue(new Error('USER_CANCELED'));

    const nativeBilling = new BillingService();
    const res = await nativeBilling.purchasePackage(CASH_SHOP_PACKAGES[0]);

    expect(res.success).toBe(false);
    expect(res.cancelled).toBe(true);
    expect(res.error).toContain('취소');
  });

  it('should restore VIP purchases from Google Play receipt history', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    (NativePurchases.getPurchases as any) = vi.fn().mockResolvedValue({
      purchases: [
        {
          transactionId: 'GPA.1111-2222',
          productIdentifier: 'vip_unlimited'
        }
      ]
    });

    expect(storage.isVipMember()).toBe(false);

    const nativeBilling = new BillingService();
    const restoreRes = await nativeBilling.restorePurchases(storage);

    expect(restoreRes.restoredCount).toBe(1);
    expect(storage.isVipMember()).toBe(true);
  });
});
