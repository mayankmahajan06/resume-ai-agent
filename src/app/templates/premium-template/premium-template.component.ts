import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-premium-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './premium-template.component.html',
  styleUrls: ['./premium-template.component.scss']
})
export class PremiumTemplateComponent {

  @Input() resumeData: any;

  @Input() selectedTheme = 'indigo';

  get skillsArray(): string[] {

    if (!this.resumeData?.skills) {
      return [];
    }

    return this.resumeData.skills
      .split(',')
      .map((skill: string) => skill.trim())
      .filter((skill: string) => skill.length > 0);

  }

}
