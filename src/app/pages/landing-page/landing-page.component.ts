import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { HeroComponent } from './hero/hero.component';
import { FeaturesComponent } from './features/features.component';
import { FinalCtaComponent } from './final-cta/final-cta.component';
import { HowItWorksComponent } from './how-it-works/how-it-works.component';
import { PricingComponent } from './pricing/pricing.component';
import { StatsComponent } from './stats/stats.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [[ HeaderComponent, FooterComponent, HeroComponent, FeaturesComponent, HowItWorksComponent, StatsComponent, PricingComponent, FinalCtaComponent ]],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {

}
