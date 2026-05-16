import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumeValidationDialogComponent } from './resume-validation-dialog.component';

describe('ResumeValidationDialogComponent', () => {
  let component: ResumeValidationDialogComponent;
  let fixture: ComponentFixture<ResumeValidationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeValidationDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResumeValidationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
