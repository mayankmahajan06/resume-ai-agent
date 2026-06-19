import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  authState,
  User,
  UserCredential
} from '@angular/fire/auth';

import {
  Firestore,
  doc,
  getDoc,
  setDoc
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) { }

  /*
   SIGNUP
  */
  signup(
    email: string,
    password: string,
    fullName?: string
  ): Promise<UserCredential> {
    return createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    )
      .then(async (credential) => {
        await this.ensureUserDocument(
          credential.user,
          'password',
          fullName
        );

        return credential;
      });
  }

  /*
   LOGIN
  */
  login(
    email: string,
    password: string
  ): Promise<UserCredential> {
    return signInWithEmailAndPassword(
      this.auth,
      email,
      password
    )
      .then(async (credential) => {
        await this.ensureUserDocument(
          credential.user,
          'password'
        );

        return credential;
      });
  }

  /*
   GOOGLE LOGIN
  */
  googleLogin(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();

    return signInWithPopup(
      this.auth,
      provider
    )
      .then(async (credential) => {
        await this.ensureUserDocument(
          credential.user,
          'google.com'
        );

        return credential;
      });
  }

  isNewAuthUser(
    credential: UserCredential
  ): boolean {
    return getAdditionalUserInfo(credential)?.isNewUser ?? false;
  }

  /*
   FORGOT PASSWORD
  */
  forgotPassword(email: string) {
    return sendPasswordResetEmail(
      this.auth,
      email
    );
  }

  getCurrentUser() {
    return authState(this.auth);
  }

  /*
   LOGOUT
  */
  logout() {
    return signOut(this.auth);
  }

  private async ensureUserDocument(
    user: User,
    provider: 'password' | 'google.com',
    fullName?: string
  ): Promise<void> {
    const userRef =
      doc(
        this.firestore,
        `users/${user.uid}`
      );

    const snapshot =
      await getDoc(userRef);

    const now =
      new Date().toISOString();

    const profileData = {
      uid:
        user.uid,

      email:
        user.email || '',

      fullName:
        fullName || user.displayName || '',

      photoURL:
        user.photoURL || '',

      authProvider:
        provider,

      lastLoginAt:
        now,

      updatedAt:
        now
    };

    if (snapshot.exists()) {
      await setDoc(
        userRef,
        profileData,
        {
          merge: true
        }
      );

      return;
    }

    await setDoc(
      userRef,
      {
        ...profileData,

        userPlan:
          'free',

        paymentStatus:
          'inactive',

        createdAt:
          now
      },
      {
        merge: true
      }
    );
  }
}
