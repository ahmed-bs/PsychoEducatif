/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { Pick_profileComponent } from './pick_profile.component';

describe('Pick_profileComponent', () => {
  let component: Pick_profileComponent;
  let fixture: ComponentFixture<Pick_profileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Pick_profileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Pick_profileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
