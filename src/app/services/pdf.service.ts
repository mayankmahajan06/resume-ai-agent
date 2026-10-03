import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Auth } from '@angular/fire/auth';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {}

  private async getAuthHeaders(): Promise<HttpHeaders> {
    const user = this.auth.currentUser;

    if (!user) {
      throw new Error('User not logged in');
    }

    const token = await user.getIdToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  saveResumeData(data: any) {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers =>
        this.http.post(
          `${environment.apiBaseUrl}/save-resume-data`,
          data,
          { headers }
        )
      )
    );
  }

  generatePdf() {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers =>
        this.http.get(
          `${environment.apiBaseUrl}/generate-pdf`,
          {
            headers,
            responseType: 'blob'
          }
        )
      )
    );
  }

  generatePremiumPdf() {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers =>
        this.http.get(
          `${environment.apiBaseUrl}/generate-premium-pdf`,
          {
            headers,
            responseType: 'blob'
          }
        )
      )
    );
  }

  getResumeData() {
    const user = this.auth.currentUser;

    // Browser: send Firebase auth.
    // Puppeteer print page: there is no Firebase session, so the backend
    // request interceptor adds the internal render credentials server-side.
    if (!user) {
      return this.http.get(
        `${environment.apiBaseUrl}/resume-data`
      );
    }

    return from(user.getIdToken()).pipe(
      switchMap(token =>
        this.http.get(
          `${environment.apiBaseUrl}/resume-data`,
          {
            headers: new HttpHeaders({
              Authorization: `Bearer ${token}`
            })
          }
        )
      )
    );
  }

  analyzeJD(
    resumeData: any,
    jobDescription: string
  ) {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers =>
        this.http.post(
          `${environment.apiBaseUrl}/analyze-jd`,
          {
            resumeData,
            jobDescription
          },
          { headers }
        )
      )
    );
  }

  verifyPayment(paymentResponse: any) {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers =>
        this.http.post(
          `${environment.apiBaseUrl}/verify-payment`,
          paymentResponse,
          { headers }
        )
      )
    );
  }
}
