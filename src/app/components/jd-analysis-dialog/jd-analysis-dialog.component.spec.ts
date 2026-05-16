import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JdAnalysisDialogComponent } from './jd-analysis-dialog.component';

describe('JdAnalysisDialogComponent', () => {
  let component: JdAnalysisDialogComponent;
  let fixture: ComponentFixture<JdAnalysisDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JdAnalysisDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JdAnalysisDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
