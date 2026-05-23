import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  authState
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private auth: Auth
  ) { }

  /*
   SIGNUP
  */
  signup(email: string, password: string) {
    return createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
  }

  /*
   LOGIN
  */
  login(email: string, password: string) {
    return signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
  }

  /*
   GOOGLE LOGIN
  */
  googleLogin() {
    const provider = new GoogleAuthProvider();

    return signInWithPopup(
      this.auth,
      provider
    );
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
}