import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resume-validation-dialog',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './resume-validation-dialog.component.html',
  styleUrls: ['./resume-validation-dialog.component.scss']
})
export class ResumeValidationDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<ResumeValidationDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: {
      missingFields: string[]
    }
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

}