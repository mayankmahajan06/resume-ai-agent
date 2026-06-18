// src/app/services/payment.service.ts

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

import { PdfService } from './pdf.service';
import { AnalyticsService } from './analytics.service';

import {
  Firestore,
  doc,
  setDoc
} from '@angular/fire/firestore';

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
    private firestore: Firestore,
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

    fetch(
      `${environment.apiBaseUrl}/create-order`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(payload)
      }
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

    let firebaseIdToken: string;

    try {
      firebaseIdToken =
        await user.getIdToken();
    } catch (error) {
      this.analyticsService
        .trackPaymentFailed(
          'auth_token',
          planType,
          error instanceof Error ? error.message : 'Failed to get Firebase ID token',
          paymentResponse?.razorpay_order_id
        );

      console.error(
        'Failed to get Firebase ID token',
        error
      );

      this.snackBar.open(
        'Payment verification failed. Please sign in again.',
        'Close',
        {
          duration: 5000
        }
      );

      return;
    }

    this.pdfService
      .verifyPayment({
        ...paymentResponse,
        userId:
          user.uid,
        firebaseIdToken
      })
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

            try {
              await this.saveVerifiedPremiumPlanToFirebase(
                verification
              );
            } catch (error) {
              this.analyticsService
                .trackPaymentFailed(
                  'activation',
                  planType,
                  error instanceof Error ? error.message : 'Failed to save premium plan',
                  verification.orderId || paymentResponse?.razorpay_order_id
                );

              this.snackBar.open(
                'Payment verified, but plan activation failed. Please contact support.',
                'Close',
                {
                  duration: 5000
                }
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

  /* =====================================
     SAVE PLAN TO FIREBASE
  ===================================== */

  private async saveVerifiedPremiumPlanToFirebase(
    verifiedPayment: any
  ): Promise<void> {

    const user =
      this.auth.currentUser;

    if (!user) {
      return;
    }

    const userRef =
      doc(
        this.firestore,
        `users/${user.uid}`
      );

    await setDoc(
      userRef,
      {

        userPlan:
          verifiedPayment.planType,

        paymentStatus:
          verifiedPayment.paymentStatus,

        planStartDate:
          verifiedPayment.planStartDate,

        planExpiryDate:
          verifiedPayment.planExpiryDate,

        paymentId:
          verifiedPayment.paymentId,

        orderId: verifiedPayment.orderId,

        updatedAt:
          new Date().toISOString()

      },
      {
        merge: true
      }
    );

  }

}
