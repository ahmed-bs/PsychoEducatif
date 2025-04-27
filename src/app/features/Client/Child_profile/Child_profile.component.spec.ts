/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { Child_profileComponent } from './Child_profile.component';

describe('Child_profileComponent', () => {
  let component: Child_profileComponent;
  let fixture: ComponentFixture<Child_profileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Child_profileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Child_profileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
