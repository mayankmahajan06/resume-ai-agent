import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  ResumeService,
  ResumeData
} from '../../services/resume.service';
import { PdfService } from '../../services/pdf.service';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { JdAnalysisDialogComponent } from '../jd-analysis-dialog/jd-analysis-dialog.component';
import { ResumeValidationDialogComponent } from '../resume-validation-dialog/resume-validation-dialog.component';

@Component({
  selector: 'app-resume-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resume-preview.component.html',
  styleUrls: ['./resume-preview.component.scss']
})
export class ResumePreviewComponent implements OnInit {

  atsScore = 0;
  jdMatch = 0;

  selectedTheme = '';
  jobDescription = '';

  matchingSkills: string[] = [];
  missingSkills: string[] = [];
  jdSuggestions: string[] = [];

  resumeData!: ResumeData;

  constructor(
    private resumeService: ResumeService,
    private pdfService: PdfService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.resumeService.resumeData$
      .subscribe((data) => {
        this.resumeData = data;
        console.log('Resume Data Updated:', data);
        this.selectedTheme =
          data.selectedTheme || 'indigo';
        this.calculateATSScore();
      });
  }

  changeTheme(theme: string): void {
    this.selectedTheme = theme;

    this.resumeService.updateResumeData({
      selectedTheme: theme
    });
  }

  /* ========================================
     NEW PDF FLOW
  ======================================== */

  downloadPDF(): void {
    const latestData = {
      ...this.resumeService.getResumeData(),
      selectedTheme: this.selectedTheme
    };

    this.pdfService
      .saveResumeData(latestData)
      .subscribe({
        next: () => {
          this.pdfService
            .generatePdf()
            .subscribe((response: Blob) => {
              const blob = new Blob(
                [response],
                {
                  type: 'application/pdf'
                }
              );

              const url =
                window.URL.createObjectURL(blob);

              const link =
                document.createElement('a');

              link.href = url;
              link.download = 'resume.pdf';
              link.click();

              window.URL.revokeObjectURL(url);
            });
        },

        error: (error) => {
          console.error(
            'Failed to save resume data',
            error
          );
        }
      });
  }

  /* ========================================
     SKILLS ARRAY
  ======================================== */

  get skillsArray(): string[] {
    if (!this.resumeData?.skills) {
      return [];
    }

    return this.resumeData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
  }

  get atsStatus(): string {
    if (this.atsScore >= 85) {
      return 'Excellent Match';
    }

    if (this.atsScore >= 70) {
      return 'Good Match';
    }

    if (this.atsScore >= 50) {
      return 'Needs Improvement';
    }

    return 'Weak Resume';
  }

  openJDModal(): void {

    const hasSkills =
      this.skillsArray
        ?.filter(skill =>
          skill.trim()
        )
        .length > 0;

    const hasSummary =
      this.resumeData.summary
        ?.trim()
        ?.length >= 20;

    const hasExperience =
      this.resumeData.experiences?.some(
        (exp: any) =>

          exp.role?.trim() &&
          exp.company?.trim() &&
          exp.responsibilities?.trim()

      );

    const missingFields: string[] = [];

    if (!hasSkills) {

      missingFields.push(
        'Skills Required'
      );

    }

    if (!hasSummary) {

      missingFields.push(
        'Professional Summary Required'
      );

    }

    if (!hasExperience) {

      missingFields.push(
        'At Least 1 Valid Experience Required'
      );

    }

    /*
    ========================================
    SHOW VALIDATION MODAL
    ========================================
    */

    if (missingFields.length > 0) {

      this.dialog.open(
        ResumeValidationDialogComponent,
        {
          width: '550px',
          maxWidth: '95vw',
          panelClass:
            'validation-dialog-container',
          autoFocus: false,
          disableClose: true,

          data: {
            missingFields
          }
        }
      );

      return;

    }

    /*
    ========================================
    OPEN JD ANALYSIS MODAL
    ========================================
    */

    const dialogRef = this.dialog.open(
      JdAnalysisDialogComponent,
      {
        width: '900px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        panelClass:
          'jd-dialog-container',
        autoFocus: false,
        disableClose: true,

        data: {
          resumeData: this.resumeData
        }
      }
    );

    dialogRef
      .afterClosed()
      .subscribe((result) => {

        if (result?.jdMatch) {

          this.jdMatch =
            result.jdMatch;

        }

      });

  }

  calculateATSScore(): void {
    let score = 0;

    /* Contact Info */
    if (this.resumeData.fullName) score += 10;
    if (this.resumeData.email) score += 10;
    if (this.resumeData.phone) score += 10;
    if (this.resumeData.linkedIn) score += 5;

    /* Professional Summary */
    if (
      this.resumeData.summary &&
      this.resumeData.summary.trim().length >= 100
    ) {
      score += 15;
    }

    /* Skills */
    if (this.skillsArray.length >= 8) {
      score += 15;
    } else if (this.skillsArray.length >= 5) {
      score += 10;
    }

    /* Experience */
    if (
      this.resumeData.experiences &&
      this.resumeData.experiences.length >= 2
    ) {
      score += 15;
    } else if (
      this.resumeData.experiences &&
      this.resumeData.experiences.length >= 1
    ) {
      score += 8;
    }

    /* Projects */
    if (
      this.resumeData.projects &&
      this.resumeData.projects.length >= 2
    ) {
      score += 10;
    }

    /* Education */
    if (
      this.resumeData.education &&
      this.resumeData.education.length >= 1
    ) {
      score += 10;
    }

    /* Quantified achievements check */
    const summaryText =
      (this.resumeData.summary || '').toLowerCase();

    if (
      summaryText.includes('%') ||
      summaryText.includes('improved') ||
      summaryText.includes('increased') ||
      summaryText.includes('reduced')
    ) {
      score += 10;
    }

    this.atsScore = Math.min(score, 100);
  }
}