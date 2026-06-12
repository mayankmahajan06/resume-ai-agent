import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { MyResumesComponent } from './my-resumes.component';
import { ResumeService } from '../../services/resume.service';

describe('MyResumesComponent', () => {
  let component: MyResumesComponent;
  let resumeService: jasmine.SpyObj<ResumeService>;
  let router: jasmine.SpyObj<Router>;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    resumeService = jasmine.createSpyObj<ResumeService>(
      'ResumeService',
      [
        'getUserResumes',
        'createNewResume',
        'loadResumeForEditing',
        'duplicateResume',
        'deleteResume'
      ]
    );
    router = jasmine.createSpyObj<Router>(
      'Router',
      ['navigate']
    );
    dialog = jasmine.createSpyObj<MatDialog>(
      'MatDialog',
      ['open']
    );

    resumeService.getUserResumes.and.returnValue(of([]));
    resumeService.duplicateResume.and.resolveTo('copy-id');
    resumeService.deleteResume.and.resolveTo();

    component = new MyResumesComponent(
      resumeService,
      router,
      dialog
    );
  });

  it('loads a resume for editing and opens the builder', () => {
    const resume = {
      id: 'resume-id',
      resumeData: {}
    };

    component.editResume(resume);

    expect(
      resumeService.loadResumeForEditing
    ).toHaveBeenCalledOnceWith(resume);
    expect(router.navigate)
      .toHaveBeenCalledOnceWith(['/resume-builder']);
  });

  it('duplicates a resume once while the request is active', async () => {
    const resume = {
      id: 'resume-id',
      title: 'Frontend Resume',
      resumeData: {}
    };
    let resolveDuplicate!: (value: string) => void;

    resumeService.duplicateResume.and.returnValue(
      new Promise<string>((resolve) => {
        resolveDuplicate = resolve;
      })
    );

    const firstRequest = component.duplicateResume(resume);
    const secondRequest = component.duplicateResume(resume);

    expect(component.isDuplicating(resume.id)).toBeTrue();
    expect(resumeService.duplicateResume)
      .toHaveBeenCalledOnceWith(resume);

    resolveDuplicate('copy-id');
    await Promise.all([firstRequest, secondRequest]);

    expect(component.isDuplicating(resume.id)).toBeFalse();
  });

  it('deletes a resume after confirmation', async () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(true)
    } as any);

    await component.deleteResume('resume-id');
    await Promise.resolve();

    expect(resumeService.deleteResume)
      .toHaveBeenCalledOnceWith('resume-id');
  });

  it('keeps a resume when deletion is cancelled', async () => {
    dialog.open.and.returnValue({
      afterClosed: () => of(false)
    } as any);

    await component.deleteResume('resume-id');

    expect(resumeService.deleteResume)
      .not.toHaveBeenCalled();
  });
});
