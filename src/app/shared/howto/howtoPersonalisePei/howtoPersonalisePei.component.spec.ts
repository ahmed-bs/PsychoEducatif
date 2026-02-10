/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HowtoPersonalisePeiComponent } from './howtoPersonalisePei.component';

describe('HowtoPersonalisePeiComponent', () => {
  let component: HowtoPersonalisePeiComponent;
  let fixture: ComponentFixture<HowtoPersonalisePeiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HowtoPersonalisePeiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HowtoPersonalisePeiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
