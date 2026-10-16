import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdMobService, DEFAULT_ADMOB_CONFIG } from '../src/mobile/AdMobService';
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

describe('AdMobService', () => {
  let adMobService: AdMobService;

  beforeEach(() => {
    vi.restoreAllMocks();
    adMobService = new AdMobService();
  });

  it('should initialize with default test config and official Google AdMob test IDs', () => {
    const config = adMobService.getConfig();
    expect(config.isTesting).toBe(true);
    expect(config.rewardedAdId).toBe('ca-app-pub-3940256099942544/5224354917');
    expect(config.interstitialAdId).toBe('ca-app-pub-3940256099942544/1033173712');
    expect(config.bannerAdId).toBe('ca-app-pub-3940256099942544/6300978111');
  });

  it('should correctly allow overriding configuration via setConfig', () => {
    adMobService.setConfig({
      isTesting: false,
      rewardedAdId: 'ca-app-pub-custom/1234567890',
    });

    const config = adMobService.getConfig();
    expect(config.isTesting).toBe(false);
    expect(config.rewardedAdId).toBe('ca-app-pub-custom/1234567890');
    expect(config.bannerAdId).toBe(DEFAULT_ADMOB_CONFIG.bannerAdId);
  });

  it('should return false for isNativeAdSupported in web/happy-dom environment', () => {
    expect(adMobService.isNativeAdSupported()).toBe(false);
  });

  it('should invoke fallback callback when showRewardedAd is called on non-native platform', async () => {
    const onRewarded = vi.fn();
    const onFallback = vi.fn();

    const success = await adMobService.showRewardedAd(onRewarded, onFallback);
    expect(success).toBe(false);
    expect(onRewarded).not.toHaveBeenCalled();
    expect(onFallback).toHaveBeenCalledTimes(1);
  });

  it('should not throw and safely return false for prepareRewardedAd and prepareInterstitial on web', async () => {
    const rewReady = await adMobService.prepareRewardedAd();
    const intReady = await adMobService.prepareInterstitial();
    expect(rewReady).toBe(false);
    expect(intReady).toBe(false);
  });

  it('should handle native initialization and rewarded ad flow when isNativePlatform returns true', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    (AdMob as any).initialize = vi.fn().mockResolvedValue(undefined);
    (AdMob as any).prepareRewardVideoAd = vi.fn().mockResolvedValue({ adUnitId: 'test' });
    (AdMob as any).showRewardVideoAd = vi.fn().mockResolvedValue({ type: 'coins', amount: 1 });
    (AdMob as any).addListener = vi.fn().mockResolvedValue({ remove: vi.fn() });

    const nativeService = new AdMobService();
    expect(nativeService.isNativeAdSupported()).toBe(true);

    const prepSuccess = await nativeService.prepareRewardedAd();
    expect(prepSuccess).toBe(true);

    const onRewarded = vi.fn();
    const onFallback = vi.fn();
    const showSuccess = await nativeService.showRewardedAd(onRewarded, onFallback);
    expect(showSuccess).toBe(true);
  });
});
