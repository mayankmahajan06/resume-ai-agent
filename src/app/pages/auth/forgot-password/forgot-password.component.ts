import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {

  email = '';
  isLoading = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  sendResetLink(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    this.isLoading = true;

    this.authService
      .forgotPassword(this.email)
      .then(() => {
        this.successMessage =
          'Password reset link sent successfully.';
      })
      .catch((error) => {
        this.errorMessage =
          this.getFirebaseErrorMessage(error.code);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  getFirebaseErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email.';

      case 'auth/invalid-email':
        return 'Please enter a valid email address.';

      case 'auth/network-request-failed':
        return 'Network error. Please try again.';

      default:
        return 'Something went wrong. Please try again.';
    }
  }
}