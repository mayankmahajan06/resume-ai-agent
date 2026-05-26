import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandInnovatorTemplateComponent } from './brand-innovator-template.component';

describe('BrandInnovatorTemplateComponent', () => {
  let component: BrandInnovatorTemplateComponent;
  let fixture: ComponentFixture<BrandInnovatorTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandInnovatorTemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BrandInnovatorTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
