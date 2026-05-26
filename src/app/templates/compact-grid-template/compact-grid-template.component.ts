import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-compact-grid-template',
  standalone: true,
  imports: [],
  templateUrl: './compact-grid-template.component.html',
  styleUrl: './compact-grid-template.component.scss'
})
export class CompactGridTemplateComponent {

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
