import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-academic-cv-template',
  standalone: true,
  imports: [],
  templateUrl: './academic-cv-template.component.html',
  styleUrl: './academic-cv-template.component.scss'
})
export class AcademicCvTemplateComponent {

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
