import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import {
  provideAnalytics,
  getAnalytics
} from '@angular/fire/analytics';

import {
  provideFirestore,
  getFirestore
} from '@angular/fire/firestore';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    provideAnimationsAsync(),

    provideHttpClient(),

    provideFirebaseApp(() =>
      initializeApp(environment.firebase)
    ),

    provideAuth(() =>
      getAuth()
    ),

    provideFirestore(() =>
      getFirestore()
    ),
    provideAnalytics(() =>
      getAnalytics()
    )
  ]
};