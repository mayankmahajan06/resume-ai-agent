import { Component } from '@angular/core';

import { Router } from '@angular/router';

import { AuthService } from '../../../services/auth.service';

import { UserService } from '../../../services/user.service';

import { PaymentService } from '../../../services/payment.service';
import { AnalyticsService } from '../../../services/analytics.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss'
})
export class PricingComponent {

  isLoggedIn = false;

  userPlan:
    'free' |
    'pro' |
    'pro_plus' = 'free';

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private paymentService: PaymentService,
    private analyticsService: AnalyticsService
  ) {

    this.authService
      .getCurrentUser()
      .subscribe(async (user) => {

        this.isLoggedIn = !!user;

        if (user) {

          await this.userService
            .loadUserPlan();

          this.userPlan =
            this.userService.userPlan;

        }

        this.analyticsService
          .trackPricingViewed(
            this.userPlan,
            this.isLoggedIn
          );

      });

  }

  /* =====================================
     FREE PLAN
  ===================================== */

  handleFreePlan(): void {
    this.analyticsService
      .trackPricingPlanSelected(
        'free',
        'landing_pricing',
        this.isLoggedIn,
        this.userPlan
      );

    if (this.isLoggedIn) {

      this.router.navigate([
        '/my-resumes'
      ]);

      return;

    }

    this.router.navigate([
      '/signup'
    ]);

  }

  /* =====================================
     PRO PLAN
  ===================================== */

  handleProPlan(): void {
    this.analyticsService
      .trackPricingPlanSelected(
        'pro',
        'landing_pricing',
        this.isLoggedIn,
        this.userPlan
      );

    if (!this.isLoggedIn) {

      this.router.navigate([
        '/signup'
      ]);

      return;

    }

    if (
      this.userPlan === 'pro' ||
      this.userPlan === 'pro_plus'
    ) {
      return;
    }

    /*
    =====================================
    OPEN PRO PAYMENT FLOW
    =====================================
    */

    this.paymentService
      .startPremiumUpgrade(
        'pro',
        'landing_pricing'
      );

  }

  /* =====================================
     PRO PLUS
  ===================================== */

  handleProPlusPlan(): void {
    this.analyticsService
      .trackPricingPlanSelected(
        'pro_plus',
        'landing_pricing',
        this.isLoggedIn,
        this.userPlan
      );

    if (!this.isLoggedIn) {

      this.router.navigate([
        '/signup'
      ]);

      return;

    }

    if (
      this.userPlan === 'pro_plus'
    ) {
      return;
    }

    /*
    =====================================
    OPEN PRO PLUS PAYMENT FLOW
    =====================================
    */

    this.paymentService
      .startPremiumUpgrade(
        'pro_plus',
        'landing_pricing'
      );

  }

}
