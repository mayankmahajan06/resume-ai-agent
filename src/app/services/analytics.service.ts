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

}