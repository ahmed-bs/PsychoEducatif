/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { Add_popupComponent } from './add_popup.component';

describe('Add_popupComponent', () => {
  let component: Add_popupComponent;
  let fixture: ComponentFixture<Add_popupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Add_popupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Add_popupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
