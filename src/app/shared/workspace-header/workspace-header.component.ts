import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-workspace-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './workspace-header.component.html',
  styleUrls: ['./workspace-header.component.scss']
})
export class WorkspaceHeaderComponent {

  @Input() subtitle = '';

  @Input() showMyResumesButton = false;

  @Input() showResumeBuilderButton = false;

  @Input() showDashboardButton = false;

  @Input() showSaveButton = false;

  @Input() showCreateResumeButton = false;

  @Input() isSaving = false;

  @Output() save =
    new EventEmitter<void>();

  @Output() createResume =
    new EventEmitter<void>();

  @ViewChild('profileMenuWrapper')
  profileMenuWrapper!: ElementRef;

  userName = '';

  userEmail = '';

  userInitial = '';

  showProfileMenu = false;

  userPlan: 'free' | 'pro' | 'pro_plus' = 'free';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {

    this.loadUser();

  }

  async loadUser(): Promise<void> {

    this.authService
      .getCurrentUser()
      .subscribe(async (user) => {

        if (user) {

          this.userEmail =
            user.email || '';

          this.userName =
            user.displayName ||
            user.email?.split('@')[0] ||
            'User';

          this.userInitial =
            this.userName
              .charAt(0)
              .toUpperCase();

          await this.userService
            .loadUserPlan();

          this.userPlan =
            this.userService.userPlan;

        }

      });

  }

  @HostListener(
    'document:click',
    ['$event']
  )
  clickOutside(event: Event): void {

    if (
      this.profileMenuWrapper &&
      !this.profileMenuWrapper
        .nativeElement
        .contains(event.target)
    ) {

      this.showProfileMenu = false;

    }

  }

  toggleProfileMenu(): void {

    this.showProfileMenu =
      !this.showProfileMenu;

  }

  logout(): void {

    this.authService
      .logout()
      .then(() => {

        this.router.navigate(
          ['/login']
        );

      });

  }

  goToHome(): void {

    this.router.navigate(['/']);

  }

  navigateToMyResumes(): void {

    this.router.navigate(
      ['/my-resumes']
    );

  }

  navigateToResumeBuilder(): void {

    this.router.navigate(
      ['/resume-builder']
    );

  }

}