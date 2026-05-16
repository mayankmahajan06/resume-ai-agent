import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  private baseUrl =
    'http://localhost:3000';

  constructor(
    private http: HttpClient
  ) {}

  saveResumeData(data: any) {
    return this.http.post(
      `${this.baseUrl}/save-resume-data`,
      data
    );
  }

  generatePdf() {
    return this.http.get(
      `${this.baseUrl}/generate-pdf`,
      {
        responseType: 'blob'
      }
    );
  }

  getResumeData() {
    return this.http.get(
      `${this.baseUrl}/resume-data`
    );
  }
}