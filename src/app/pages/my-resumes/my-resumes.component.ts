import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { AuthService }
  from '../../services/auth.service';

import { UserService }
  from '../../services/user.service';

import { ResumeService }
  from '../../services/resume.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteConfirmDialogComponent } from '../../shared/delete-confirm-dialog/delete-confirm-dialog.component';
import { WorkspaceHeaderComponent } from '../../shared/workspace-header/workspace-header.component';

@Component({
  selector: 'app-my-resumes',

  standalone: true,

  imports: [
    CommonModule,
    MatIconModule,
    WorkspaceHeaderComponent
  ],

  templateUrl: './my-resumes.component.html',

  styleUrls: ['./my-resumes.component.scss']
})
export class MyResumesComponent
  implements OnInit {

  resumes: any[] = [];

  loading = true;

  constructor(
    private resumeService: ResumeService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  /*
  ========================================
  INIT
  ========================================
  */

  ngOnInit(): void {
    this.loadResumes();

  }

  /*
  ========================================
  LOAD RESUMES
  ========================================
  */

  loadResumes(): void {

    this.resumeService
      .getUserResumes()
      .subscribe({

        next: (resumes) => {

          this.resumes = resumes;
          console.log(this.resumes);

          this.loading = false;

        },

        error: (error) => {

          console.error(error);

          this.loading = false;

        }

      });

  }

  /*
  ========================================
  CREATE NEW RESUME
  ========================================
  */

  createNewResume(): void {

    this.resumeService
      .createNewResume();

    this.router.navigate([
      '/resume-builder'
    ]);

  }

  navigateToResumeBuilder(): void {
    this.router.navigate([
      '/resume-builder'
    ]);
  }

  editResume(
    resume: any
  ): void {

    this.resumeService
      .loadResumeForEditing(
        resume
      );

    this.router.navigate([
      '/resume-builder'
    ]);

  }

  async deleteResume(
    resumeId: string
  ): Promise<void> {

    const dialogRef =
      this.dialog.open(
        DeleteConfirmDialogComponent,
        {
          width: '420px',
          autoFocus: false
        }
      );

    dialogRef
      .afterClosed()
      .subscribe(async (confirmed) => {

        if (!confirmed) {
          return;
        }

        try {

          await this.resumeService
            .deleteResume(
              resumeId
            );

        } catch (error) {

          console.error(error);

        }

      });

  }

}