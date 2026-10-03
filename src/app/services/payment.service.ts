// src/app/services/payment.service.ts

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

import { PdfService } from './pdf.service';
import { AnalyticsService } from './analytics.service';

import {
  Auth
} from '@angular/fire/auth';

declare var Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(
    private pdfService: PdfService,
    private auth: Auth,
    private snackBar: MatSnackBar,
    private analyticsService: AnalyticsService
  ) { }

  /* =====================================
     START PAYMENT FLOW
  ===================================== */

  startPremiumUpgrade(
    planType: 'pro' | 'pro_plus',
    source = 'unknown'
  ): void {

    this.analyticsService
      .trackUpgradeClicked(
        planType,
        source
      );

    this.analyticsService
      .trackPaymentOrderCreateStarted(
        planType,
        source
      );

    const payload = {
      planType
    };

    const user = this.auth.currentUser;

    if (!user) {
      this.analyticsService.trackPaymentFailed(
        'create_order',
        planType,
        'No authenticated user'
      );
      this.snackBar.open('Please sign in before upgrading.', 'Close', { duration: 5000 });
      return;
    }

    user.getIdToken()
      .then(token => fetch(
          `${environment.apiBaseUrl}/create-order`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          }
        )
      )
      .then(response => response.json())

      .then(data => {

        if (data.success) {
          this.analyticsService
            .trackPaymentOrderCreateSuccess(
              planType,
              data.order?.id,
              data.order?.amount
            );

          this.openRazorpayPopup(
            data.order,
            planType
          );

          return;
        }

        this.analyticsService
          .trackPaymentFailed(
            'create_order',
            planType,
            data.message || 'Order creation was not successful'
          );

      })

      .catch(error => {
        this.analyticsService
          .trackPaymentFailed(
            'create_order',
            planType,
            error?.message || 'Create order request failed'
          );

        console.error(
          'Create order failed',
          error
        );

      });

  }

  /* =====================================
     OPEN RAZORPAY
  ===================================== */

  private openRazorpayPopup(
    order: any,
    planType: 'pro' | 'pro_plus'
  ): void {

    const options = {

      key:
        environment.razorpayKey,

      amount:
        order.amount,

      currency:
        order.currency,

      name:
        'ResumePilot AI',

      description:
        planType === 'pro'
          ? 'Pro Plan Upgrade'
          : 'Pro Plus Upgrade',

      order_id:
        order.id,

      prefill: {
        name: '',
        email: '',
        contact: ''
      },

      handler:
        (response: any) => {

          console.log(
            'Payment Success:',
            response
          );

          void this.verifyPaymentAndActivatePlan(
            response,
            planType
          );

        },

      modal: {
        ondismiss: () => {
          this.analyticsService
            .trackPaymentFailed(
              'dismissed',
              planType,
              'Razorpay checkout dismissed',
              order.id
            );
        }
      },

      theme: {
        color: '#4f46e5'
      }

    };

    const razorpay =
      new Razorpay(options);

    razorpay.on(
      'payment.failed',
      (response: any) => {
        this.analyticsService
          .trackPaymentFailed(
            'razorpay',
            planType,
            response.error?.description || response.error?.reason,
            order.id
          );

        console.error(
          'Payment Failed',
          response.error
        );

        this.snackBar.open(
          'Payment failed. Please try again.',
          'Close',
          {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          }
        );
      }
    );

    razorpay.open();

    this.analyticsService
      .trackPaymentPopupOpened(
        planType,
        order.id,
        order.amount
      );

  }

  /* =====================================
     VERIFY PAYMENT
  ===================================== */

  private async verifyPaymentAndActivatePlan(
    paymentResponse: any,
    planType: 'pro' | 'pro_plus'
  ): Promise<void> {
    this.analyticsService
      .trackPaymentVerificationStarted(
        planType,
        paymentResponse?.razorpay_payment_id,
        paymentResponse?.razorpay_order_id
      );

    const user =
      this.auth.currentUser;

    if (!user) {
      this.analyticsService
        .trackPaymentFailed(
          'verification',
          planType,
          'No authenticated user',
          paymentResponse?.razorpay_order_id
        );

      this.snackBar.open(
        'Please sign in again before completing payment verification.',
        'Close',
        {
          duration: 5000
        }
      );

      return;
    }

    this.pdfService.verifyPayment(paymentResponse)
      .subscribe({

        next:
          async (verification: any) => {

            if (!verification.success) {
              this.analyticsService
                .trackPaymentFailed(
                  'verification',
                  planType,
                  verification.message || 'Payment verification was not successful',
                  paymentResponse?.razorpay_order_id
                );

              return;
            }

            this.analyticsService
              .trackPaymentSuccess(
                verification.planType,
                verification.paymentId,
                verification.orderId
              );

            this.snackBar.open(
              'Payment successful! Premium templates unlocked.',
              'Close',
              {
                duration: 4000,
                horizontalPosition: 'right',
                verticalPosition: 'top'
              }
            );

            window.location.reload();

          },

        error:
          (error) => {
            this.analyticsService
              .trackPaymentFailed(
                'verification',
                planType,
                error?.error?.message || error?.message || 'Payment verification failed',
                paymentResponse?.razorpay_order_id
              );

            this.snackBar.open(
              'Payment verification failed. Please contact support.',
              'Close',
              {
                duration: 5000
              }
            );

          }

      });

  }

}
