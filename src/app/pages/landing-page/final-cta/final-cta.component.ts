import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ResumeService } from '../../../services/resume.service';

@Component({
  selector: 'app-final-cta',
  standalone: true,
  imports: [],
  templateUrl: './final-cta.component.html',
  styleUrl: './final-cta.component.scss'
})
export class FinalCtaComponent {
  isLoggedIn = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private resumeService: ResumeService
  ) {
    this.authService
      .getCurrentUser()
      .subscribe((user) => {
        this.isLoggedIn = !!user;
      });
  }

  goToPrimaryAction(): void {
    if (this.isLoggedIn) {
      this.resumeService.createNewResume();
      this.router.navigate(['/resume-builder']);
      return;
    }

    this.router.navigate(['/signup']);
  }
}
