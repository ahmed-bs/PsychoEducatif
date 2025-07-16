import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStrategyModalComponent } from './add-strategy-modal.component';

describe('AddStrategyModalComponent', () => {
  let component: AddStrategyModalComponent;
  let fixture: ComponentFixture<AddStrategyModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddStrategyModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddStrategyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
