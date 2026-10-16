import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

export type UserPlan = 'free' | 'pro' | 'pro_plus';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  userPlan: UserPlan = 'free';

  private readonly userPlanSubject =
    new BehaviorSubject<UserPlan>('free');

  readonly userPlan$ =
    this.userPlanSubject.asObservable();

  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshInProgress = false;

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {
    // A sleeping tab can miss the exact expiry moment. Recheck whenever
    // the user returns to the tab, and when the tab becomes visible again.
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.handleWindowFocus);
    }

    if (typeof document !== 'undefined') {
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange
      );
    }
  }

  private readonly handleWindowFocus = (): void => {
    void this.loadUserPlan();
  };

  private readonly handleVisibilityChange = (): void => {
    if (typeof document !== 'undefined' && !document.hidden) {
      void this.loadUserPlan();
    }
  };

  private setUserPlan(plan: UserPlan): void {
    this.userPlan = plan;

    if (this.userPlanSubject.value !== plan) {
      this.userPlanSubject.next(plan);
    }
  }

  private parseExpiryDate(value: unknown): Date | null {
    let parsed: Date;

    if (
      value &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof (value as { toDate?: unknown }).toDate === 'function'
    ) {
      parsed = (value as { toDate: () => Date }).toDate();
    } else if (value instanceof Date) {
      parsed = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      parsed = new Date(value);
    } else {
      return null;
    }

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private clearExpiryTimer(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  private scheduleExpiryCheck(expiryDate: Date): void {
    this.clearExpiryTimer();

    // setTimeout has a finite maximum delay; schedule in chunks if needed.
    const maxDelay = 2_147_000_000;
    const delay = Math.max(0, expiryDate.getTime() - Date.now() + 25);

    this.expiryTimer = setTimeout(() => {
      if (Date.now() < expiryDate.getTime()) {
        this.scheduleExpiryCheck(expiryDate);
        return;
      }

      void this.loadUserPlan();
    }, Math.min(delay, maxDelay));
  }

  /**
   * Re-read the plan from Firestore. This runs on login/reload and when the
   * browser tab regains focus. An expiry timer handles users who stay signed in.
   */
  async loadUserPlan(): Promise<void> {
    if (this.refreshInProgress) {
      return;
    }

    this.refreshInProgress = true;
    this.clearExpiryTimer();
    this.setUserPlan('free');

    try {
      const user = this.auth.currentUser;

      if (!user) {
        return;
      }

      const userRef = doc(this.firestore, `users/${user.uid}`);
      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        return;
      }

      const data = snapshot.data() as Record<string, unknown>;
      const plan = data['userPlan'];
      const isPremiumPlan = plan === 'pro' || plan === 'pro_plus';
      const isActive = data['paymentStatus'] === 'active';

      if (!isPremiumPlan || !isActive) {
        return;
      }

      const expiryDate = this.parseExpiryDate(data['planExpiryDate']);
      const isExpired = !expiryDate || expiryDate.getTime() <= Date.now();

      if (isExpired) {
        // Preserve payment/order identifiers and history; only deactivate access.
        await setDoc(
          userRef,
          {
            userPlan: 'free',
            paymentStatus: 'inactive',
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );

        this.setUserPlan('free');
        return;
      }

      this.setUserPlan(plan as UserPlan);
      this.scheduleExpiryCheck(expiryDate);
    } catch (error) {
      // Fail closed: premium access must not remain enabled if refresh fails.
      console.error('Failed to refresh subscription status:', error);
      this.setUserPlan('free');
    } finally {
      this.refreshInProgress = false;
    }
  }

  isPremiumUser(): boolean {
    return this.userPlan === 'pro' || this.userPlan === 'pro_plus';
  }
}
