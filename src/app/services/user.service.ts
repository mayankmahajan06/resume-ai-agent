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

    const user =
      this.auth.currentUser;

    if (!user) return;

    const userRef = doc(
      this.firestore,
      `users/${user.uid}`
    );

    const snapshot =
      await getDoc(userRef);

    if (snapshot.exists()) {

      const data: any =
        snapshot.data();

      if (
        data.paymentStatus === 'active' &&
        data.userPlan
      ) {

        const expiryDate =
          new Date(data.planExpiryDate);

        const today =
          new Date();

        if (expiryDate > today) {

          this.userPlan =
            data.userPlan;

        } else {

          this.userPlan =
            'free';

        }

      }

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