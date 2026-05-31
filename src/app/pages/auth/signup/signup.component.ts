import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { ResumeService } from '../../../services/resume.service';
import { AnalyticsService } from '../../../services/analytics.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
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
    private router: Router,
    private resumeService: ResumeService,
    private analyticsService: AnalyticsService
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
        this.analyticsService.track(
          'sign_up',
          {
            method: 'email'
          }
        );
        this.resumeService.createNewResume();
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
      this.analyticsService.track(
    'sign_up',
    {
      method: 'google'
    }
  );
        this.resumeService.createNewResume();
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

  goToHome(): void {
    this.router.navigate(['/']);
  }
}