import { Injectable } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';

/**
 * Centralized, privacy-conscious product analytics.
 * Never send resume text, names, email addresses, job descriptions, or other
 * user-entered content to Analytics.
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private analytics: Analytics) {}

  track(
    eventName: string,
    parameters: Record<string, string | number | boolean> = {}
  ): void {
    try {
      logEvent(this.analytics, eventName, parameters);
    } catch (error) {
      // Analytics must never interrupt a user workflow.
      console.warn('Analytics event could not be recorded:', eventName, error);
    }
  }
}
