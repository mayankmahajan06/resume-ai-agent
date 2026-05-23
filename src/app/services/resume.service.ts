import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { Auth } from '@angular/fire/auth';
import {
  collectionData,
  deleteDoc,
  orderBy,
  query
} from '@angular/fire/firestore';

import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp
} from '@angular/fire/firestore';

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
  resumeId?: string;
  selectedTemplate?: string;

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

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) { }

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
    resumeId: '',

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
   SAVE OR UPDATE RESUME
===================================== */

  async saveResume(): Promise<void> {

    const user =
      this.auth.currentUser;

    if (!user) {

      throw new Error(
        'User not logged in'
      );

    }

    const currentResumeData =
      this.getResumeData();

    /*
    =====================================
    UPDATE EXISTING RESUME
    =====================================
    */

    if (currentResumeData.resumeId) {

      const resumeDocRef =
        doc(
          this.firestore,
          `users/${user.uid}/resumes/${currentResumeData.resumeId}`
        );

      await updateDoc(
        resumeDocRef,
        {

          title:
            currentResumeData.currentRole ||
            'Untitled Resume',

          resumeData:
            currentResumeData,

          selectedTheme:
            currentResumeData.selectedTheme,

          updatedAt:
            serverTimestamp()

        }
      );

      return;

    }

    /*
    =====================================
    CREATE NEW RESUME
    =====================================
    */

    const resumesCollection =
      collection(
        this.firestore,
        `users/${user.uid}/resumes`
      );

    const docRef =
      await addDoc(
        resumesCollection,
        {

          title:
            currentResumeData.currentRole ||
            'Untitled Resume',

          resumeData:
            currentResumeData,

          selectedTheme:
            currentResumeData.selectedTheme,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );

    /*
    =====================================
    STORE RESUME ID
    =====================================
    */

    this.updateResumeData({

      resumeId:
        docRef.id

    });

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

  /* =====================================
   GET USER RESUMES
===================================== */

  getUserResumes(): Observable<any[]> {

    const user =
      this.auth.currentUser;

    if (!user) {

      throw new Error(
        'User not logged in'
      );

    }

    const resumesCollection =
      collection(
        this.firestore,
        `users/${user.uid}/resumes`
      );

    const resumesQuery =
      query(
        resumesCollection,
        orderBy(
          'updatedAt',
          'desc'
        )
      );

    return collectionData(
      resumesQuery,
      {
        idField: 'id'
      }
    ) as Observable<any[]>;

  }

  createNewResume(): void {
    this.resetResumeData();
  }

  loadResumeForEditing(
    resume: any
  ): void {

    const resumeData = {
      ...resume.resumeData,
      resumeId: resume.id
    };

    this.resumeDataSubject.next(
      resumeData
    );

    localStorage.setItem(
      'resumeData',
      JSON.stringify(resumeData)
    );

  }

  async deleteResume(
    resumeId: string
  ): Promise<void> {

    const user =
      this.auth.currentUser;

    if (!user) {
      return;
    }

    const resumeDocRef =
      doc(
        this.firestore,
        `users/${user.uid}/resumes/${resumeId}`
      );

    await deleteDoc(
      resumeDocRef
    );

  }
}