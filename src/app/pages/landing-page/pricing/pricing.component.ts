import { Component } from '@angular/core';

import { Router } from '@angular/router';

import { AuthService } from '../../../services/auth.service';

import { UserService } from '../../../services/user.service';

import { PaymentService } from '../../../services/payment.service';

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
    private paymentService: PaymentService
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

      });

  }

  /* =====================================
     FREE PLAN
  ===================================== */

  handleFreePlan(): void {

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
        'pro'
      );

  }

  /* =====================================
     PRO PLUS
  ===================================== */

  handleProPlusPlan(): void {

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
        'pro_plus'
      );

  }

}