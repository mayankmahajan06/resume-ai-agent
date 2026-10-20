import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterOutlet
} from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AnalyticsService } from './services/analytics.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'resume-ai-agent';

  private routeSubscription?: Subscription;

  constructor(
    private router: Router,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.routeSubscription =
      this.router.events
        .pipe(
          filter(
            (event): event is NavigationEnd =>
              event instanceof NavigationEnd
          )
        )
        .subscribe((event) => {
          this.analytics.track('app_route_view', {
            page_path: event.urlAfterRedirects.split('?')[0],
            page_title: document.title
          });
        });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }
}
