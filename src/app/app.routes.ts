import { Routes } from '@angular/router';

import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { ResumeBuilderComponent } from './pages/resume-builder/resume-builder.component';
import { ModernResumePrintComponent } from './components/modern-resume-print/modern-resume-print.component';

import { LoginComponent } from './pages/auth/login/login.component';
import { SignupComponent } from './pages/auth/signup/signup.component';
import { ForgotPasswordComponent } from './pages/auth/forgot-password/forgot-password.component';
import { authGuard } from './guards/auth.guard';
import { ExecutiveLeftRailResumePrintComponent } from './components/executive-left-rail-resume-print/executive-left-rail-resume-print.component';
import { MyResumesComponent } from './pages/my-resumes/my-resumes.component';
import { CompactGridResumePrintComponent } from './components/compact-grid-resume-print/compact-grid-resume-print.component';

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
    path: 'modern-resume-print',
    component: ModernResumePrintComponent
  },
  {
    path: 'executive-left-rail-resume-print',
    component: ExecutiveLeftRailResumePrintComponent
  },
  {
    path: 'compact-grid-resume-print',
    component: CompactGridResumePrintComponent
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