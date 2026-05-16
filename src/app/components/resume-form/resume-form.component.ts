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
  ResumeService
} from '../../services/resume.service';

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

  aiSuggestions = [
    'Add measurable achievements in recent experience',
    'Include leadership keywords for stronger recruiter confidence',
    'Add one more certification to improve ATS visibility',
    'Use stronger action verbs in project descriptions'
  ];

  resumeForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private resumeService: ResumeService
  ) { }

  ngOnInit(): void {
    const data = this.resumeService.getResumeData();

    this.resumeForm = this.fb.group({
      /* Personal Info */
      fullName: [data.fullName || ''],
      email: [data.email || ''],
      phone: [data.phone || ''],
      location: [data.location || ''],
      linkedIn: [data.linkedIn || ''],
      currentRole: [data.currentRole || ''],
      targetRole: [data.targetRole || ''],
      summary: [data.summary || ''],

      /* Skills */
      skills: [data.skills || ''],

      /* Experience */
      experiences: this.fb.array(
        data.experiences?.length
          ? data.experiences.map(exp =>
            this.fb.group({
              company: [exp.company || ''],
              role: [exp.role || ''],
              duration: [exp.duration || ''],
              responsibilities: [exp.responsibilities || '']
            })
          )
          : [this.createExperience()]
      ),

      /* Projects */
      projects: this.fb.array(
        data.projects?.length
          ? data.projects.map(project =>
            this.fb.group({
              projectName: [project.projectName || ''],
              techStack: [project.techStack || ''],
              description: [project.description || '']
            })
          )
          : [this.createProject()]
      ),

      /* Certifications */
      certifications: this.fb.array(
        data.certifications?.length
          ? data.certifications.map(cert =>
            this.fb.group({
              certificationName: [cert.certificationName || '']
            })
          )
          : [this.createCertification()]
      ),
      education: this.fb.array(
        data.education?.length
          ? data.education.map(edu =>
            this.fb.group({
              degree: [edu.degree || ''],
              college: [edu.college || ''],
              graduationYear: [edu.graduationYear || ''],
              cgpa: [edu.cgpa || '']
            })
          )
          : [this.createEducation()]
      ),
    });

    /* Live Binding */
    this.resumeForm.valueChanges.subscribe((value) => {
      this.resumeService.updateResumeData(value);
      this.calculateProfileCompletion(value);
    });

    /* Initial calculation */
    this.calculateProfileCompletion(this.resumeForm.value);
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
    this.resumeForm.reset();
    this.currentStep = 1;
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }
}