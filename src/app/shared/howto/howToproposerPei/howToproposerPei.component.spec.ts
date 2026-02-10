/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HowToproposerPeiComponent } from './howToproposerPei.component';

describe('HowToproposerPeiComponent', () => {
  let component: HowToproposerPeiComponent;
  let fixture: ComponentFixture<HowToproposerPeiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HowToproposerPeiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HowToproposerPeiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
