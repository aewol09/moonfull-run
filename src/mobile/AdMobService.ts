import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  RewardAdOptions,
  RewardAdPluginEvents,
  AdMobRewardItem,
  InterstitialAdPluginEvents,
  AdOptions
} from '@capacitor-community/admob';

export interface AdMobConfig {
  /**
   * 구글 AdMob 테스트 모드 활성화 여부 (개발/테스트 중에는 true 권장)
   */
  isTesting: boolean;
  /**
   * 리워드 동영상 광고 단위 ID (이어하기/보상형 광고)
   */
  rewardedAdId: string;
  /**
   * 전면 광고 단위 ID (게임오버/스테이지 클리어 시)
   */
  interstitialAdId: string;
  /**
   * 하단 배너 광고 단위 ID
   */
  bannerAdId: string;
}

/**
 * 구글 공식 AdMob 테스트 광고 단위 ID (안드로이드)
 * 배포 시 실제 AdMob 콘솔에서 발급받은 단위 ID로 교체하거나 setConfig()로 주입할 수 있습니다.
 */
export const DEFAULT_ADMOB_CONFIG: AdMobConfig = {
  isTesting: true,
  rewardedAdId: 'ca-app-pub-3940256099942544/5224354917',
  interstitialAdId: 'ca-app-pub-3940256099942544/1033173712',
  bannerAdId: 'ca-app-pub-3940256099942544/6300978111',
};

export class AdMobService {
  private config: AdMobConfig;
  private isInitialized = false;
  private isRewardedLoaded = false;
  private isInterstitialLoaded = false;
  private isBannerShowing = false;

  // Active callbacks for rewarded ad session
  private pendingRewardedCallback: (() => void) | null = null;
  private pendingDismissCallback: (() => void) | null = null;
  private wasRewardGrantedInCurrentSession = false;

  constructor(customConfig?: Partial<AdMobConfig>) {
    this.config = { ...DEFAULT_ADMOB_CONFIG, ...customConfig };
    this.init();
  }

  /**
   * 네이티브 안드로이드/iOS 환경에서 실제 AdMob을 지원하는지 확인
   */
  public isNativeAdSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * AdMob 설정 변경 (운영용 AdMob 단위 ID 주입 등)
   */
  public setConfig(newConfig: Partial<AdMobConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): Readonly<AdMobConfig> {
    return this.config;
  }

  /**
   * AdMob SDK 초기화 및 이벤트 리스너 등록
   */
  public async init(): Promise<void> {
    if (!this.isNativeAdSupported()) {
      console.log('[AdMobService] Web/Browser 환경 감지: 네이티브 광고 비활성화 (인게임 시뮬레이션 모드 작동)');
      return;
    }

    if (this.isInitialized) return;

    try {
      await AdMob.initialize({
        initializeForTesting: this.config.isTesting,
      });
      this.isInitialized = true;
      console.log('[AdMobService] AdMob SDK 초기화 완료');

      this.registerRewardListeners();
      this.registerInterstitialListeners();
      this.registerBannerListeners();

      // 최초 광고 사전 로드 (사전 캐싱)
      await this.prepareRewardedAd();
      await this.prepareInterstitial();
    } catch (err) {
      console.error('[AdMobService] AdMob 초기화 실패:', err);
    }
  }

  // --- 1. 리워드 광고 (Rewarded Video Ad) ---

  private registerRewardListeners(): void {
    AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
      this.isRewardedLoaded = true;
      console.log('[AdMobService] 리워드 광고 로드 완료');
    });

    AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
      this.isRewardedLoaded = false;
      console.warn('[AdMobService] 리워드 광고 로드 실패:', error);
    });

    AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
      console.log('[AdMobService] 리워드 획득 성공:', reward);
      this.wasRewardGrantedInCurrentSession = true;
      if (this.pendingRewardedCallback) {
        const cb = this.pendingRewardedCallback;
        this.pendingRewardedCallback = null;
        cb();
      }
    });

    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      console.log('[AdMobService] 리워드 광고 닫힘');
      this.isRewardedLoaded = false;

      // 보상을 받지 못하고 닫은 경우 콜백 호출
      if (!this.wasRewardGrantedInCurrentSession && this.pendingDismissCallback) {
        const dismissCb = this.pendingDismissCallback;
        this.pendingDismissCallback = null;
        dismissCb();
      }

      this.wasRewardGrantedInCurrentSession = false;
      this.pendingRewardedCallback = null;
      this.pendingDismissCallback = null;

      // 다음 사용을 위해 다음 리워드 광고 백그라운드 사전 로드
      this.prepareRewardedAd().catch(() => {});
    });

    AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => {
      console.error('[AdMobService] 리워드 광고 노출 실패:', error);
      this.isRewardedLoaded = false;
      if (this.pendingDismissCallback) {
        const cb = this.pendingDismissCallback;
        this.pendingDismissCallback = null;
        cb();
      }
      this.pendingRewardedCallback = null;
      this.prepareRewardedAd().catch(() => {});
    });
  }

  /**
   * 리워드 광고 사전 캐싱
   */
  public async prepareRewardedAd(): Promise<boolean> {
    if (!this.isNativeAdSupported()) return false;
    try {
      const options: RewardAdOptions = {
        adId: this.config.rewardedAdId,
        isTesting: this.config.isTesting,
      };
      await AdMob.prepareRewardVideoAd(options);
      this.isRewardedLoaded = true;
      return true;
    } catch (err) {
      this.isRewardedLoaded = false;
      console.warn('[AdMobService] 리워드 광고 사전 로드 예외:', err);
      return false;
    }
  }

  /**
   * 리워드 광고 표시
   * @param onRewarded 광고 시청 완료 시 보상 콜백
   * @param onDismissedOrFailed 광고 시청 실패 또는 중도 종료 시 콜백
   */
  public async showRewardedAd(
    onRewarded: () => void,
    onDismissedOrFailed?: () => void
  ): Promise<boolean> {
    if (!this.isNativeAdSupported()) {
      // 웹 환경이거나 플러그인 미지원 시 실패 반환 -> 인게임 시뮬레이션 모달로 자동 폴백
      onDismissedOrFailed?.();
      return false;
    }

    this.pendingRewardedCallback = onRewarded;
    this.pendingDismissCallback = onDismissedOrFailed || null;
    this.wasRewardGrantedInCurrentSession = false;

    try {
      // 아직 로드되지 않은 상태라면 즉시 로드 후 시도
      if (!this.isRewardedLoaded) {
        console.log('[AdMobService] 리워드 광고 사전 로드 안됨 -> 즉시 로드 시도');
        const loaded = await this.prepareRewardedAd();
        if (!loaded) {
          throw new Error('리워드 광고 로드에 실패했습니다.');
        }
      }

      await AdMob.showRewardVideoAd();
      return true;
    } catch (err) {
      console.error('[AdMobService] 리워드 광고 표시 오류:', err);
      this.isRewardedLoaded = false;
      if (this.pendingDismissCallback) {
        const cb = this.pendingDismissCallback;
        this.pendingDismissCallback = null;
        this.pendingRewardedCallback = null;
        cb();
      }
      return false;
    }
  }

  // --- 2. 전면 광고 (Interstitial Ad) ---

  private registerInterstitialListeners(): void {
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
      this.isInterstitialLoaded = true;
      console.log('[AdMobService] 전면 광고 로드 완료');
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (err) => {
      this.isInterstitialLoaded = false;
      console.warn('[AdMobService] 전면 광고 로드 실패:', err);
    });

    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      console.log('[AdMobService] 전면 광고 닫힘');
      this.isInterstitialLoaded = false;
      this.prepareInterstitial().catch(() => {});
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (err) => {
      console.error('[AdMobService] 전면 광고 노출 실패:', err);
      this.isInterstitialLoaded = false;
      this.prepareInterstitial().catch(() => {});
    });
  }

  public async prepareInterstitial(): Promise<boolean> {
    if (!this.isNativeAdSupported()) return false;
    try {
      const options: AdOptions = {
        adId: this.config.interstitialAdId,
        isTesting: this.config.isTesting,
      };
      await AdMob.prepareInterstitial(options);
      this.isInterstitialLoaded = true;
      return true;
    } catch (err) {
      this.isInterstitialLoaded = false;
      console.warn('[AdMobService] 전면 광고 사전 로드 예외:', err);
      return false;
    }
  }

  public async showInterstitial(): Promise<boolean> {
    if (!this.isNativeAdSupported()) return false;
    try {
      if (!this.isInterstitialLoaded) {
        const loaded = await this.prepareInterstitial();
        if (!loaded) return false;
      }
      await AdMob.showInterstitial();
      return true;
    } catch (err) {
      console.error('[AdMobService] 전면 광고 표시 실패:', err);
      return false;
    }
  }

  // --- 3. 배너 광고 (Banner Ad) ---

  private registerBannerListeners(): void {
    AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      this.isBannerShowing = true;
      console.log('[AdMobService] 배너 광고 로드 완료');
    });

    AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (err) => {
      this.isBannerShowing = false;
      console.warn('[AdMobService] 배너 광고 로드 실패:', err);
    });
  }

  public async showBanner(position = BannerAdPosition.BOTTOM_CENTER): Promise<void> {
    if (!this.isNativeAdSupported()) return;
    try {
      const options: BannerAdOptions = {
        adId: this.config.bannerAdId,
        adSize: BannerAdSize.BANNER,
        position,
        isTesting: this.config.isTesting,
        margin: 0,
      };
      await AdMob.showBanner(options);
      this.isBannerShowing = true;
    } catch (err) {
      console.warn('[AdMobService] 배너 표시 실패:', err);
    }
  }

  public async hideBanner(): Promise<void> {
    if (!this.isNativeAdSupported() || !this.isBannerShowing) return;
    try {
      await AdMob.hideBanner();
      this.isBannerShowing = false;
    } catch (err) {
      console.warn('[AdMobService] 배너 숨기기 실패:', err);
    }
  }

  public async resumeBanner(): Promise<void> {
    if (!this.isNativeAdSupported()) return;
    try {
      await AdMob.resumeBanner();
      this.isBannerShowing = true;
    } catch (err) {
      console.warn('[AdMobService] 배너 재개 실패:', err);
    }
  }

  public async removeBanner(): Promise<void> {
    if (!this.isNativeAdSupported()) return;
    try {
      await AdMob.removeBanner();
      this.isBannerShowing = false;
    } catch (err) {
      console.warn('[AdMobService] 배너 제거 실패:', err);
    }
  }
}
