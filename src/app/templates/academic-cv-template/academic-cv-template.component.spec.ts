import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicCvTemplateComponent } from './academic-cv-template.component';

describe('AcademicCvTemplateComponent', () => {
  let component: AcademicCvTemplateComponent;
  let fixture: ComponentFixture<AcademicCvTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicCvTemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AcademicCvTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
