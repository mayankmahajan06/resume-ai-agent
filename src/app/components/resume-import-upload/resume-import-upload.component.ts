import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-resume-import-upload',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './resume-import-upload.component.html',
  styleUrls: ['./resume-import-upload.component.scss']
})
export class ResumeImportUploadComponent {

  @Input() isUploading = false;

  @Output() resumeSelected =
    new EventEmitter<File>();

  onFileSelected(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (file) {
      this.resumeSelected.emit(file);
    }

    input.value = '';
  }
}
