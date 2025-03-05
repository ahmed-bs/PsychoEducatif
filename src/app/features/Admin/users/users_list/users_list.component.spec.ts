/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { Users_listComponent } from './users_list.component';

describe('Users_listComponent', () => {
  let component: Users_listComponent;
  let fixture: ComponentFixture<Users_listComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Users_listComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Users_listComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
