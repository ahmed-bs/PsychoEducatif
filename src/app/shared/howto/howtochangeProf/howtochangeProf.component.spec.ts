/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HowtochangeProfComponent } from './howtochangeProf.component';

describe('HowtochangeProfComponent', () => {
  let component: HowtochangeProfComponent;
  let fixture: ComponentFixture<HowtochangeProfComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HowtochangeProfComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HowtochangeProfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
