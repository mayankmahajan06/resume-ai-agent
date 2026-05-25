// resume-preview.component.ts
// COMPLETE FILE

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ResumeService,
  ResumeData
} from '../../services/resume.service';

import {
  Firestore,
  doc,
  getDoc
} from '@angular/fire/firestore';

import { Auth } from '@angular/fire/auth';

import { MatDialog } from '@angular/material/dialog';

import { UpgradeModalComponent }
  from '../../shared/modals/upgrade-modal/upgrade-modal.component';

import { ModernTemplateComponent }
  from '../../templates/modern-template/modern-template.component';

import { PremiumTemplateComponent }
  from '../../templates/premium-template/premium-template.component';

@Component({
  selector: 'app-resume-preview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModernTemplateComponent,
    PremiumTemplateComponent
  ],
  templateUrl: './resume-preview.component.html',
  styleUrls: ['./resume-preview.component.scss']
})
export class ResumePreviewComponent implements OnInit {

  atsScore = 0;
  selectedTheme = 'indigo';
  selectedTemplate = 'modern';
  userPlan: 'free' | 'pro' | 'pro_plus' = 'free';
  resumeData!: ResumeData;

  templates = [
    { id: 'modern', name: 'Modern', premium: false },
    { id: 'premium', name: 'Premium', premium: true }
  ];
  recruiterVisibility = 'Low';

  constructor(
    private resumeService: ResumeService,
    private dialog: MatDialog,
    private auth: Auth,
    private firestore: Firestore
  ) { }

  ngOnInit(): void {
    this.resumeService.resumeData$.subscribe((data) => {
      this.resumeData = data;
      this.selectedTheme = data.selectedTheme || 'indigo';
      this.selectedTemplate = data.selectedTemplate || 'modern';
      this.calculateATSScore();
      this.validatePremiumAccess();
    });

    this.loadUserPlanFromFirebase();
  }

  /* ========================================
     JD MATCH — read directly from resumeData$
     Written by resume-form after JD modal closes.
     No local state needed — the stream is the source.
  ======================================== */

  get jdMatch(): number {
    return this.resumeData?.jdMatch || 0;
  }

  get jdMatchLabel(): string {
    return this.jdMatch > 0 ? this.jdMatch + '%' : 'Not Analyzed';
  }

  get jdMatchClass(): string {
    if (this.jdMatch >= 80) return 'jd-excellent';
    if (this.jdMatch >= 60) return 'jd-good';
    if (this.jdMatch > 0) return 'jd-average';
    return 'jd-none';
  }

  /* ========================================
     PLAN HELPERS
  ======================================== */

  get isPro(): boolean {
    return this.userPlan === 'pro' || this.userPlan === 'pro_plus';
  }

  openUpgradeModal(): void {
    this.dialog.open(UpgradeModalComponent, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: false
    });
  }

  /* ========================================
     THEME
  ======================================== */

  changeTheme(theme: string): void {
    if (theme !== 'indigo' && this.userPlan === 'free') {
      this.openUpgradeModal();
      return;
    }
    this.selectedTheme = theme;
    this.resumeService.updateResumeData({ selectedTheme: theme });
  }

  /* ========================================
     TEMPLATE
  ======================================== */

  selectTemplate(templateId: string): void {
    if (templateId === 'premium' && this.userPlan === 'free') {
      this.openUpgradeModal();
      return;
    }
    this.selectedTemplate = templateId;
    this.resumeService.updateResumeData({ selectedTemplate: templateId });
  }

  /* ========================================
     PREMIUM ACCESS GUARD
     Resets theme/template to free defaults
     if a free user somehow gets pro values
  ======================================== */

  validatePremiumAccess(): void {
    if (this.userPlan !== 'free') return;

    const premiumThemes = ['navy', 'emerald', 'slate', 'burgundy'];

    if (premiumThemes.includes(this.selectedTheme)) {
      this.selectedTheme = 'indigo';
      this.resumeService.updateResumeData({ selectedTheme: 'indigo' });
    }

    if (this.selectedTemplate === 'premium') {
      this.selectedTemplate = 'modern';
      this.resumeService.updateResumeData({ selectedTemplate: 'modern' });
    }
  }

  /* ========================================
     SKILLS
  ======================================== */

  get skillsArray(): string[] {
    if (!this.resumeData?.skills) return [];
    return this.resumeData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
  }

  /* ========================================
     ATS SCORE
  ======================================== */

  get atsStatus(): string {
    if (this.atsScore >= 85) return 'Excellent Match';
    if (this.atsScore >= 70) return 'Good Match';
    if (this.atsScore >= 50) return 'Needs Improvement';
    return 'Weak Resume';
  }

  calculateATSScore(): void {
    let score = 0;

    if (this.resumeData.fullName) score += 10;
    if (this.resumeData.email) score += 10;
    if (this.resumeData.phone) score += 10;
    if (this.resumeData.linkedIn) score += 5;

    if (this.resumeData.summary?.trim().length >= 100) score += 15;

    if (this.skillsArray.length >= 8) score += 15;
    else if (this.skillsArray.length >= 5) score += 10;

    if (this.resumeData.experiences?.length >= 2) score += 15;
    else if (this.resumeData.experiences?.length >= 1) score += 8;

    if (this.resumeData.projects?.length >= 2) score += 10;
    if (this.resumeData.education?.length >= 1) score += 10;

    const summaryText = (this.resumeData.summary || '').toLowerCase();
    if (
      summaryText.includes('%') ||
      summaryText.includes('improved') ||
      summaryText.includes('increased') ||
      summaryText.includes('reduced')
    ) score += 10;

    this.atsScore = Math.min(score, 100);
    this.updateRecruiterVisibility();
  }

  /* ========================================
     FIREBASE PLAN LOADER
  ======================================== */

  async loadUserPlanFromFirebase(): Promise<void> {
    const user = this.auth.currentUser;

    if (!user) {
      this.userPlan = 'free';
      this.validatePremiumAccess();
      return;
    }

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const data: any = snapshot.data();

      if (data.paymentStatus === 'active' && data.userPlan) {
        const expiryDate = new Date(data.planExpiryDate);
        this.userPlan = expiryDate > new Date() ? data.userPlan : 'free';
      } else {
        this.userPlan = 'free';
      }
    } else {
      this.userPlan = 'free';
    }

    this.validatePremiumAccess();
  }

  updateRecruiterVisibility(): void {

    if (this.atsScore >= 85) {

      this.recruiterVisibility = 'High';

    } else if (this.atsScore >= 65) {

      this.recruiterVisibility = 'Medium';

    } else {

      this.recruiterVisibility = 'Low';

    }

  }
}