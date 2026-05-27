import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-brand-innovator-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './brand-innovator-template.component.html',
  styleUrl: './brand-innovator-template.component.scss'
})
export class BrandInnovatorTemplateComponent {

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
