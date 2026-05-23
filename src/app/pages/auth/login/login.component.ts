import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  email = '';
  password = '';

  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill all fields';
      return;
    }

    this.isLoading = true;

    this.authService
      .login(this.email, this.password)
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

  googleLogin(): void {
    this.authService
      .googleLogin()
      .then(() => {
        this.router.navigate(['/resume-builder']);
      })
      .catch((error) => {
        this.errorMessage = this.getFirebaseErrorMessage(error.code);
      });
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  getFirebaseErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email.';

      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';

      case 'auth/invalid-email':
        return 'Please enter a valid email address.';

      case 'auth/invalid-credential':
        return 'Invalid email or password.';

      case 'auth/network-request-failed':
        return 'Network error. Please try again.';

      default:
        return 'Something went wrong. Please try again.';
    }
  }
}