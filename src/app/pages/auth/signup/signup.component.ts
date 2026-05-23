import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {

  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';

  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  signup(): void {
    this.errorMessage = '';

    if (
      !this.fullName ||
      !this.email ||
      !this.password ||
      !this.confirmPassword
    ) {
      this.errorMessage = 'Please fill all fields';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.isLoading = true;

    this.authService
      .signup(this.email, this.password)
      .then(() => {
        this.router.navigate(['/resume-builder']);
      })
      .catch((error) => {
        this.errorMessage = this.getFirebaseErrorMessage(error.code);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  googleSignup(): void {
    this.authService
      .googleLogin()
      .then(() => {
        this.router.navigate(['/resume-builder']);
      })
      .catch((error) => {
        this.errorMessage = this.getFirebaseErrorMessage(error.code);
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  getFirebaseErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered.';

      case 'auth/invalid-email':
        return 'Please enter a valid email address.';

      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';

      case 'auth/network-request-failed':
        return 'Network error. Please try again.';

      default:
        return 'Something went wrong. Please try again.';
    }
  }
}