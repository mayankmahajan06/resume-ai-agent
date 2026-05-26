import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutiveLeftRailResumePrintComponent } from './executive-left-rail-resume-print';

describe('ExecutiveLeftRailResumePrintComponent', () => {
  let component: ExecutiveLeftRailResumePrintComponent;
  let fixture: ComponentFixture<ExecutiveLeftRailResumePrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExecutiveLeftRailResumePrintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExecutiveLeftRailResumePrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
