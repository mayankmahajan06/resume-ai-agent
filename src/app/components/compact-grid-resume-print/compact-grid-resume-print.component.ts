import {
  AfterViewChecked,
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { PdfService } from '../../services/pdf.service';

import {
  ResumeData
} from '../../services/resume.service';

@Component({
  selector: 'app-compact-grid-resume-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compact-grid-resume-print.component.html',
  styleUrls: ['./compact-grid-resume-print.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CompactGridResumePrintComponent
  implements OnInit, AfterViewChecked {

  resumeData!: ResumeData;

  selectedTheme = 'indigo';
  selectedTemplate = 'compact';

  private dataLoaded = false;

  private signalSent = false;

  constructor(
    private pdfService: PdfService
  ) { }

  ngOnInit(): void {

    this.pdfService
      .getResumeData()
      .subscribe((data: any) => {

        this.resumeData = data;

        this.selectedTheme =
          data.selectedTheme || 'indigo';

        this.selectedTemplate =
          data.selectedTemplate || 'executive';
        this.dataLoaded = true;

      });

  }

  /*
  ========================================
  RENDER-READY SIGNAL FOR PUPPETEER

  ngAfterViewChecked fires after every change detection
  cycle that updates the view — including the cycle triggered
  by setting this.resumeData above, which causes all the
  *ngFor directives (skills, experience, projects etc.)
  to finish rendering into the DOM.

  We set document.body.dataset.resumeReady = 'true' here.
  Puppeteer waits for this flag with waitForFunction()
  before calling page.pdf(). This replaces all blind
  setTimeout() approaches and is 100% reliable.
  ========================================
  */

  ngAfterViewChecked(): void {

    if (this.dataLoaded && !this.signalSent) {

      this.signalSent = true;

      document.body.dataset['resumeReady'] = 'true';

    }

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

  sanitizeText(text: string): string {

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
      (cert: any) => cert.certificationName?.trim()
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