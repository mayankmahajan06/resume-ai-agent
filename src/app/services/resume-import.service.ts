import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ResumeData } from './resume.service';
import { Auth } from '@angular/fire/auth';

export interface ResumeImportResponse {
  success: boolean;
  resumeData: ResumeData;
  metadata?: {
    pages?: number;
    textLength?: number;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResumeImportService {

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) { }

  importResume(
    file: File
  ): Observable<ResumeImportResponse> {
    const formData = new FormData();

    formData.append(
      'resume',
      file
    );

    return from(this.auth.currentUser?.getIdToken(true) || Promise.reject(
      new Error('User not logged in')
    )).pipe(
      switchMap(token =>
        this.http.post<ResumeImportResponse>(
          `${environment.apiBaseUrl}/api/resume/import`,
          formData,
          {
            headers: new HttpHeaders({
              Authorization: `Bearer ${token}`
            })
          }
        )
      )
    );
  }
}
