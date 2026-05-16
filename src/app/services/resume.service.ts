// src/app/services/resume.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Experience {
  company: string;
  role: string;
  duration: string;
  responsibilities: string;
}

export interface Project {
  projectName: string;
  techStack: string;
  description: string;
}

export interface Certification {
  certificationName: string;
}

export interface Education {
  degree: string;
  college: string;
  graduationYear: string;
  cgpa: string;
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  currentRole: string;
  targetRole: string;
  summary: string;
  selectedTheme: string;

  experiences: Experience[];
  projects: Project[];
  certifications: Certification[];
  education: Education[];

  skills: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResumeService {

  /* =====================================
     EMPTY INITIAL STATE
  ===================================== */

  private initialData: ResumeData = {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedIn: '',
    currentRole: '',
    targetRole: '',
    summary: '',
    selectedTheme: 'indigo',

    experiences: [
      {
        company: '',
        role: '',
        duration: '',
        responsibilities: ''
      }
    ],

    projects: [
      {
        projectName: '',
        techStack: '',
        description: ''
      }
    ],

    certifications: [
      {
        certificationName: ''
      }
    ],
    education: [
      {
        degree: '',
        college: '',
        graduationYear: '',
        cgpa: ''
      }
    ],

    skills: ''
  };

  private resumeDataSubject =
    new BehaviorSubject<ResumeData>(
      this.getStoredResumeData()
    );

  resumeData$ =
    this.resumeDataSubject.asObservable();

  /* =====================================
     GET CURRENT DATA
  ===================================== */

  getResumeData(): ResumeData {
    return this.resumeDataSubject.value;
  }

  /* =====================================
     UPDATE DATA
  ===================================== */

  updateResumeData(
    data: Partial<ResumeData>
  ): void {
    const currentData =
      this.resumeDataSubject.value;

    const updatedData = {
      ...currentData,
      ...data
    };

    this.resumeDataSubject.next(
      updatedData
    );

    localStorage.setItem(
      'resumeData',
      JSON.stringify(updatedData)
    );
  }

  /* =====================================
     RESET DATA
  ===================================== */

  resetResumeData(): void {
    localStorage.removeItem(
      'resumeData'
    );

    this.resumeDataSubject.next(
      this.initialData
    );
  }

  private getStoredResumeData(): ResumeData {
    const savedData =
      localStorage.getItem('resumeData');

    return savedData
      ? JSON.parse(savedData)
      : this.initialData;
  }
}