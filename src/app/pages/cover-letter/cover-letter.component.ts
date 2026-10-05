import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { CoverLetterService } from '../../services/cover-letter.service';
import { UserService } from '../../services/user.service';
import { WorkspaceHeaderComponent } from '../../shared/workspace-header/workspace-header.component';

@Component({
  selector: 'app-cover-letter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    WorkspaceHeaderComponent
  ],
  templateUrl: './cover-letter.component.html',
  styleUrl: './cover-letter.component.scss'
})
export class CoverLetterComponent {

  selectedFile: File | null = null;
  jobTitle = '';
  companyName = '';
  jobDescription = '';
  tone: 'Professional' | 'Confident' | 'Concise' = 'Professional';

  generatedContent = '';
  selectedTemplate: 'classic' | 'modern' | 'minimal' = 'classic';

  loading = false;
  downloading = false;
  errorMessage = '';

  isPremium = false;
  checkingPlan = true;

  constructor(
    private coverLetterService: CoverLetterService,
    private userService: UserService,
    private router: Router
  ) {
    this.loadPlan();
  }

  async loadPlan(): Promise<void> {
    await this.userService.loadUserPlan();
    this.isPremium = this.userService.isPremiumUser();
    this.checkingPlan = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    this.errorMessage = '';

    if (!file) {
      this.selectedFile = null;
      return;
    }

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      this.selectedFile = null;
      this.errorMessage = 'Please select a PDF resume.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.selectedFile = null;
      this.errorMessage = 'Resume PDF must be 5 MB or smaller.';
      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  canGenerate(): boolean {
    return !!this.selectedFile &&
      !!this.jobTitle.trim() &&
      !!this.companyName.trim() &&
      !!this.jobDescription.trim() &&
      this.jobTitle.trim().length <= 150 &&
      this.companyName.trim().length <= 150 &&
      this.jobDescription.trim().length <= 15000 &&
      !this.loading;
  }

  generate(): void {
    if (!this.canGenerate() || !this.selectedFile) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.coverLetterService.generate(
      this.selectedFile,
      this.jobTitle.trim(),
      this.companyName.trim(),
      this.jobDescription.trim(),
      this.tone
    ).subscribe({
      next: response => {
        this.loading = false;

        if (!response.success || !response.content) {
          this.errorMessage =
            response.message || 'Cover letter generation failed.';
          return;
        }

        this.generatedContent = response.content;
      },
      error: error => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message ||
          'Cover letter generation failed. Please try again.';
      }
    });
  }

  downloadPdf(): void {
    if (!this.generatedContent.trim() || this.downloading) {
      return;
    }

    this.downloading = true;
    this.errorMessage = '';

    this.coverLetterService
      .downloadPdf(this.generatedContent.trim(), this.selectedTemplate)
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = 'cover-letter.pdf';
          anchor.click();
          URL.revokeObjectURL(url);
          this.downloading = false;
        },
        error: error => {
          this.downloading = false;
          this.errorMessage =
            error?.error?.message ||
            'Cover letter PDF download failed. Please try again.';
        }
      });
  }

  goToPricing(): void {
    this.router.navigate(['/']);
    setTimeout(() => {
      document.getElementById('pricing')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }
}
