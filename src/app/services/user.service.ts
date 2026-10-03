import { Injectable } from '@angular/core';

import {
  Firestore,
  doc,
  getDoc,
  setDoc
} from '@angular/fire/firestore';

import {
  Auth
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  userPlan:
    'free' | 'pro' | 'pro_plus' = 'free';

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) { }

  /*
  ========================================
  LOAD USER PLAN
  ========================================
  */

  async loadUserPlan(): Promise<void> {

    // Always start from the safest state.
    this.userPlan = 'free';

    const user =
      this.auth.currentUser;

    if (!user) return;

    const userRef = doc(
      this.firestore,
      `users/${user.uid}`
    );

    const snapshot =
      await getDoc(userRef);

    if (!snapshot.exists()) {
      return;
    }

    const data: any =
      snapshot.data();

    const isPremiumPlan =
      data.userPlan === 'pro' ||
      data.userPlan === 'pro_plus';

    const isActive =
      data.paymentStatus === 'active';

    if (!isPremiumPlan || !isActive) {
      return;
    }

    const expiryDate =
      new Date(data.planExpiryDate);

    const today =
      new Date();

    // Invalid or expired subscription
    if (
      Number.isNaN(expiryDate.getTime()) ||
      expiryDate <= today
    ) {

      // Keep payment history, but mark the subscription inactive.
      await setDoc(
        userRef,
        {
          userPlan: 'free',
          paymentStatus: 'inactive',
          updatedAt: new Date().toISOString()
        },
        {
          merge: true
        }
      );

      this.userPlan = 'free';

      return;
    }

    // Subscription is still active.
    this.userPlan =
      data.userPlan;
  }

  /*
  ========================================
  IS PREMIUM
  ========================================
  */

  isPremiumUser(): boolean {

    return (
      this.userPlan === 'pro' ||
      this.userPlan === 'pro_plus'
    );

  }

}