/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { Profiles_listComponent } from './profiles_list.component';

describe('Profiles_listComponent', () => {
  let component: Profiles_listComponent;
  let fixture: ComponentFixture<Profiles_listComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Profiles_listComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Profiles_listComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
