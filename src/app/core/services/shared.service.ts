import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  // For Desktop Sidebar Collapse (triggered by the main layout / desktop menu icon)
  private sidebarToggleSubject = new Subject<void>();
  sidebarToggle$ = this.sidebarToggleSubject.asObservable();

  // For Mobile Off-Canvas Menu Visibility (triggered by mobile hamburger icon)
  private mobileMenuToggleSubject = new Subject<void>();
  mobileMenuToggle$ = this.mobileMenuToggleSubject.asObservable();


  constructor() {
    // You might want to initialize the desktop sidebar state based on screen size here
    // For simplicity, let's assume user-layout handles initial sizing based on HostListener.
  }

  // Method to toggle the desktop sidebar (collapse/expand)
  toggleSidebar(): void {
    this.sidebarToggleSubject.next();
  }

  // Method to toggle the mobile off-canvas menu (show/hide)
  toggleMobileMenu(): void {
    this.mobileMenuToggleSubject.next();
  }
}