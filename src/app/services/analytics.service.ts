import { Injectable } from '@angular/core';

import {
  Analytics,
  logEvent
} from '@angular/fire/analytics';

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
    logEvent(
      this.analytics,
      eventName,
      params
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

  trackPaymentSuccess(
    planType: 'pro' | 'pro_plus',
    paymentId?: string,
    orderId?: string
  ): void {
    this.trackFunnelEvent(
      'payment_success',
      'Payment Success',
      8,
      {
        plan_type: planType,
        payment_id: paymentId,
        order_id: orderId
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

}
