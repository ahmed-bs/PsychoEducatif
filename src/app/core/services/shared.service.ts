// shared.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private sidebarToggleSubject = new Subject<void>();

  sidebarToggle$ = this.sidebarToggleSubject.asObservable();

  toggleSidebar(): void {
    this.sidebarToggleSubject.next();
  }
}
