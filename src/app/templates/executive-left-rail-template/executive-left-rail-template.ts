import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-executive-left-rail-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './executive-left-rail-template.html',
  styleUrls: ['./executive-left-rail-template.scss']
})
export class ExecutiveLeftRailTemplateComponent {

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
