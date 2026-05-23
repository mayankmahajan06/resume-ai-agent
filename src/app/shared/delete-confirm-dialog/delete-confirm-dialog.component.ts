import { Component }
from '@angular/core';

import {
  MatDialogRef
} from '@angular/material/dialog';

import { MatIconModule }
from '@angular/material/icon';

@Component({
  selector:
    'app-delete-confirm-dialog',

  standalone: true,

  imports: [
    MatIconModule
  ],

  templateUrl:
    './delete-confirm-dialog.component.html',

  styleUrls: [
    './delete-confirm-dialog.component.scss'
  ]
})
export class DeleteConfirmDialogComponent {

  constructor(
    private dialogRef:
      MatDialogRef<
        DeleteConfirmDialogComponent
      >
  ) { }

  close(): void {

    this.dialogRef.close(
      false
    );

  }

  confirmDelete(): void {

    this.dialogRef.close(
      true
    );

  }

}