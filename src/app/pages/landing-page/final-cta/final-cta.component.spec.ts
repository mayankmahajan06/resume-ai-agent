import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalCtaComponent } from './final-cta.component';

describe('FinalCtaComponent', () => {
  let component: FinalCtaComponent;
  let fixture: ComponentFixture<FinalCtaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalCtaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FinalCtaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
