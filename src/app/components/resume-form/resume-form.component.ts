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

@Component({
  selector: 'app-resume-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
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
  selectedTheme = '';
  isPremiumDownloading = false;
  downloadSuccessMessage = '';
  downloadErrorMessage = '';

  constructor(
    private fb: FormBuilder,
    private resumeService: ResumeService,
    private paymentService: PaymentService,
    private pdfService: PdfService,
    private auth: Auth,
    private firestore: Firestore
  ) { }

  ngOnInit(): void {
    const data = this.resumeService.getResumeData();

    this.initializeForm(data);

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

  }

  /* ========================================
     GETTERS
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

      if (
        field &&
        field.toString().trim() !== ''
      ) {
        filledFields++;
      }
    };

    /* Basic fields */
    checkField(value.fullName);
    checkField(value.email);
    checkField(value.phone);
    checkField(value.location);
    checkField(value.linkedIn);
    checkField(value.currentRole);
    checkField(value.targetRole);
    checkField(value.summary);
    checkField(value.skills);

    /* Experience */
    value.experiences?.forEach((exp: any) => {
      checkField(exp.company);
      checkField(exp.role);
      checkField(exp.duration);
      checkField(exp.responsibilities);
    });

    /* Projects */
    value.projects?.forEach((project: any) => {
      checkField(project.projectName);
      checkField(project.techStack);
      checkField(project.description);
    });

    /* Certifications */
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

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  startFreshResume(): void {
    this.resumeService.resetResumeData();

    const freshData =
      this.resumeService.getResumeData();

    this.initializeForm(freshData);

    this.currentStep = 1;
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  downloadPremiumPDF(): void {
    if (this.userPlan === 'free') {
      this.showUpgradeModal = true;
      return;
    }
    this.downloadPremium();

    //alert('Premium PDF Download Started');
  }

  downloadPremium(): void {

    this.isPremiumDownloading = true;

    this.downloadSuccessMessage = '';

    this.downloadErrorMessage = '';

    const latestData = {

      ...this.resumeService.getResumeData(),

      selectedTheme: this.selectedTheme

    };

    this.pdfService
      .saveResumeData(latestData)
      .subscribe({

        next: () => {

          this.pdfService
            .generatePremiumPdf()
            .subscribe({

              next: (response: Blob) => {

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

                const resumeFileName =
                  latestData.fullName?.trim()
                  || 'premium-resume';

                link.download =
                  `${resumeFileName
                    .replace(/\s+/g, '_')
                    .replace(/[^\w\-]/g, '')
                  }.pdf`;

                link.click();

                window.URL
                  .revokeObjectURL(url);

                this.isPremiumDownloading =
                  false;

                this.downloadSuccessMessage =
                  'Premium PDF downloaded';

                setTimeout(() => {

                  this.downloadSuccessMessage =
                    '';

                }, 2000);

              },

              error: (error) => {

                console.error(error);

                this.isPremiumDownloading =
                  false;

                this.downloadErrorMessage =
                  'Failed to generate premium PDF';

                setTimeout(() => {

                  this.downloadErrorMessage =
                    '';

                }, 3000);

              }

            });

        },

        error: (error) => {

          console.error(error);

          this.isPremiumDownloading =
            false;

          this.downloadErrorMessage =
            'Failed to generate premium PDF';

          setTimeout(() => {

            this.downloadErrorMessage =
              '';

          }, 3000);

        }

      });

  }

  closeUpgradeModal(): void {
    this.showUpgradeModal = false;
  }

  startPremiumUpgrade(
    planType: 'pro' | 'pro_plus'
  ): void {

    this.paymentService
      .startPremiumUpgrade(
        planType
      );

  }

  async loadUserPlanFromFirebase(): Promise<void> {
    const user = this.auth.currentUser;

    if (!user) return;

    const userRef = doc(
      this.firestore,
      `users/${user.uid}`
    );

    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const data: any = snapshot.data();

      if (
        data.paymentStatus === 'active' &&
        data.userPlan
      ) {
        const expiryDate = new Date(
          data.planExpiryDate
        );

        const today = new Date();

        if (expiryDate > today) {
          this.userPlan = data.userPlan;
        } else {
          this.userPlan = 'free';
        }
      }
    }
  }

  get aiSuggestions(): string[] {

    const suggestions: string[] = [];

    const data = this.resumeForm.value;

    /*
    SUMMARY CHECK
    */

    if (
      !data.summary ||
      data.summary.length < 120
    ) {

      suggestions.push(
        'Expand your professional summary with measurable achievements.'
      );

    }

    /*
    SKILLS CHECK
    */

    if (this.skillsArray.length < 8) {

      suggestions.push(
        'Add more technical keywords to improve ATS matching.'
      );

    }

    /*
    CERTIFICATIONS CHECK
    */

    const hasCertifications =
      data.certifications?.some(
        (cert: any) =>
          cert.certificationName?.trim()
      );

    if (!hasCertifications) {

      suggestions.push(
        'Add certifications to improve recruiter trust and ATS visibility.'
      );

    }

    /*
    PROJECTS CHECK
    */

    const hasProjects =
      data.projects?.some(
        (project: any) =>
          project.projectName?.trim()
      );

    if (!hasProjects) {

      suggestions.push(
        'Projects significantly improve recruiter engagement.'
      );

    }

    /*
    EXPERIENCE CHECK
    */

    const experienceCount =
      data.experiences?.filter(
        (exp: any) =>
          exp.role?.trim()
      )?.length || 0;

    if (experienceCount < 2) {

      suggestions.push(
        'Add more work experience details to strengthen your profile.'
      );

    }

    /*
    DEFAULT FALLBACK
    */

    if (suggestions.length === 0) {

      suggestions.push(
        'Your resume looks strong and recruiter-ready.'
      );

      suggestions.push(
        'ATS optimization score is looking excellent.'
      );

      suggestions.push(
        'Your resume has strong section completeness.'
      );

    }

    return suggestions.slice(0, 4);

  }

  get skillsArray(): string[] {

    const skills =
      this.resumeForm.value.skills || '';

    return skills
      .split(',')
      .map((skill: string) => skill.trim())
      .filter((skill: string) => skill.length > 0);

  }
}
