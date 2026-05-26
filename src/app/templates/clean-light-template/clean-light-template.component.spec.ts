import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CleanLightTemplateComponent } from './clean-light-template.component';

describe('CleanLightTemplateComponent', () => {
  let component: CleanLightTemplateComponent;
  let fixture: ComponentFixture<CleanLightTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CleanLightTemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CleanLightTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
