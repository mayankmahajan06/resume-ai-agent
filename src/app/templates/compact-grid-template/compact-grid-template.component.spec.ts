import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompactGridTemplateComponent } from './compact-grid-template.component';

describe('CompactGridTemplateComponent', () => {
  let component: CompactGridTemplateComponent;
  let fixture: ComponentFixture<CompactGridTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompactGridTemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompactGridTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
