// app.routes.ts
// ADD Resume Print Route

import { Routes } from '@angular/router';

import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { ResumeBuilderComponent } from './pages/resume-builder/resume-builder.component';
import { ResumePrintComponent } from './components/resume-print/resume-print.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent
  },

  {
    path: 'resume-builder',
    component: ResumeBuilderComponent
  },

  {
    path: 'resume-print',
    component: ResumePrintComponent
  },

  {
    path: '**',
    redirectTo: ''
  }
];