import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModernResumePrintComponent } from './modern-resume-print.component';

describe('ModernResumePrintComponent', () => {
  let component: ModernResumePrintComponent;
  let fixture: ComponentFixture<ModernResumePrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModernResumePrintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModernResumePrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
