/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { Kids_profilesComponent } from './kids_profiles.component';

describe('Kids_profilesComponent', () => {
  let component: Kids_profilesComponent;
  let fixture: ComponentFixture<Kids_profilesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Kids_profilesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Kids_profilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
