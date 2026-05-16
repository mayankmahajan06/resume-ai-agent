import { Component } from '@angular/core';
import { ResumeFormComponent } from '../../components/resume-form/resume-form.component';
import { ResumePreviewComponent } from '../../components/resume-preview/resume-preview.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-resume-builder',
  standalone: true,
  imports: [CommonModule, MatIconModule, ResumeFormComponent, ResumePreviewComponent],
  templateUrl: './resume-builder.component.html',
  styleUrls: ['./resume-builder.component.scss']
})
export class ResumeBuilderComponent {

}
