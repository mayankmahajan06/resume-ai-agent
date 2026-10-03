import { Injectable } from '@angular/core';

import {
  Firestore,
  doc,
  getDoc
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

    // Always start from the safest state. This prevents a stale premium
    // value from remaining in memory when the user has no active plan.
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

    if (
      data.paymentStatus !== 'active' ||
      !['pro', 'pro_plus'].includes(data.userPlan)
    ) {
      return;
    }

    const expiryDate =
      new Date(data.planExpiryDate);

    const today =
      new Date();

    if (
      !Number.isNaN(expiryDate.getTime()) &&
      expiryDate > today
    ) {
      this.userPlan =
        data.userPlan;
    }

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