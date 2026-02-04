import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { ProfileService } from 'src/app/core/services/profile.service';
import { Profile } from 'src/app/core/models/profile.model';
import { CreateProfileRequest, UpdateProfileRequest } from 'src/app/core/models/createprofile.model';
import { AuthService } from 'src/app/core/services/authService.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-pick_profile',
  templateUrl: './pick_profile.component.html',
  styleUrls: ['./pick_profile.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    InputTextareaModule,
    TranslateModule
  ]
})
export class PickProfileComponent implements OnInit, OnDestroy {
  children: Profile[] = [];
  filteredChildren: Profile[] = [];
  displayedChildren: Profile[] = []; // Cards currently visible (max 3)
  currentCardIndex: number = 0; // Starting index for displayed cards
  searchTerm: string = '';
  isNavigating: boolean = false; // Track navigation state for animation
  navigationDirection: 'left' | 'right' | null = null; // Track navigation direction
  scrollOffset: number = 0; // Track scroll position for animation
  displayDialog: boolean = false;
  updatedisplayDialog: boolean = false;
  isEditMode: boolean = false;
  newChild: Profile = this.resetChild();
  selectedFile: File | null = null;
  selectedChild: Profile = {
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'M',
    diagnosis: '',
    notes: ''
  };
  profileForm: CreateProfileRequest | UpdateProfileRequest = {
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'M',
    diagnosis: '',
    notes: ''
  };
  isLoading: boolean = false;
  birthDate: Date | null = null;
  genderOptions = [
    { label: this.translate.instant('add_child_dialog.gender_options.male'), value: 'M' },
    { label: this.translate.instant('add_child_dialog.gender_options.female'), value: 'F' }
  ];
  parentId: number = 0;
  error: string | null = null;
  userName: string = '';
  private languageSubscription!: Subscription;
  currentLang: string = 'fr';
  showLanguageMenu: boolean = false;
  dropdownPosition: { top: string; right: string } = { top: '0px', right: '0px' };
  
  // 3D Carousel properties
  rotationAngle: number = 0;
  isDragging: boolean = false;
  startX: number = 0;
  startY: number = 0;
  currentX: number = 0;
  rotationSpeed: number = 0.5; // Adjust rotation sensitivity
  touchStartTime: number = 0; // Track touch start time
  hasMoved: boolean = false; // Track if user actually dragged
  touchThreshold: number = 10; // Minimum pixels to move before considering it a drag

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    private profileService: ProfileService,
    private router: Router,
    private sharedService: SharedService
  ) {
    const user = localStorage.getItem('user');
    this.parentId = user ? Number(JSON.parse(user).id) : 0;

    // Initialize translation
    this.translate.addLangs(['fr', 'ar', 'en']);
    this.translate.setDefaultLang('fr');
    
    // Get current language from shared service
    const currentLang = this.sharedService.getCurrentLanguage();
    this.translate.use(currentLang);

    // Update gender options with translated labels
    this.updateGenderOptions();
  }

  ngOnInit() {
    // Re-read parentId from localStorage to ensure we have the latest data
    // This fixes the issue where the component might initialize before user data is saved
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        this.parentId = userData?.id ? Number(userData.id) : 0;
      } catch (e) {
        console.error('Error parsing user data:', e);
        this.parentId = 0;
      }
    } else {
      this.parentId = 0;
    }

    if (!this.parentId) {
      this.translate.get(['profile_messages.load_user_error.title', 'profile_messages.load_user_error.text']).subscribe(translations => {
        Swal.fire({
          icon: 'error',
          title: translations['profile_messages.load_user_error.title'],
          html: `<div class="error-warning">
                  <i class="fas fa-exclamation-triangle warning-icon"></i>
                  <p>${translations['profile_messages.load_user_error.text']}</p>
                </div>`,
          width: '700px',
          confirmButtonColor: '#4da5d8',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'terms-popup error-popup',
            title: 'terms-title',
            htmlContainer: 'terms-html-container',
            confirmButton: 'terms-confirm-button'
          },
          allowOutsideClick: true
        });
      });
      return;
    }
    // Get username from localStorage and format it properly
    if (user) {
      const userData = JSON.parse(user);
      let name = userData.username || '';
      // If username looks like an email prefix (contains underscore and numbers), try to format it
      if (name.includes('_') && /_\d+/.test(name)) {
        // Extract the part before the underscore and capitalize it
        name = name.split('_')[0];
        name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      } else if (name) {
        // Capitalize first letter of each word
        name = name.split(' ').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
      }
      this.userName = name || 'Utilisateur';
    } else {
      this.userName = this.authService.currentUserValue?.username || 'Utilisateur';
    }
    this.loadChildren();
    
    // Initialize language
    const savedLang = localStorage.getItem('lang') || 'fr';
    this.currentLang = savedLang;
    this.translate.use(this.currentLang);
    
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.currentLang = lang;
      this.translate.use(lang);
      this.updateGenderOptions();
    });

    // Mobile menu toggle removed - navbar is always visible on mobile/tablet
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
    // Clean up event listeners
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
  }

  private updateGenderOptions() {
    this.genderOptions = [
      { label: this.translate.instant('add_child_dialog.gender_options.male'), value: 'M' },
      { label: this.translate.instant('add_child_dialog.gender_options.female'), value: 'F' }
    ];
  }

  setDefaultImage(event: any, child: Profile) {
    let defaultImg = '';
    if (child.gender === 'F') {
      if (child.category === 'Toddler') defaultImg = '/assets/image_client/image copy 2.png';
      else if (child.category === 'Young Child') defaultImg = '/assets/image_client/image copy 6.png';
      else if (child.category === 'Young Adult') defaultImg = '/assets/image_client/image copy 8.png';
    } else {
      if (child.category === 'Toddler') defaultImg = '/assets/image_client/image copy 3.png';
      else if (child.category === 'Young Child') defaultImg = '/assets/image_client/image copy 5.png';
      else if (child.category === 'Young Adult') defaultImg = '/assets/image_client/image copy 7.png';
    }
    event.target.src = defaultImg || '/assets/image_client/image copy 2.png';
  }

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = (event.currentTarget as HTMLElement);
    dropZone.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = (event.currentTarget as HTMLElement);
    dropZone.classList.remove('drag-over');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = (event.currentTarget as HTMLElement);
    dropZone.classList.remove('drag-over');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  resetChild(): Profile {
    return {
      first_name: '',
      last_name: '',
      birth_date: '',
      diagnosis: '',
      notes: '',
      evaluation_score: 0,
      objectives: [],
      progress: this.translate.instant('add_child_dialog.progress_default'),
      recommended_strategies: [],
      image_url: '',
      is_active: true
    };
  }

  loadChildren() {
    this.profileService.getProfilesByParent(this.parentId).subscribe({
      next: (children) => {
        // Handle both array and single object responses
        const childrenArray = Array.isArray(children) ? children : (children ? [children] : []);
        
        this.children = childrenArray.map(child => {
          let imageUrl = (child as any).image || child.image_url;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${environment.apiUrl.slice(0, -1)}${imageUrl}`;
          }
          return {
            ...child,
            image_url: imageUrl
          };
        });
        this.filteredChildren = [...this.children];
        this.currentCardIndex = 0;
        this.updateDisplayedChildren();
        // Reset rotation when children are loaded
        this.rotationAngle = 0;
      },
      error: (err) => {
        // Only show error for actual server/network errors (500+), not for "no profiles" cases
        // Suppress all 4xx errors (400, 401, 403, 404, etc.) as they typically mean "no profiles" or client issues
        const status = err?.status || err?.error?.status;
        const isServerError = status && status >= 500;
        const isNetworkError = !status && (err?.message?.includes('Network') || err?.message?.includes('network'));
        
        // Only show error for actual server errors (500+) or network failures
        // Suppress all other errors (including 404, 400, etc.) as they likely mean "no profiles"
        if (isServerError || isNetworkError) {
          this.translate.get(['profile_messages.load_profiles_error.title', 'profile_messages.load_profiles_error.text']).subscribe(translations => {
            Swal.fire({
              icon: 'error',
              title: translations['profile_messages.load_profiles_error.title'],
              html: `<div class="error-warning">
                      <i class="fas fa-exclamation-triangle warning-icon"></i>
                      <p>${translations['profile_messages.load_profiles_error.text']}</p>
                    </div>`,
              width: '700px',
              confirmButtonColor: '#4da5d8',
              confirmButtonText: 'OK',
              customClass: {
                popup: 'terms-popup error-popup',
                title: 'terms-title',
                htmlContainer: 'terms-html-container',
                confirmButton: 'terms-confirm-button'
              },
              allowOutsideClick: true
            });
          });
        }
        // For all other cases (404, 400, etc.), just set empty arrays silently (no error message)
        this.children = [];
        this.filteredChildren = [];
        this.displayedChildren = [];
      }
    });
  }

  filterChildren() {
    if (!this.searchTerm) {
      this.filteredChildren = [...this.children];
    } else {
      this.filteredChildren = this.children.filter(child =>
        `${child.first_name} ${child.last_name}`
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase())
      );
    }
    // Reset to first card when filtering
    this.currentCardIndex = 0;
    this.updateDisplayedChildren();
    // Reset rotation when filtering
    this.rotationAngle = 0;
  }

  updateDisplayedChildren() {
    // No transform animation - cards will display normally
    // Keep scrollOffset for potential future use, but don't apply transform
    this.scrollOffset = 0;
  }

  navigateLeft() {
    if (this.filteredChildren.length === 0 || this.isNavigating) {
      return;
    }
    
    this.isNavigating = true;
    this.navigationDirection = 'left';
    
    // Calculate angle step for one card position
    const angleStep = 360 / this.filteredChildren.length;
    // Rotate left (positive rotation in 3D space)
    this.rotationAngle += angleStep;
    
    // Reset animation state after transition completes
    setTimeout(() => {
      this.isNavigating = false;
      this.navigationDirection = null;
    }, 400);
  }

  navigateRight() {
    if (this.filteredChildren.length === 0 || this.isNavigating) {
      return;
    }
    
    this.isNavigating = true;
    this.navigationDirection = 'right';
    
    // Calculate angle step for one card position
    const angleStep = 360 / this.filteredChildren.length;
    // Rotate right (negative rotation in 3D space)
    this.rotationAngle -= angleStep;
    
    // Reset animation state after transition completes
    setTimeout(() => {
      this.isNavigating = false;
      this.navigationDirection = null;
    }, 400);
  }

  get canNavigateLeft(): boolean {
    return this.filteredChildren.length > 3;
  }

  get canNavigateRight(): boolean {
    return this.filteredChildren.length > 3;
  }

  get showNavigationArrows(): boolean {
    return this.filteredChildren.length > 1;
  }

  // 3D Carousel methods
  getCardTransform(index: number): string {
    if (this.filteredChildren.length === 0) return '';
    const angleStep = 360 / this.filteredChildren.length;
    const angle = index * angleStep;
    // Adjust radius based on number of cards for better visibility
    const baseRadius = 200;
    const radius = this.filteredChildren.length <= 5 ? baseRadius : baseRadius * 0.9;
    return `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px)`;
  }

  getCardAnimationDelay(index: number): number {
    if (this.filteredChildren.length === 0) return 0;
    const totalDuration = 20;
    const delayStep = totalDuration / this.filteredChildren.length;
    return -(index * delayStep);
  }

  // Snap to nearest card position after swipe/glide
  snapToNearestCard(): void {
    if (this.filteredChildren.length === 0) return;
    
    const angleStep = 360 / this.filteredChildren.length;
    
    // Normalize rotation angle to 0-360 range for calculation
    let normalizedAngle = this.rotationAngle % 360;
    if (normalizedAngle < 0) {
      normalizedAngle += 360;
    }
    
    // Find the nearest card position (0 to filteredChildren.length - 1)
    let nearestIndex = Math.round(normalizedAngle / angleStep);
    // Ensure index is within valid range
    if (nearestIndex >= this.filteredChildren.length) {
      nearestIndex = 0;
    } else if (nearestIndex < 0) {
      nearestIndex = this.filteredChildren.length - 1;
    }
    
    const targetAngle = nearestIndex * angleStep;
    
    // Calculate the shortest rotation path
    let angleDiff = targetAngle - normalizedAngle;
    
    // Handle wrap-around (choose shortest path)
    if (angleDiff > 180) {
      angleDiff -= 360;
    } else if (angleDiff < -180) {
      angleDiff += 360;
    }
    
    // Apply the snap - add the difference to current rotation angle
    this.rotationAngle += angleDiff;
  }

  onMouseDown(event: MouseEvent): void {
    if (this.filteredChildren.length === 0) return;
    
    // Check if the click target is a button or inside card__actions
    const target = event.target as HTMLElement;
    if (target.closest('.card__actions') || target.closest('button')) {
      // Don't start dragging if clicking a button
      return;
    }
    
    // Initialize drag tracking
    this.isDragging = false; // Start as false, will be set to true if user actually drags
    this.hasMoved = false;
    this.startX = event.clientX;
    this.startY = event.clientY;
    
    // Don't prevent default immediately - allow click events to fire if it's just a click
    // Only prevent default if user actually starts dragging (handled in onMouseMove)
    
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseMove = (event: MouseEvent): void => {
    if (this.filteredChildren.length === 0) return;
    
    const deltaX = Math.abs(event.clientX - this.startX);
    const deltaY = Math.abs(event.clientY - this.startY);
    const totalDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Only start dragging if user moved beyond threshold
    if (!this.hasMoved && totalDelta > this.touchThreshold) {
      this.hasMoved = true;
      this.isDragging = true;
      // Now prevent default to stop click events
      event.preventDefault();
    }
    
    // Only rotate if actually dragging
    if (this.isDragging) {
      const deltaX = event.clientX - this.startX;
      this.rotationAngle += deltaX * this.rotationSpeed;
      this.startX = event.clientX;
      // Disable transition during drag for smooth real-time movement
      const carousel = document.querySelector('.card-3d') as HTMLElement;
      if (carousel) {
        carousel.style.transition = 'none';
      }
      event.preventDefault();
    }
  }

  onMouseUp = (): void => {
    // Only snap if user actually dragged
    if (this.isDragging && this.hasMoved) {
      // Re-enable transition after drag
      const carousel = document.querySelector('.card-3d') as HTMLElement;
      if (carousel) {
        carousel.style.transition = '';
      }
      // Snap to nearest card position
      this.snapToNearestCard();
    }
    
    // Reset drag state
    this.isDragging = false;
    this.hasMoved = false;
    
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  onTouchStart(event: TouchEvent): void {
    if (this.filteredChildren.length === 0) return;
    
    // Check if the touch target is a button or inside card__actions
    const target = event.target as HTMLElement;
    if (target.closest('.card__actions') || target.closest('button')) {
      // Don't start dragging if touching a button
      return;
    }
    
    // Initialize drag tracking
    this.isDragging = false; // Start as false, will be set to true if user actually drags
    this.hasMoved = false;
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
    this.touchStartTime = Date.now();
    
    // Don't prevent default immediately - allow click events to fire if it's just a tap
    // Only prevent default if user actually starts dragging (handled in onTouchMove)
    
    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    document.addEventListener('touchend', this.onTouchEnd);
  }

  onTouchMove = (event: TouchEvent): void => {
    if (this.filteredChildren.length === 0) return;
    
    const deltaX = Math.abs(event.touches[0].clientX - this.startX);
    const deltaY = Math.abs(event.touches[0].clientY - this.startY);
    const totalDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Only start dragging if user moved beyond threshold
    if (!this.hasMoved && totalDelta > this.touchThreshold) {
      this.hasMoved = true;
      this.isDragging = true;
      // Now prevent default to stop click events
      event.preventDefault();
    }
    
    // Only rotate if actually dragging
    if (this.isDragging) {
      const deltaX = event.touches[0].clientX - this.startX;
      this.rotationAngle += deltaX * this.rotationSpeed;
      this.startX = event.touches[0].clientX;
      // Disable transition during drag for smooth real-time movement
      const carousel = document.querySelector('.card-3d') as HTMLElement;
      if (carousel) {
        carousel.style.transition = 'none';
      }
      event.preventDefault();
    }
  }

  onTouchEnd = (): void => {
    const touchDuration = Date.now() - this.touchStartTime;
    
    // Only snap if user actually dragged (moved beyond threshold)
    if (this.isDragging && this.hasMoved) {
      // Re-enable transition after drag
      const carousel = document.querySelector('.card-3d') as HTMLElement;
      if (carousel) {
        carousel.style.transition = '';
      }
      // Snap to nearest card position
      this.snapToNearestCard();
    }
    // If it was a quick tap (short duration and no movement), allow click event to fire
    // The click handler on the card will handle navigation
    
    // Reset drag state
    this.isDragging = false;
    this.hasMoved = false;
    this.touchStartTime = 0;
    
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
  }

  showDialog() {
    this.isEditMode = false;
    this.newChild = this.resetChild();
    this.selectedFile = null;
    this.profileForm = {
      first_name: '',
      last_name: '',
      birth_date: '',
      gender: 'M',
      diagnosis: '',
      notes: ''
    };
    this.birthDate = null;
    this.displayDialog = true;
    this.error = null;
  }

  showEditDialog(child: Profile) {
    this.isEditMode = true;
    this.selectedChild = { ...child };
    this.birthDate = new Date(child.birth_date);
    this.updatedisplayDialog = true;
    this.error = null;
  }

  addChild() {
    if (this.newChild.first_name && this.newChild.last_name && this.newChild.birth_date) {
      this.isLoading = true;
      const formData = new FormData();
      formData.append('first_name', this.newChild.first_name);
      formData.append('last_name', this.newChild.last_name);
      formData.append('birth_date', this.newChild.birth_date);
      formData.append('gender', this.newChild.gender || 'M');
      formData.append('diagnosis', this.newChild.diagnosis || '');
      formData.append('notes', this.newChild.notes || '');
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }
      this.profileService.createChildProfile(formData).subscribe({
        next: (child) => {
          let imageUrl = (child as any).image || child.image_url;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${environment.apiUrl.slice(0, -1)}${imageUrl}`;
          }
          // Reload all profiles from server to ensure data consistency
          this.loadChildren();
          
          // Reset form and file selection
          this.newChild = this.resetChild();
          this.selectedFile = null;
          
          this.displayDialog = false;
          this.isLoading = false;
          this.translate.get(['profile_messages.add_profile_success.title', 'profile_messages.add_profile_success.text']).subscribe(translations => {
            Swal.fire({
              icon: 'success',
              title: translations['profile_messages.add_profile_success.title'],
              text: translations['profile_messages.add_profile_success.text']
            });
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.translate.get(['profile_messages.add_profile_error.title', 'profile_messages.add_profile_error.text']).subscribe(translations => {
            Swal.fire({
              icon: 'error',
              title: translations['profile_messages.add_profile_error.title'],
              html: `<div class="error-warning">
                      <i class="fas fa-exclamation-triangle warning-icon"></i>
                      <p>${translations['profile_messages.add_profile_error.text']}</p>
                    </div>`,
              width: '700px',
              confirmButtonColor: '#4da5d8',
              confirmButtonText: 'OK',
              customClass: {
                popup: 'terms-popup error-popup',
                title: 'terms-title',
                htmlContainer: 'terms-html-container',
                confirmButton: 'terms-confirm-button'
              },
              allowOutsideClick: true
            });
          });
        }
      });
    } else {
      this.translate.get(['profile_messages.add_profile_required_fields_error.title', 'profile_messages.add_profile_required_fields_error.text']).subscribe(translations => {
        Swal.fire({
          icon: 'warning',
          title: translations['profile_messages.add_profile_required_fields_error.title'],
          html: `<div class="error-warning">
                  <i class="fas fa-exclamation-triangle warning-icon"></i>
                  <p>${translations['profile_messages.add_profile_required_fields_error.text']}</p>
                </div>`,
          width: '700px',
          confirmButtonColor: '#4da5d8',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'terms-popup error-popup',
            title: 'terms-title',
            htmlContainer: 'terms-html-container',
            confirmButton: 'terms-confirm-button'
          },
          allowOutsideClick: true
        });
      });
    }
  }

  saveChild() {
    if (this.selectedChild && this.selectedChild.id) {
      const formData = new FormData();
      formData.append('first_name', this.selectedChild.first_name);
      formData.append('last_name', this.selectedChild.last_name);
      formData.append('birth_date', this.selectedChild.birth_date);
      formData.append('gender', this.selectedChild.gender || 'M');
      formData.append('diagnosis', this.selectedChild.diagnosis || '');
      formData.append('notes', this.selectedChild.notes || '');
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }
      this.profileService.updateChildProfile(this.selectedChild.id, formData).subscribe({
        next: (updatedChild) => {
          const index = this.children.findIndex(c => c.id === updatedChild.id);
          if (index !== -1) {
            this.children[index] = { ...updatedChild, image_url: this.children[index].image_url };
            this.filteredChildren = [...this.children];
          }
          this.updatedisplayDialog = false;
          this.translate.get(['profile_messages.update_profile_success.title', 'profile_messages.update_profile_success.text']).subscribe(translations => {
            Swal.fire({
              icon: 'success',
              title: translations['profile_messages.update_profile_success.title'],
              text: translations['profile_messages.update_profile_success.text']
            });
          });
        },
        error: (err) => {
          this.translate.get(['profile_messages.update_profile_error.title', 'profile_messages.update_profile_error.text']).subscribe(translations => {
            Swal.fire({
              icon: 'error',
              title: translations['profile_messages.update_profile_error.title'],
              html: `<div class="error-warning">
                      <i class="fas fa-exclamation-triangle warning-icon"></i>
                      <p>${translations['profile_messages.update_profile_error.text']}</p>
                    </div>`,
              width: '700px',
              confirmButtonColor: '#4da5d8',
              confirmButtonText: 'OK',
              customClass: {
                popup: 'terms-popup error-popup',
                title: 'terms-title',
                htmlContainer: 'terms-html-container',
                confirmButton: 'terms-confirm-button'
              },
              allowOutsideClick: true
            });
          });
        }
      });
    }
  }

  saveProfile() {
    if (!this.profileForm.first_name || !this.profileForm.last_name || !this.birthDate) {
      this.error = this.translate.instant('add_child_dialog.required_fields_error');
      return;
    }

    const formattedBirthDate = this.birthDate.toISOString().split('T')[0];
    this.profileForm.birth_date = formattedBirthDate;

    if (this.isEditMode && this.selectedChild?.id) {
      const updateData: UpdateProfileRequest = { ...this.profileForm };
      const formData = new FormData();
      formData.append('first_name', this.selectedChild.first_name);
      formData.append('last_name', this.selectedChild.last_name);
      formData.append('birth_date', this.selectedChild.birth_date);
      formData.append('gender', this.selectedChild.gender || 'M');
      formData.append('diagnosis', this.selectedChild.diagnosis || '');
      formData.append('notes', this.selectedChild.notes || '');
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }
      this.profileService.updateChildProfile(this.selectedChild.id, formData).subscribe({
        next: (updatedChild) => {
          const index = this.children.findIndex(c => c.id === updatedChild.id);
          if (index !== -1) {
            this.children[index] = {
              ...updatedChild,
              image_url: (updatedChild as any).image || this.children[index].image_url
            };
            this.filteredChildren = [...this.children];
          }
          this.displayDialog = false;
          this.translate.get(['profile_messages.update_profile_success.title', 'profile_messages.update_profile_success.text']).subscribe(translations => {
            Swal.fire({
              icon: 'success',
              title: translations['profile_messages.update_profile_success.title'],
              text: translations['profile_messages.update_profile_success.text']
            });
          });
        },
        error: (err) => {
          this.error = err.message;
        }
      });
    } else {
      const createData: CreateProfileRequest = this.profileForm as CreateProfileRequest;
      const formData = new FormData();
      formData.append('first_name', this.newChild.first_name);
      formData.append('last_name', this.newChild.last_name);
      formData.append('birth_date', this.newChild.birth_date);
      formData.append('gender', this.newChild.gender || 'M');
      formData.append('diagnosis', this.newChild.diagnosis || '');
      formData.append('notes', this.newChild.notes || '');
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }
      this.profileService.createChildProfile(formData).subscribe({
        next: (newChild) => {
          let imageUrl = (newChild as any).image || newChild.image_url;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${environment.apiUrl.slice(0, -1)}${imageUrl}`;
          }
          this.children.push({
            ...newChild,
            image_url: imageUrl
          });
          this.filteredChildren = [...this.children];
          this.displayDialog = false;
          this.translate.get(['profile_messages.add_profile_success.title', 'profile_messages.add_profile_success.text']).subscribe(translations => {
            Swal.fire({
              icon: 'success',
              title: translations['profile_messages.add_profile_success.title'],
              text: translations['profile_messages.add_profile_success.text']
            });
          });
        },
        error: (err) => {
          this.error = err.message;
        }
      });
    }
  }

  disableChild(child: Profile) {
    const childName = `${child.first_name} ${child.last_name}`;
    this.translate.get([
      'profile_messages.disable_profile_confirm.title',
      'profile_messages.disable_profile_confirm.text',
      'profile_messages.disable_profile_confirm.confirm_button',
      'profile_messages.disable_profile_confirm.cancel_button'
    ], { childName }).subscribe(translations => {
      Swal.fire({
        title: translations['profile_messages.disable_profile_confirm.title'],
        text: translations['profile_messages.disable_profile_confirm.text'],
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: translations['profile_messages.disable_profile_confirm.confirm_button'],
        cancelButtonText: translations['profile_messages.disable_profile_confirm.cancel_button']
      }).then((result) => {
        if (result.isConfirmed && child.id) {
          this.profileService.deleteChildProfile(child.id).subscribe({
            next: () => {
              this.children = this.children.filter(c => c.id !== child.id);
              this.filteredChildren = [...this.children];
              this.translate.get([
                'profile_messages.disable_profile_success.title',
                'profile_messages.disable_profile_success.text'
              ], { childName }).subscribe(successTranslations => {
                Swal.fire({
                  icon: 'success',
                  title: successTranslations['profile_messages.disable_profile_success.title'],
                  text: successTranslations['profile_messages.disable_profile_success.text']
                });
              });
            },
            error: (err) => {
              this.translate.get([
                'profile_messages.disable_profile_error.title',
                'profile_messages.disable_profile_error.text'
              ]).subscribe(errorTranslations => {
                Swal.fire({
                  icon: 'error',
                  title: errorTranslations['profile_messages.disable_profile_error.title'],
                  html: `<div class="error-warning">
                          <i class="fas fa-exclamation-triangle warning-icon"></i>
                          <p>${errorTranslations['profile_messages.disable_profile_error.text']}</p>
                        </div>`,
                  width: '700px',
                  confirmButtonColor: '#4da5d8',
                  confirmButtonText: 'OK',
                  customClass: {
                    popup: 'terms-popup error-popup',
                    title: 'terms-title',
                    htmlContainer: 'terms-html-container',
                    confirmButton: 'terms-confirm-button'
                  },
                  allowOutsideClick: true
                });
              });
            }
          });
        }
      });
    });
  }

  navigateToClient(childId: number) {
    localStorage.setItem('selectedChildId', childId.toString());
    
    // Check if we need to redirect after login
    const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
    const redirectTab = localStorage.getItem('redirectTab');
    
    if (redirectAfterLogin === 'explorer') {
      localStorage.removeItem('redirectAfterLogin');
      this.router.navigate(['/Dashboard-client/client/explore']);
    } else if (redirectAfterLogin === 'accueil' && redirectTab) {
      localStorage.removeItem('redirectAfterLogin');
      localStorage.removeItem('redirectTab');
      // Navigate to dashboard with the specified tab
      this.router.navigate(['/Dashboard-client/client/', childId], {
        queryParams: { tab: redirectTab }
      });
    } else {
      this.router.navigate(['/Dashboard-client/client/', childId]);
    }
  }

  cancel() {
    this.displayDialog = false;
    this.updatedisplayDialog = false;
    this.error = null;
    this.newChild = this.resetChild();
    this.selectedFile = null;
  }

  // Language switcher methods
  switchLanguage(language: string): void {
    this.sharedService.changeLanguage(language);
    this.showLanguageMenu = false;
  }

  toggleLanguageMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
      const target = event.target as HTMLElement;
      const button = target.closest('.lang-icon-btn') as HTMLElement;
      
      if (button && !this.showLanguageMenu) {
        // Calculate position when opening
        const rect = button.getBoundingClientRect();
        const navbar = document.querySelector('.profile-navbar') as HTMLElement;
        const navbarRect = navbar?.getBoundingClientRect();
        
        if (navbarRect) {
          // Position relative to viewport, accounting for navbar position
          this.dropdownPosition = {
            top: `${rect.bottom + 4}px`,
            right: `${window.innerWidth - rect.right}px`
          };
        }
      }
    }
    this.showLanguageMenu = !this.showLanguageMenu;
    console.log('Language menu toggled, showLanguageMenu:', this.showLanguageMenu);
  }

  // Toggle menu dropdown


  // Change account method
  changeAccount(): void {
    this.showLanguageMenu = false; // Close language menu if open
    this.translate.get([
      'navbar.buttons.change_account_confirm.title',
      'navbar.buttons.change_account_confirm.text',
      'navbar.buttons.change_account_confirm.confirm_button',
      'navbar.buttons.change_account_confirm.cancel_button'
    ]).subscribe(translations => {
      const htmlContent = `
        <div class="change-account-warning">
          <i class="fas fa-exclamation-triangle warning-icon"></i>
          <p>${translations['navbar.buttons.change_account_confirm.text']}</p>
        </div>
      `;
      Swal.fire({
        title: translations['navbar.buttons.change_account_confirm.title'],
        html: htmlContent,
        width: '700px',
        showCancelButton: true,
        confirmButtonColor: '#4da5d8',
        cancelButtonColor: '#6c757d',
        confirmButtonText: translations['navbar.buttons.change_account_confirm.confirm_button'],
        cancelButtonText: translations['navbar.buttons.change_account_confirm.cancel_button'],
        customClass: {
          popup: 'terms-popup',
          title: 'terms-title',
          htmlContainer: 'terms-html-container',
          confirmButton: 'terms-confirm-button',
          cancelButton: 'terms-cancel-button'
        },
        backdrop: true,
        allowOutsideClick: true
      }).then((result) => {
        if (result.isConfirmed) {
          this.authService.logout();
        }
      });
    });
  }

  // Close language menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Use setTimeout to avoid immediate closure when opening
    setTimeout(() => {
      if (!target.closest('.language-menu-container') && 
          !target.closest('.language-dropdown') && 
          this.showLanguageMenu) {
        this.showLanguageMenu = false;
      }
    }, 0);
  }

  // Close language menu with Escape key
  @HostListener('document:keydown', ['$event'])
  onEscapeKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Escape') {
      if (this.showLanguageMenu) {
        this.showLanguageMenu = false;
      }
    }
  }
}