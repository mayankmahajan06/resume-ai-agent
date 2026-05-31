import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor(
    private http: HttpClient
  ) { }

  saveResumeData(data: any) {
    return this.http.post(
      `${environment.apiBaseUrl}/save-resume-data`,
      data
    );
  }

  generatePdf() {
    return this.http.get(
      `${environment.apiBaseUrl}/generate-pdf`,
      {
        responseType: 'blob'
      }
    );
  }

  generatePremiumPdf() {
    return this.http.get(
      `${environment.apiBaseUrl}/generate-premium-pdf`,
      {
        responseType: 'blob'
      }
    );
  }

  getResumeData() {
    return this.http.get(
      `${environment.apiBaseUrl}/resume-data`
    );
  }

  analyzeJD(
    resumeData: any,
    jobDescription: string
  ) {

    return this.http.post(
      `${environment.apiBaseUrl}/analyze-jd`,
      {
        resumeData,
        jobDescription
      }
    );

  }

  verifyPayment(paymentResponse: any) {
    return this.http.post(
      `${environment.apiBaseUrl}/verify-payment`,
      paymentResponse
    );
  }
}
