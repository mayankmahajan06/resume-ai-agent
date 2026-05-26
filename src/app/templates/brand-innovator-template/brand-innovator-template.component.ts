import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-brand-innovator-template',
  standalone: true,
  imports: [],
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
