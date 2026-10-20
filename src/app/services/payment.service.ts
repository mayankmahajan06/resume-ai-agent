import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

import { PdfService } from './pdf.service';
import { AnalyticsService } from './analytics.service';
import { Auth } from '@angular/fire/auth';

declare var Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(
    private pdfService: PdfService,
    private auth: Auth,
    private snackBar: MatSnackBar,
    private analytics: AnalyticsService
  ) {}

  startPremiumUpgrade(
    planType: 'pro' | 'pro_plus',
    source = 'unknown'
  ): void {
    const payload = { planType };
    const user = this.auth.currentUser;

    if (!user) {
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
      ))
      .then(response => {
        if (!response.ok) {
          throw new Error('Unable to create payment order');
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          this.analytics.track('begin_checkout', {
            item_id: planType,
            checkout_source: source
          });

          this.openRazorpayPopup(data.order, planType, source);
          return;
        }

        this.analytics.track('checkout_start_failed', {
          item_id: planType,
          checkout_source: source
        });
        this.snackBar.open(
          data.message || 'Unable to start checkout. Please try again.',
          'Close',
          { duration: 5000 }
        );
      })
      .catch(error => {
        this.analytics.track('checkout_start_failed', {
          item_id: planType,
          checkout_source: source
        });
        console.error('Create order failed', error);
        this.snackBar.open('Unable to start checkout. Please try again.', 'Close', { duration: 5000 });
      });
  }

  private openRazorpayPopup(
    order: any,
    planType: 'pro' | 'pro_plus',
    source: string
  ): void {
    const options = {
      key: environment.razorpayKey,
      amount: order.amount,
      currency: order.currency,
      name: 'ResumePilot AI',
      description: planType === 'pro' ? 'Pro Plan Upgrade' : 'Pro Plus Upgrade',
      order_id: order.id,
      prefill: {
        name: '',
        email: '',
        contact: ''
      },
      handler: (response: any) => {
        void this.verifyPaymentAndActivatePlan(response, planType, source);
      },
      modal: {
        ondismiss: () => {
          this.analytics.track('checkout_dismissed', {
            item_id: planType,
            checkout_source: source
          });
        }
      },
      theme: {
        color: '#4f46e5'
      }
    };

    const razorpay = new Razorpay(options);

    razorpay.on('payment.failed', (response: any) => {
      this.analytics.track('payment_failed', {
        item_id: planType,
        checkout_source: source
      });

      console.error('Payment Failed', response.error);
      this.snackBar.open(
        'Payment failed. Please try again.',
        'Close',
        {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        }
      );
    });

    razorpay.open();
  }

  private async verifyPaymentAndActivatePlan(
    paymentResponse: any,
    planType: 'pro' | 'pro_plus',
    source: string
  ): Promise<void> {
    const user = this.auth.currentUser;

    if (!user) {
      this.snackBar.open(
        'Please sign in again before completing payment verification.',
        'Close',
        { duration: 5000 }
      );
      return;
    }

    this.pdfService.verifyPayment(paymentResponse)
      .subscribe({
        next: async (verification: any) => {
          if (!verification.success) {
            this.analytics.track('payment_verification_failed', {
              item_id: planType,
              checkout_source: source
            });
            return;
          }

          // Only count a purchase after the backend confirms payment.
          this.analytics.track('purchase', {
            item_id: planType,
            checkout_source: source,
            currency: 'INR'
          });

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
        error: (error) => {
          this.analytics.track('payment_verification_failed', {
            item_id: planType,
            checkout_source: source
          });

          this.snackBar.open(
            'Payment verification failed. Please contact support.',
            'Close',
            { duration: 5000 }
          );
        }
      });
  }
}
