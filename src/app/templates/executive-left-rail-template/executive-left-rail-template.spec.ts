import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutiveLeftRailTemplateComponent } from './executive-left-rail-template';

describe('ExecutiveLeftRailTemplateComponent', () => {
  let component: ExecutiveLeftRailTemplateComponent;
  let fixture: ComponentFixture<ExecutiveLeftRailTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExecutiveLeftRailTemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExecutiveLeftRailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
