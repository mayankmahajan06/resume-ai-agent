import { Injectable } from '@angular/core';

import {
  Analytics,
  logEvent
} from '@angular/fire/analytics';

export type AnalyticsPlanType = 'free' | 'pro' | 'pro_plus';
export type AnalyticsAuthMethod = 'email' | 'google';
export type AnalyticsPaymentFailureStage =
  'create_order' |
  'razorpay' |
  'dismissed' |
  'auth_token' |
  'verification' |
  'activation';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(
    private analytics: Analytics
  ) {}

  track(
    eventName: string,
    params?: any
  ): void {
    try {
      logEvent(
        this.analytics,
        eventName,
        this.cleanParams(params)
      );
    } catch (error) {
      console.warn(
        'Analytics event failed',
        eventName,
        error
      );
    }

  }

  trackPageViewed(
    path: string,
    title?: string
  ): void {
    this.track(
      'page_view',
      {
        page_path: path,
        page_title: title || document.title
      }
    );
  }

  trackLandingPageViewed(): void {
    this.trackFunnelEvent(
      'landing_page_viewed',
      'Landing Page Viewed',
      1
    );
  }

  trackSignupStarted(method: 'email' | 'google'): void {
    this.trackFunnelEvent(
      'signup_started',
      'Signup Started',
      2,
      { method }
    );
  }

  trackSignupFailed(
    method: AnalyticsAuthMethod,
    reason?: string
  ): void {
    this.trackFunnelEvent(
      'signup_failed',
      'Signup Failed',
      2,
      {
        method,
        reason
      }
    );
  }

  trackLoginStarted(method: AnalyticsAuthMethod): void {
    this.track(
      'login_started',
      {
        method
      }
    );
  }

  trackLoginCompleted(method: AnalyticsAuthMethod): void {
    this.track(
      'login_completed',
      {
        method
      }
    );

    this.track(
      'login',
      {
        method
      }
    );
  }

  trackLoginFailed(
    method: AnalyticsAuthMethod,
    reason?: string
  ): void {
    this.track(
      'login_failed',
      {
        method,
        reason
      }
    );
  }

  trackSignupCompleted(method: 'email' | 'google'): void {
    this.trackFunnelEvent(
      'signup_completed',
      'Signup Completed',
      3,
      { method }
    );

    this.track(
      'sign_up',
      { method }
    );
  }

  trackResumeBuilderOpened(): void {
    this.trackFunnelEvent(
      'resume_builder_opened',
      'Resume Builder Opened',
      4
    );
  }

  trackResumeStepViewed(
    step: number,
    completion: number
  ): void {
    this.track(
      'resume_step_viewed',
      {
        step,
        profile_completion: completion
      }
    );
  }

  trackResumeSaved(params?: any): void {
    this.trackFunnelEvent(
      'resume_saved',
      'Resume Saved',
      5,
      params
    );
  }

  trackPdfDownloaded(
    type: 'free' | 'premium',
    template: string
  ): void {
    this.trackFunnelEvent(
      'pdf_downloaded',
      'PDF Downloaded',
      6,
      {
        type,
        template
      }
    );
  }

  trackPdfDownloadStarted(
    type: 'free' | 'premium',
    template: string
  ): void {
    this.track(
      'pdf_download_started',
      {
        type,
        template
      }
    );
  }

  trackPdfDownloadFailed(
    type: 'free' | 'premium',
    template: string,
    reason?: string
  ): void {
    this.track(
      'pdf_download_failed',
      {
        type,
        template,
        reason
      }
    );
  }

  trackPricingViewed(
    userPlan: AnalyticsPlanType,
    isLoggedIn: boolean
  ): void {
    this.track(
      'pricing_viewed',
      {
        user_plan: userPlan,
        is_logged_in: isLoggedIn
      }
    );
  }

  trackPricingPlanSelected(
    planType: AnalyticsPlanType,
    source: string,
    isLoggedIn: boolean,
    currentPlan: AnalyticsPlanType
  ): void {
    this.track(
      'pricing_plan_selected',
      {
        plan_type: planType,
        source,
        is_logged_in: isLoggedIn,
        current_plan: currentPlan
      }
    );
  }

  trackUpgradeClicked(
    planType: 'pro' | 'pro_plus',
    source = 'unknown'
  ): void {
    this.trackFunnelEvent(
      'upgrade_clicked',
      'Upgrade Clicked',
      7,
      {
        plan_type: planType,
        source
      }
    );
  }

  trackUpgradeModalOpened(
    feature: string,
    source = 'unknown'
  ): void {
    this.track(
      'upgrade_modal_opened',
      {
        feature,
        source
      }
    );
  }

  trackPremiumFeatureAttempted(
    feature: string,
    source = 'unknown',
    currentPlan: AnalyticsPlanType = 'free'
  ): void {
    this.track(
      'premium_feature_attempted',
      {
        feature,
        source,
        current_plan: currentPlan
      }
    );
  }

  trackPaymentOrderCreateStarted(
    planType: 'pro' | 'pro_plus',
    source = 'unknown'
  ): void {
    this.track(
      'payment_order_create_started',
      {
        plan_type: planType,
        source
      }
    );
  }

  trackPaymentOrderCreateSuccess(
    planType: 'pro' | 'pro_plus',
    orderId?: string,
    amount?: number
  ): void {
    this.track(
      'payment_order_create_success',
      {
        plan_type: planType,
        order_id: orderId,
        value: amount,
        currency: 'INR'
      }
    );
  }

  trackPaymentPopupOpened(
    planType: 'pro' | 'pro_plus',
    orderId?: string,
    amount?: number
  ): void {
    this.trackFunnelEvent(
      'payment_popup_opened',
      'Payment Popup Opened',
      8,
      {
        plan_type: planType,
        order_id: orderId,
        value: amount,
        currency: 'INR'
      }
    );
  }

  trackPaymentVerificationStarted(
    planType: 'pro' | 'pro_plus',
    paymentId?: string,
    orderId?: string
  ): void {
    this.trackFunnelEvent(
      'payment_verification_started',
      'Payment Verification Started',
      9,
      {
        plan_type: planType,
        payment_id: paymentId,
        order_id: orderId
      }
    );
  }

  trackPaymentFailed(
    stage: AnalyticsPaymentFailureStage,
    planType?: 'pro' | 'pro_plus',
    reason?: string,
    orderId?: string
  ): void {
    this.trackFunnelEvent(
      'payment_failed',
      'Payment Failed',
      8,
      {
        stage,
        plan_type: planType,
        reason,
        order_id: orderId
      }
    );
  }

  trackPaymentSuccess(
    planType: 'pro' | 'pro_plus',
    paymentId?: string,
    orderId?: string
  ): void {
    this.trackFunnelEvent(
      'payment_success',
      'Payment Success',
      10,
      {
        plan_type: planType,
        payment_id: paymentId,
        order_id: orderId
      }
    );

    this.track(
      'purchase',
      {
        transaction_id: paymentId,
        affiliation: 'Razorpay',
        currency: 'INR',
        items: [
          {
            item_id: planType,
            item_name: planType === 'pro' ? 'Pro Plan' : 'Pro Plus Plan'
          }
        ],
        order_id: orderId
      }
    );
  }

  trackResumeImportStarted(): void {
    this.track(
      'resume_import_started',
      {
        import_type: 'pdf'
      }
    );
  }

  trackResumeImportSuccess(
    pages?: number,
    textLength?: number
  ): void {
    this.track(
      'resume_import_success',
      {
        import_type: 'pdf',
        pages,
        text_length: textLength
      }
    );
  }

  trackResumeImportFailed(
    reason?: string
  ): void {
    this.track(
      'resume_import_failed',
      {
        import_type: 'pdf',
        reason
      }
    );
  }

  private trackFunnelEvent(
    eventName: string,
    eventLabel: string,
    funnelStep: number,
    params?: any
  ): void {
    this.track(
      eventName,
      {
        funnel_name: 'signup_to_payment',
        funnel_step: funnelStep,
        funnel_event: eventLabel,
        ...params
      }
    );
  }

  private cleanParams(params?: any): any {
    if (!params) {
      return undefined;
    }

    return Object
      .entries(params)
      .reduce((cleaned: any, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleaned[key] = value;
        }

        return cleaned;
      }, {});
  }

}
