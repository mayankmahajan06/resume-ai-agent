import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompactGridResumePrintComponent } from './compact-grid-resume-print.component';

describe('CompactGridResumePrintComponent', () => {
  let component: CompactGridResumePrintComponent;
  let fixture: ComponentFixture<CompactGridResumePrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompactGridResumePrintComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompactGridResumePrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
