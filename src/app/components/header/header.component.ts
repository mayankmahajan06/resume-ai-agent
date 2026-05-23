import {
  Component,
  ElementRef,
  HostListener,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @ViewChild('profileMenuWrapper')
  profileMenuWrapper!: ElementRef;

  isScrolled = false;
  isMenuOpen = false;
  isLoggedIn = false;
  showProfileMenu = false;
  userName = '';
  userEmail = '';
  userInitial = '';
  userPlan: 'free' | 'pro' | 'pro_plus' = 'free';

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.authService
      .getCurrentUser()
      .subscribe(async (user) => {
        this.isLoggedIn = !!user;

        if (!user) {
          this.showProfileMenu = false;
          this.userName = '';
          this.userEmail = '';
          this.userInitial = '';
          this.userPlan = 'free';
          return;
        }

        this.userEmail = user.email || '';
        this.userName =
          user.displayName ||
          user.email?.split('@')[0] ||
          'User';
        this.userInitial =
          this.userName.charAt(0).toUpperCase();

        await this.userService.loadUserPlan();
        this.userPlan =
          this.userService.userPlan;
      });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    if (
      this.profileMenuWrapper &&
      !this.profileMenuWrapper.nativeElement.contains(event.target)
    ) {
      this.showProfileMenu = false;
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  scrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateToPrimaryAction() {
    if (this.isLoggedIn) {
      this.router.navigate(['/my-resumes']);
      return;
    }

    this.router.navigate(['/signup']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    this.authService
      .logout()
      .then(() => {
        this.showProfileMenu = false;
        this.isMenuOpen = false;
        this.router.navigate(['/']);
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
