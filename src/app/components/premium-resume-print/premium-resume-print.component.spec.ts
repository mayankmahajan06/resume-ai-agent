import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PremiumResumePrintComponent } from './premium-resume-print.component';

describe('PremiumResumePrintComponent', () => {
  let component: PremiumResumePrintComponent;
  let fixture: ComponentFixture<PremiumResumePrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremiumResumePrintComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PremiumResumePrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
