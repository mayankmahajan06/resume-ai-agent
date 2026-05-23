import { Component } from '@angular/core';
import { ResumeData } from '../../services/resume.service';
import { PdfService } from '../../services/pdf.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-premium-resume-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './premium-resume-print.component.html',
  styleUrls: ['./premium-resume-print.component.scss']
})
export class PremiumResumePrintComponent {

  resumeData!: ResumeData;

  selectedTheme = 'indigo';

  constructor(
    private pdfService: PdfService
  ) { }

  ngOnInit(): void {
    this.pdfService
      .getResumeData()
      .subscribe((data: any) => {
        this.resumeData = data;

        this.selectedTheme =
          data.selectedTheme || 'indigo';

        /*
        Wait for Angular render
        before Puppeteer captures PDF
        */
        setTimeout(() => {
          window.print();
        }, 500);
      });
  }

  get skillsArray(): string[] {
    if (!this.resumeData?.skills) {
      return [];
    }

    return this.resumeData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
  }

}
