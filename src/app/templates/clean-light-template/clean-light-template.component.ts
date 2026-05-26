import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-clean-light-template',
  standalone: true,
  imports: [],
  templateUrl: './clean-light-template.component.html',
  styleUrl: './clean-light-template.component.scss'
})
export class CleanLightTemplateComponent {

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
