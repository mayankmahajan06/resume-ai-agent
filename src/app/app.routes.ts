import { Routes } from '@angular/router';

import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { ResumeBuilderComponent } from './pages/resume-builder/resume-builder.component';
import { ResumePrintComponent } from './components/resume-print/resume-print.component';

import { LoginComponent } from './pages/auth/login/login.component';
import { SignupComponent } from './pages/auth/signup/signup.component';
import { ForgotPasswordComponent } from './pages/auth/forgot-password/forgot-password.component';
import { authGuard } from './guards/auth.guard';
import { PremiumResumePrintComponent } from './components/premium-resume-print/premium-resume-print.component';
import { MyResumesComponent } from './pages/my-resumes/my-resumes.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent
  },

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'signup',
    component: SignupComponent
  },

  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },

  {
    path: 'resume-builder',
    component: ResumeBuilderComponent,
    canActivate: [authGuard]
  },

  {
    path: 'resume-print',
    component: ResumePrintComponent
  },
  {
    path: 'premium-resume-print',
    component: PremiumResumePrintComponent
  },
  {
    path: 'my-resumes',
    component: MyResumesComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];