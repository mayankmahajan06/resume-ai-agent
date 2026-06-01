// resume-form.component.ts
// COMPLETE FILE

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import {
  Firestore,
  doc,
  getDoc
} from '@angular/fire/firestore';
import {
  Auth
} from '@angular/fire/auth';

import {
  ResumeService
} from '../../services/resume.service';
import { PdfService } from '../../services/pdf.service';
import { PaymentService } from '../../services/payment.service';
import { MatDialog } from '@angular/material/dialog';
import { JdAnalysisDialogComponent } from '../jd-analysis-dialog/jd-analysis-dialog.component';
import { ResumeValidationDialogComponent } from '../resume-validation-dialog/resume-validation-dialog.component';
import { UpgradeModalComponent } from '../../shared/modals/upgrade-modal/upgrade-modal.component';
import { AnalyticsService } from '../../services/analytics.service';

/* ========================================
   TEMPLATE DEFINITION
======================================== */

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  pro: boolean;
}

@Component({
  selector: 'app-resume-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './resume-form.component.html',
  styleUrls: ['./resume-form.component.scss']
})
export class ResumeFormComponent implements OnInit {

  currentStep = 1;
  totalSteps = 6;

  profileCompletion = 0;

  resumeForm!: FormGroup;
  userPlan: 'free' | 'pro' | 'pro_plus' = 'free';
  showUpgradeModal = false;
  selectedTheme = 'indigo';
  isPremiumDownloading = false;
  isDownloading = false;
  downloadSuccessMessage = '';
  downloadErrorMessage = '';

  /* ========================================
     TEMPLATE LIST — single source of truth
  ======================================== */

  readonly templates: ResumeTemplate[] = [
    {
      id: 'modern',
      name: 'Modern Classic',
      description: 'Free standard top-down single-column track layout.',
      pro: false
    },
    {
      id: 'executive',
      name: 'Executive Left Rail',
      description: 'Sleek multi-grid layout separating segments into highlights.',
      pro: true
    },
    {
      id: 'compact',
      name: 'Compact Grid',
      description: 'High-density formatted layout optimised for rich experiences.',
      pro: true
    }
    // ,
    // {
    //   id: 'clean',
    //   name: 'Clean Light',
    //   description: 'Prestige light, spacious spacing with elegant fine lines.',
    //   pro: true
    // },
    // {
    //   id: 'brand',
    //   name: 'Brand Innovator',
    //   description: 'Full-bleed modern colored heading block layout system.',
    //   pro: true
    // },
    // {
    //   id: 'academic',
    //   name: 'Academic CV Label',
    //   description: 'Traditional scholarly labeled layout with structured rows.',
    //   pro: true
    // }
  ];

  selectedTemplate = 'modern';

  constructor(
    private fb: FormBuilder,
    private resumeService: ResumeService,
    private paymentService: PaymentService,
    private pdfService: PdfService,
    private auth: Auth,
    private firestore: Firestore,
    private dialog: MatDialog,
    private analyticsService: AnalyticsService
  ) { }

  ngOnInit(): void {
    const data = this.resumeService.getResumeData();

    this.initializeForm(data);

    /* KEEP TEMPLATE CARD IN SYNC */
    this.resumeService.resumeData$
      .subscribe(data => {

        this.selectedTemplate =
          data.selectedTemplate || 'modern';

      });

    /* Live Binding */
    this.resumeForm.valueChanges.subscribe((value) => {
      this.resumeService.updateResumeData(value);
      this.calculateProfileCompletion(value);
    });

    /* Initial calculation */
    this.calculateProfileCompletion(this.resumeForm.value);
    this.loadUserPlanFromFirebase();
  }

  initializeForm(data: any): void {

    this.resumeForm = this.fb.group({

      fullName: [data.fullName || ''],
      email: [data.email || ''],
      phone: [data.phone || ''],
      location: [data.location || ''],
      linkedIn: [data.linkedIn || ''],
      currentRole: [data.currentRole || ''],
      targetRole: [data.targetRole || ''],
      summary: [data.summary || ''],

      skills: [data.skills || ''],

      experiences: this.fb.array(
        data.experiences?.length
          ? data.experiences.map((exp: any) =>
            this.fb.group({
              company: [exp.company || ''],
              role: [exp.role || ''],
              duration: [exp.duration || ''],
              responsibilities: [exp.responsibilities || '']
            })
          )
          : [this.createExperience()]
      ),

      projects: this.fb.array(
        data.projects?.length
          ? data.projects.map((project: any) =>
            this.fb.group({
              projectName: [project.projectName || ''],
              techStack: [project.techStack || ''],
              description: [project.description || '']
            })
          )
          : [this.createProject()]
      ),

      certifications: this.fb.array(
        data.certifications?.length
          ? data.certifications.map((cert: any) =>
            this.fb.group({
              certificationName: [cert.certificationName || '']
            })
          )
          : [this.createCertification()]
      ),

      education: this.fb.array(
        data.education?.length
          ? data.education.map((edu: any) =>
            this.fb.group({
              degree: [edu.degree || ''],
              college: [edu.college || ''],
              graduationYear: [edu.graduationYear || ''],
              cgpa: [edu.cgpa || '']
            })
          )
          : [this.createEducation()]
      )

    });
    this.selectedTemplate = data.selectedTemplate || 'modern';
  }

  /* ========================================
     GETTERS — Form Arrays
  ======================================== */

  get experiences(): FormArray {
    return this.resumeForm.get('experiences') as FormArray;
  }

  get projects(): FormArray {
    return this.resumeForm.get('projects') as FormArray;
  }

  get certifications(): FormArray {
    return this.resumeForm.get('certifications') as FormArray;
  }

  get education(): FormArray {
    return this.resumeForm.get('education') as FormArray;
  }

  /* ========================================
     GETTERS — Plan helpers
     Used in the template to keep HTML clean
  ======================================== */

  /** True for pro or pro_plus users */
  get isPro(): boolean {
    return this.userPlan === 'pro' || this.userPlan === 'pro_plus';
  }

  /** Label shown on the free track download button */
  get freeDownloadLabel(): string {
    return this.isDownloading ? 'Generating...' : '⬇ Download Free PDF';
  }

  /** Label shown on the pro track download button */
  get proDownloadLabel(): string {
    if (this.isPro) {
      return this.isPremiumDownloading ? 'Generating...' : '⬇ Download Premium PDF';
    }
    return '💳 Unlock Premium for ₹99';
  }

  /** Plan pill label — shown as the "active plan" track pill */
  get activePlanLabel(): string {
    if (this.userPlan === 'pro_plus') return 'PRO PLUS';
    if (this.userPlan === 'pro') return 'PRO';
    return 'FREE';
  }

  /** Number of locked (pro) templates the user cannot access */
  get lockedTemplateCount(): number {
    return this.templates.filter(t => t.pro && !this.isPro).length;
  }

  /* ========================================
     TEMPLATE SELECTION
  ======================================== */

  selectTemplate(template: any): void {
    this.selectedTemplate = template.id;
    this.resumeService
      .updateResumeData({
        selectedTemplate:
          template.id
      });
  }

  isTemplateSelected(templateId: string): boolean {
    return this.selectedTemplate === templateId;
  }

  isTemplateLocked(template: ResumeTemplate): boolean {
    return template.pro && !this.isPro;
  }

  /* ========================================
     CREATE GROUPS
  ======================================== */

  createExperience(): FormGroup {
    return this.fb.group({
      company: [''],
      role: [''],
      duration: [''],
      responsibilities: ['']
    });
  }

  createProject(): FormGroup {
    return this.fb.group({
      projectName: [''],
      techStack: [''],
      description: ['']
    });
  }

  createCertification(): FormGroup {
    return this.fb.group({
      certificationName: ['']
    });
  }

  createEducation(): FormGroup {
    return this.fb.group({
      degree: [''],
      college: [''],
      graduationYear: [''],
      cgpa: ['']
    });
  }

  /* ========================================
     ADD METHODS
  ======================================== */

  addExperience(): void {
    this.experiences.push(this.createExperience());
  }

  addProject(): void {
    this.projects.push(this.createProject());
  }

  addCertification(): void {
    this.certifications.push(this.createCertification());
  }

  addEducation(): void {
    this.education.push(this.createEducation());
  }

  /* ========================================
     REMOVE METHODS
  ======================================== */

  removeExperience(index: number): void {
    if (this.experiences.length > 1) {
      this.experiences.removeAt(index);
    }
  }

  removeProject(index: number): void {
    if (this.projects.length > 1) {
      this.projects.removeAt(index);
    }
  }

  removeCertification(index: number): void {
    if (this.certifications.length > 1) {
      this.certifications.removeAt(index);
    }
  }

  removeEducation(index: number): void {
    if (this.education.length > 1) {
      this.education.removeAt(index);
    }
  }

  /* ========================================
     PROFILE COMPLETION
  ======================================== */

  calculateProfileCompletion(value: any): void {
    let totalFields = 0;
    let filledFields = 0;

    const checkField = (field: any) => {
      totalFields++;
      if (field && field.toString().trim() !== '') {
        filledFields++;
      }
    };

    checkField(value.fullName);
    checkField(value.email);
    checkField(value.phone);
    checkField(value.location);
    checkField(value.linkedIn);
    checkField(value.currentRole);
    checkField(value.targetRole);
    checkField(value.summary);
    checkField(value.skills);

    value.experiences?.forEach((exp: any) => {
      checkField(exp.company);
      checkField(exp.role);
      checkField(exp.duration);
      checkField(exp.responsibilities);
    });

    value.projects?.forEach((project: any) => {
      checkField(project.projectName);
      checkField(project.techStack);
      checkField(project.description);
    });

    value.certifications?.forEach((cert: any) => {
      checkField(cert.certificationName);
    });

    value.education?.forEach((edu: any) => {
      checkField(edu.degree);
      checkField(edu.college);
      checkField(edu.graduationYear);
      checkField(edu.cgpa);
    });

    this.profileCompletion = Math.round(
      (filledFields / totalFields) * 100
    );
  }

  /* ========================================
     STEP NAVIGATION
  ======================================== */

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  startFreshResume(): void {
    this.resumeService.resetResumeData();
    const freshData = this.resumeService.getResumeData();
    this.initializeForm(freshData);
    this.currentStep = 1;
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  /* ========================================
     DOWNLOAD — FREE PDF
  ======================================== */

  downloadFreePDF(): void {
    this.isDownloading = true;
    this.downloadSuccessMessage = '';
    this.downloadErrorMessage = '';

    const latestData = {
      ...this.resumeService.getResumeData()
    };

    this.pdfService.saveResumeData(latestData).subscribe({
      next: () => {
        this.pdfService.generatePdf().subscribe({
          next: (response: Blob) => {
            this._triggerDownload(response, latestData.fullName || 'resume');
            this.analyticsService.track(
              'pdf_downloaded',
              {
                type: 'free',
                template:
                  latestData.selectedTemplate || 'modern'
              }
            );
            this.isDownloading = false;
            this.downloadSuccessMessage = 'Free PDF downloaded successfully';
            setTimeout(() => { this.downloadSuccessMessage = ''; }, 3000);
          },
          error: (error) => {
            console.error(error);
            this.isDownloading = false;
            this.downloadErrorMessage = 'Failed to generate PDF. Please try again.';
            setTimeout(() => { this.downloadErrorMessage = ''; }, 3000);
          }
        });
      },
      error: (error) => {
        console.error(error);
        this.isDownloading = false;
        this.downloadErrorMessage = 'Failed to generate PDF. Please try again.';
        setTimeout(() => { this.downloadErrorMessage = ''; }, 3000);
      }
    });
  }

  /* ========================================
     DOWNLOAD — PREMIUM PDF
  ======================================== */

  downloadPremiumPDF(): void {
    if (!this.isPro) {
      this.analyticsService.track(
        'upgrade_modal_opened',
        {
          feature: 'premium_pdf'
        }
      );
      this.showUpgradeModal = true;
      return;
    }
    this.downloadPremium();
  }

  downloadPremium(): void {
    this.isPremiumDownloading = true;
    this.downloadSuccessMessage = '';
    this.downloadErrorMessage = '';

    const latestData = {
      ...this.resumeService.getResumeData()
    };

    this.pdfService.saveResumeData(latestData).subscribe({
      next: () => {
        this.pdfService.generatePremiumPdf().subscribe({
          next: (response: Blob) => {
            this._triggerDownload(response, latestData.fullName || 'premium-resume');
            this.analyticsService.track(
              'pdf_downloaded',
              {
                type: 'premium',
                template:
                  latestData.selectedTemplate || 'modern'
              }
            );
            this.isPremiumDownloading = false;
            this.downloadSuccessMessage = 'Premium PDF downloaded successfully';
            setTimeout(() => { this.downloadSuccessMessage = ''; }, 2000);
          },
          error: (error) => {
            console.error(error);
            this.isPremiumDownloading = false;
            this.downloadErrorMessage = 'Failed to generate premium PDF. Please try again.';
            setTimeout(() => { this.downloadErrorMessage = ''; }, 3000);
          }
        });
      },
      error: (error) => {
        console.error(error);
        this.isPremiumDownloading = false;
        this.downloadErrorMessage = 'Failed to generate premium PDF. Please try again.';
        setTimeout(() => { this.downloadErrorMessage = ''; }, 3000);
      }
    });
  }

  /** Shared helper — creates blob URL and clicks download link */
  private _triggerDownload(blob: Blob, fileName: string): void {
    const fileBlob = new Blob([blob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(fileBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w\-]/g, '')
      }.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /* ========================================
     MODAL
  ======================================== */

  closeUpgradeModal(): void {
    this.showUpgradeModal = false;
  }

  startPremiumUpgrade(planType: 'pro' | 'pro_plus'): void {
    this.paymentService.startPremiumUpgrade(planType);
  }

  /* ========================================
     FIREBASE PLAN LOADER
  ======================================== */

  async loadUserPlanFromFirebase(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const data: any = snapshot.data();

      if (data.paymentStatus === 'active' && data.userPlan) {
        const expiryDate = new Date(data.planExpiryDate);
        const today = new Date();

        if (expiryDate > today) {
          this.userPlan = data.userPlan;
        } else {
          this.userPlan = 'free';
        }
      }
    }
  }

  /* ========================================
     JD ANALYSIS MODAL
     Opens the same JdAnalysisDialog used in preview.
     On close, writes jdMatch into ResumeService so
     resume-preview picks it up via resumeData$ stream.
  ======================================== */

  openJDModal(): void {
    if (!this.isPro) {
      this.showUpgradeModal = true;
      return;
    }

    const currentData = this.resumeService.getResumeData();

    const skillsArray = (currentData.skills || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const hasSkills = skillsArray.length > 0;
    const hasSummary = currentData.summary?.trim()?.length >= 20;
    const hasExperience = currentData.experiences?.some(
      (exp: any) => exp.role?.trim() && exp.company?.trim() && exp.responsibilities?.trim()
    );

    const missingFields: string[] = [];
    if (!hasSkills) missingFields.push('Skills Required');
    if (!hasSummary) missingFields.push('Professional Summary Required');
    if (!hasExperience) missingFields.push('At Least 1 Valid Experience Required');

    if (missingFields.length > 0) {
      this.dialog.open(ResumeValidationDialogComponent, {
        width: '550px',
        maxWidth: '95vw',
        panelClass: 'validation-dialog-container',
        autoFocus: false,
        disableClose: true,
        data: { missingFields }
      });
      return;
    }

    const dialogRef = this.dialog.open(JdAnalysisDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'jd-dialog-container',
      autoFocus: false,
      disableClose: true,
      data: { resumeData: currentData }
    });

    /* Write score into shared service — resume-preview reads it automatically */
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.resumeService.updateResumeData({ jdMatch: result.jdMatch });
      }
    });
  }

  /* ========================================
     AI SUGGESTIONS
  ======================================== */

  get aiSuggestions(): string[] {
    const suggestions: string[] = [];
    const data = this.resumeForm.value;

    if (!data.summary || data.summary.length < 120) {
      suggestions.push('Expand your professional summary with measurable achievements.');
    }

    if (this.skillsArray.length < 8) {
      suggestions.push('Add more technical keywords to improve ATS matching.');
    }

    const hasCertifications = data.certifications?.some(
      (cert: any) => cert.certificationName?.trim()
    );

    if (!hasCertifications) {
      suggestions.push('Add certifications to improve recruiter trust and ATS visibility.');
    }

    const hasProjects = data.projects?.some(
      (project: any) => project.projectName?.trim()
    );

    if (!hasProjects) {
      suggestions.push('Projects significantly improve recruiter engagement.');
    }

    const experienceCount = data.experiences?.filter(
      (exp: any) => exp.role?.trim()
    )?.length || 0;

    if (experienceCount < 2) {
      suggestions.push('Add more work experience details to strengthen your profile.');
    }

    if (suggestions.length === 0) {
      suggestions.push('Your resume looks strong and recruiter-ready.');
      suggestions.push('ATS optimization score is looking excellent.');
      suggestions.push('Your resume has strong section completeness.');
    }

    return suggestions.slice(0, 4);
  }

  /* ========================================
     SKILLS ARRAY
  ======================================== */

  get skillsArray(): string[] {
    const skills = this.resumeForm.value.skills || '';
    return skills
      .split(',')
      .map((skill: string) => skill.trim())
      .filter((skill: string) => skill.length > 0);
  }

  handleResumeAction(): void {

    if (
      this.selectedTemplate === 'modern'
    ) {

      this.downloadFreePDF();

      return;

    }

    if (!this.isPro) {

      this.openUpgradeModal();

      return;

    }

    this.downloadPremiumPDF();

  }

  getMainCTAButtonText(): string {

    if (
      this.isDownloading ||
      this.isPremiumDownloading
    ) {

      return 'Generating PDF...';

    }

    return 'Download PDF';

  }

  getMainCTASubtext(): string {

    const isPremiumTemplate =
      this.selectedTemplate !== 'modern';

    if (
      !this.isPro &&
      isPremiumTemplate
    ) {

      return 'Premium template selected • Export unlock required';

    }

    if (
      this.isPro &&
      isPremiumTemplate
    ) {

      return 'Premium recruiter export enabled';

    }

    return 'Standard export • Modern template';

  }

  handleJDTrackerClick(): void {

    if (this.isPro) {
      return;
    }

    this.openUpgradeModal();

  }

  openUpgradeModal(): void {

    this.dialog.open(
      UpgradeModalComponent,
      {
        width: '520px',
        panelClass: 'upgrade-dialog'
      }
    );

  }

  onLinkedInBlur(): void {

    const control =
      this.resumeForm.get('linkedIn');

    const value =
      control?.value?.trim();

    if (!value) {
      return;
    }

    if (
      !value.startsWith('http://') &&
      !value.startsWith('https://')
    ) {

      control?.setValue(
        `https://${value}`
      );

    }

  }
}
