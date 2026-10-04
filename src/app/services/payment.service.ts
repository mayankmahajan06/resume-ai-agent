// src/app/services/payment.service.ts

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

import { PdfService } from './pdf.service';
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
    private snackBar: MatSnackBar
  ) { }

  /* =====================================
     START PAYMENT FLOW
  ===================================== */

  startPremiumUpgrade(
    planType: 'pro' | 'pro_plus',
    source = 'unknown'
  ): void {

    

    

    const payload = {
      planType
    };

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
        )
      )
      .then(response => response.json())

      .then(data => {

        if (data.success) {
          

          this.openRazorpayPopup(
            data.order,
            planType
          );

          return;
        }

        

      })

      .catch(error => {
        

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

    

  }

  /* =====================================
     VERIFY PAYMENT
  ===================================== */

  private async verifyPaymentAndActivatePlan(
    paymentResponse: any,
    planType: 'pro' | 'pro_plus'
  ): Promise<void> {
    

    const user =
      this.auth.currentUser;

    if (!user) {
      

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
              

              return;
            }

            

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
