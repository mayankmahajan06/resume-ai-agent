import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ MatIconModule, MatButtonModule ],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent {
  isLoggedIn = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.authService
      .getCurrentUser()
      .subscribe((user) => {
        this.isLoggedIn = !!user;
      });
  }

  goToPrimaryAction() {
    if (this.isLoggedIn) {
      this.router.navigate(['/resume-builder']);
      return;
    }

    this.router.navigate(['/signup']);
  }

}
