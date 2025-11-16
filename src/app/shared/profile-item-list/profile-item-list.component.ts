import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ProfileItem } from 'src/app/core/models/ProfileItem';

@Component({
  standalone: true,
  selector: 'app-profile-item-list',
  templateUrl: './profile-item-list.component.html',
  styleUrls: ['./profile-item-list.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    MatCheckboxModule
  ]
})
export class ProfileItemListComponent implements OnInit, OnChanges {
  @Input() items: ProfileItem[] = [];
  @Input() selectedItems: number[] = []; // Array of selected item IDs
  @Output() selectionChange = new EventEmitter<number[]>();

  selectedItemIds: Set<number> = new Set();

  ngOnInit() {
    // Initialize selected items from input
    if (this.selectedItems && this.selectedItems.length > 0) {
      this.selectedItemIds = new Set(this.selectedItems);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Update selected items when input changes
    if (changes['selectedItems']) {
      if (this.selectedItems && this.selectedItems.length > 0) {
        this.selectedItemIds = new Set(this.selectedItems);
      } else {
        this.selectedItemIds.clear();
      }
    }
    
    // Also initialize from items' done field if selectedItems is not provided
    if (changes['items'] && (!this.selectedItems || this.selectedItems.length === 0)) {
      this.selectedItemIds = new Set(
        this.items.filter(item => item.done === true).map(item => item.id)
      );
    }
  }

  toggleItem(itemId: number) {
    if (this.selectedItemIds.has(itemId)) {
      this.selectedItemIds.delete(itemId);
    } else {
      this.selectedItemIds.add(itemId);
    }
    this.emitSelectionChange();
  }

  isItemSelected(itemId: number): boolean {
    return this.selectedItemIds.has(itemId);
  }

  private emitSelectionChange() {
    const selectedArray = Array.from(this.selectedItemIds);
    this.selectionChange.emit(selectedArray);
  }
}

