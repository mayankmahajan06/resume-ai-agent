import { Component, Input } from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modern-template',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './modern-template.component.html',

  styleUrls: ['./modern-template.component.scss']
})
export class ModernTemplateComponent {

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