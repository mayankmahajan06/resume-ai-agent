import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ResumeData } from './resume.service';

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
    private http: HttpClient
  ) { }

  importResume(
    file: File
  ): Observable<ResumeImportResponse> {
    const formData = new FormData();

    formData.append(
      'resume',
      file
    );

    return this.http.post<ResumeImportResponse>(
      `${environment.apiBaseUrl}/api/resume/import`,
      formData
    );
  }
}
