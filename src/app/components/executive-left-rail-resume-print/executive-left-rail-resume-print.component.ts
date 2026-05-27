import {
  Component,
  Input,
  OnInit,
  AfterViewChecked,
  ViewEncapsulation
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

  templateUrl: './executive-left-rail-resume-print.component.html',
  styleUrls: ['./executive-left-rail-resume-print.component.scss'],

  /*
  ViewEncapsulation.None is required for print components.

  Angular's default (Emulated) adds [_ngcontent-xxx] attribute
  selectors to every CSS rule. This breaks:
    - Rules targeting `body` and `html` (Puppeteer's root elements)
    - `@page` rules (not inside a component shadow)
    - `linear-gradient` on .premium-resume (specificity mismatch)
    - Any rule that needs to apply globally in the print document

  With None, your SCSS applies exactly as written — no scoping.
  This is safe here because this is a dedicated print route with
  no other components that could be affected.
  */
  encapsulation: ViewEncapsulation.None
})
export class ExecutiveLeftRailResumePrintComponent
  implements OnInit, AfterViewChecked {

  resumeData!: ResumeData;

  selectedTheme = 'indigo';

  /*
  Two flags for the Puppeteer render-ready signal:
    dataLoaded      — true once PdfService returns data
    signalSent      — ensures we only write the flag once,
                      not on every subsequent change detection
  */
  private dataLoaded = false;
  private signalSent = false;

  constructor(
    private pdfService: PdfService
  ) {}

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
        Mark data as loaded. Angular will run one more
        change detection cycle after this, which triggers
        ngAfterViewChecked — that's where we signal Puppeteer.

        DO NOT call window.print() here. Puppeteer calls
        page.pdf() externally; window.print() opens the
        browser's native print dialog and does nothing
        useful in headless mode.
        */
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