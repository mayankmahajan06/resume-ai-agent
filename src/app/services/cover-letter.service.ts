import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';
import { environment } from '../../environments/environment';

export interface CoverLetterResponse {
  success: boolean;
  content?: string;
  message?: string;
  quota?: {
    used: number;
    limit: number;
    period: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CoverLetterService {

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {}

  generate(
    file: File,
    jobTitle: string,
    companyName: string,
    jobDescription: string,
    tone: string
  ): Observable<CoverLetterResponse> {
    const formData = new FormData();

    formData.append('resume', file);
    formData.append('jobTitle', jobTitle);
    formData.append('companyName', companyName);
    formData.append('jobDescription', jobDescription);
    formData.append('tone', tone);

    return from(
      this.auth.currentUser?.getIdToken(true) ||
      Promise.reject(new Error('User not logged in'))
    ).pipe(
      switchMap(token =>
        this.http.post<CoverLetterResponse>(
          `${environment.apiBaseUrl}/generate-cover-letter`,
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

  downloadPdf(
    content: string,
    template: 'classic' | 'modern' | 'minimal'
  ): Observable<Blob> {
    return from(
      this.auth.currentUser?.getIdToken(true) ||
      Promise.reject(new Error('User not logged in'))
    ).pipe(
      switchMap(token =>
        this.http.post(
          `${environment.apiBaseUrl}/generate-cover-letter-pdf`,
          {
            content,
            template
          },
          {
            headers: new HttpHeaders({
              Authorization: `Bearer ${token}`
            }),
            responseType: 'blob'
          }
        )
      )
    );
  }
}
