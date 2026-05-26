import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ResumeData
} from '../../services/resume.service';

import {
  PdfService
} from '../../services/pdf.service';

@Component({
  selector: 'app-premium-resume-print',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './executive-left-rail-resume-print.html',
  styleUrls: ['./executive-left-rail-resume-print.scss']
})
export class ExecutiveLeftRailResumePrintComponent
  implements OnInit {

  resumeData!: ResumeData;

  selectedTheme = 'indigo';

  constructor(
    private pdfService: PdfService
  ) { }

  /*
  ========================================
  INIT
  ========================================
  */

  ngOnInit(): void {

    this.pdfService
      .getResumeData()
      .subscribe((data: any) => {

        this.resumeData = data;

        this.selectedTheme =
          data.selectedTheme || 'indigo';

        /*
        Wait for Angular render
        before Puppeteer captures PDF
        */
        setTimeout(() => {

          window.print();

        }, 500);

      });

  }

  /*
  ========================================
  SKILLS ARRAY
  ========================================
  */

  get skillsArray(): string[] {

    if (!this.resumeData?.skills) {
      return [];
    }

    return this.resumeData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

  }

  /*
  ========================================
  SANITIZE TEXT
  ========================================
  */

  sanitizeText(
    text: string
  ): string {

    if (!text) {
      return '';
    }

    return text
      .replace(/[^\x20-\x7E\n]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  }

  /*
  ========================================
  VALIDATION HELPERS
  ========================================
  */

  hasSkills(): boolean {

    return this.skillsArray?.length > 0;

  }

  hasCertifications(): boolean {

    return this.resumeData.certifications?.some(
      (cert: any) =>
        cert.certificationName?.trim()
    );

  }

  hasEducation(): boolean {

    return this.resumeData.education?.some(
      (edu: any) =>

        edu.degree?.trim() ||
        edu.college?.trim() ||
        edu.graduationYear?.trim()
    );

  }

  hasExperience(): boolean {

    return this.resumeData.experiences?.some(
      (exp: any) =>

        exp.role?.trim() ||
        exp.company?.trim() ||
        exp.duration?.trim() ||
        exp.responsibilities?.trim()
    );

  }

  hasProjects(): boolean {

    return this.resumeData.projects?.some(
      (project: any) =>

        project.projectName?.trim() ||
        project.techStack?.trim() ||
        project.description?.trim()
    );

  }

}