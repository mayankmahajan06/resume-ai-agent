import { Component, OnInit } from '@angular/core';
import { ResumeFormComponent } from '../../components/resume-form/resume-form.component';
import { ResumePreviewComponent } from '../../components/resume-preview/resume-preview.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ResumeService } from '../../services/resume.service';
import { AnalyticsService } from '../../services/analytics.service';
import { WorkspaceHeaderComponent } from '../../shared/workspace-header/workspace-header.component';

@Component({
  selector: 'app-resume-builder',
  standalone: true,
  imports: [CommonModule, MatIconModule, ResumeFormComponent, ResumePreviewComponent, WorkspaceHeaderComponent],
  templateUrl: './resume-builder.component.html',
  styleUrls: ['./resume-builder.component.scss']
})
export class ResumeBuilderComponent implements OnInit {
  isSaving = false;
  atsScore = 0;
  saveSuccessMessage = '';
  saveErrorMessage = '';

  constructor(
    private router: Router,
    private resumeService: ResumeService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  async saveResume(): Promise<void> {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    const saveType = this.resumeService.getResumeData().resumeId ? 'update' : 'create';

    try {
      await this.resumeService.saveResume(this.atsScore);
      this.analytics.track('resume_saved', {
        save_type: saveType,
        template: this.resumeService.getResumeData().selectedTemplate || 'modern'
      });

      this.saveSuccessMessage = 'Resume changes saved';
      this.saveErrorMessage = '';

      setTimeout(() => {
        this.saveSuccessMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Save resume failed', error);
      this.saveErrorMessage = 'Unable to save resume changes';
      this.saveSuccessMessage = '';

      setTimeout(() => {
        this.saveErrorMessage = '';
      }, 3000);
    } finally {
      this.isSaving = false;
    }
  }
}
