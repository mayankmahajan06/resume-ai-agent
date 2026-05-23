import { Component } from '@angular/core';

import { Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { MatButtonModule } from '@angular/material/button';

import { CommonModule } from '@angular/common';

import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-footer',

  standalone: true,

  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],

  templateUrl: './footer.component.html',

  styleUrl: './footer.component.scss'
})
export class FooterComponent {

  isLoggedIn = false;

  constructor(
    private router: Router,
    private auth: Auth
  ) {

    this.auth.onAuthStateChanged(user => {

      this.isLoggedIn = !!user;

    });

  }

  /*
  ========================================
  SCROLL TO SECTION
  ========================================
  */

  scrollTo(sectionId: string): void {

    const element =
      document.getElementById(sectionId);

    if (element) {

      element.scrollIntoView({
        behavior: 'smooth'
      });

    }

  }

  /*
  ========================================
  PRIMARY CTA
  ========================================
  */

  navigateToPrimaryAction(): void {

    if (this.isLoggedIn) {

      this.router.navigate([
        '/my-resumes'
      ]);

    } else {

      this.router.navigate([
        '/login'
      ]);

    }

  }

}