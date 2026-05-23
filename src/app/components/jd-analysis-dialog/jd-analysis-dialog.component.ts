import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PdfService } from '../../services/pdf.service';
import { UserService }
  from '../../services/user.service';

@Component({
  selector: 'app-jd-analysis-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './jd-analysis-dialog.component.html',
  styleUrls: ['./jd-analysis-dialog.component.scss']
})
export class JdAnalysisDialogComponent implements OnInit {

  jobDescription = '';

  jdMatch = 0;
  hasAnalyzed = false;

  matchingSkills: string[] = [];
  missingSkills: string[] = [];
  jdSuggestions: string[] = [];
  loading = false;
  isPremiumUser = false;

  constructor(
    private dialogRef: MatDialogRef<JdAnalysisDialogComponent>,
    private pdfService: PdfService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) { }

  async ngOnInit(): Promise<void> {

    await this.userService
      .loadUserPlan();

    this.isPremiumUser =
      this.userService
        .isPremiumUser();

  }

  closeDialog(): void {
    this.dialogRef.close({
      jdMatch: this.jdMatch
    });
  }

  analyzeJD(): void {

    if (!this.jobDescription.trim()) {
      return;
    }

    this.loading = true;

    this.pdfService
      .analyzeJD(
        this.data.resumeData,
        this.jobDescription
      )
      .subscribe({

        next: (response: any) => {

          this.jdMatch =
            response.jdMatchScore;

          this.matchingSkills =
            response.matchedSkills;

          this.missingSkills =
            response.missingSkills;

          this.hasAnalyzed = true;

          this.loading = false;

        },

        error: (error) => {

          console.error(
            'JD Analysis Failed',
            error
          );

          this.loading = false;

        }

      });

  }

  getScoreClass(): string {

    if (this.jdMatch >= 80) {
      return 'excellent-score';
    }

    if (this.jdMatch >= 60) {
      return 'good-score';
    }

    return 'low-score';

  }

}