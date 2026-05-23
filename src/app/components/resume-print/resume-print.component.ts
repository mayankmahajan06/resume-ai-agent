import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PdfService } from '../../services/pdf.service';
import {
  ResumeData
} from '../../services/resume.service';

@Component({
  selector: 'app-resume-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resume-print.component.html',
  styleUrls: ['./resume-print.component.scss']
})
export class ResumePrintComponent implements OnInit {

  resumeData!: ResumeData;

  selectedTheme = 'indigo';

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

        /*
        Wait for Angular render
        before Puppeteer captures PDF
        */
        setTimeout(() => {
          window.print();
        }, 500);
      });
  }

  get skillsArray(): string[] {
    if (!this.resumeData?.skills) {
      return [];
    }

    return this.resumeData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
  }

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

  sanitizeText(
    text: string
  ): string {

    if (!text) {
      return '';
    }

    return text
      .normalize('NFKD')
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  }


}