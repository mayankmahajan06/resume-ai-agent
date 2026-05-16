import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PdfService } from '../../services/pdf.service';
import {
  ResumeData
} from '../../services/resume.service';

@Component({
  selector: 'app-resume-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resume-print.component.html',
  styleUrls: ['./resume-print.component.scss']
})
export class ResumePrintComponent implements OnInit {

  resumeData!: ResumeData;

  selectedTheme = 'indigo';

  constructor(
    private pdfService: PdfService
  ) {}

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