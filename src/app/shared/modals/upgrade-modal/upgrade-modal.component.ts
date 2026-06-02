import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';

import { PaymentService } from '../../../services/payment.service';
import {
  Firestore,
  doc,
  getDoc
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-upgrade-modal',
  standalone: true,

  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],

  templateUrl: './upgrade-modal.component.html',

  styleUrls: [
    './upgrade-modal.component.scss'
  ]
})

export class UpgradeModalComponent {

  showUpgradeModal = false;
  userPlan: 'free' | 'pro' | 'pro_plus' = 'free';

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private dialogRef:
      MatDialogRef<UpgradeModalComponent>,
    private paymentService:
      PaymentService

  ) { }

  /*
  ========================================
  CLOSE MODAL
  ========================================
  */

  close(): void {

    this.dialogRef.close();

  }

  /*
  ========================================
  START PAYMENT
  ========================================
  */

  startPremiumUpgrade(
    planType: 'pro' | 'pro_plus'
  ): void {

    this.paymentService
      .startPremiumUpgrade(
        planType,
        'upgrade_modal'
      );

  }

  async loadUserPlanFromFirebase(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const data: any = snapshot.data();

      if (data.paymentStatus === 'active' && data.userPlan) {
        const expiryDate = new Date(data.planExpiryDate);
        const today = new Date();

        if (expiryDate > today) {
          this.userPlan = data.userPlan;
        } else {
          this.userPlan = 'free';
        }
      }
    }
  }

}
