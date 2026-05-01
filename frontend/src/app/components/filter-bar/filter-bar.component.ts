import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../services/api.service';
import { ConnectiveData } from '../../models/example.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Language Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select 
            [ngModel]="service.filters().language" 
            (ngModelChange)="onLanguageChange($event)"
            class="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option [ngValue]="undefined">All Languages</option>
            <option *ngFor="let lang of languages" [value]="lang">{{ lang }}</option>
          </select>
        </div>

        <!-- Connective Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Connective</label>
          <div class="relative connective-dropdown">
            <input
              type="text"
              [ngModel]="connectiveSearchText()"
              (ngModelChange)="onConnectiveSearchChange($event)"
              (focus)="showConnectiveDropdown.set(true)"
              (blur)="onConnectiveBlur()"
              placeholder="Search connectives..."
              class="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div 
              *ngIf="showConnectiveDropdown() && (filteredConnectives().length > 0 || connectiveSearchText())"
              class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              <div
                *ngIf="connectiveSearchText()"
                (mousedown)="selectConnective(undefined)"
                class="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-200 font-medium"
              >
                All Connectives
              </div>
              <div
                *ngFor="let connective of filteredConnectives()"
                (mousedown)="selectConnective(connective.label)"
                class="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
              >
                {{ connective.label }} ({{ connective.count }})
              </div>
              <div
                *ngIf="filteredConnectives().length === 0"
                class="px-3 py-2 text-sm text-gray-500"
              >
                No connectives found
              </div>
            </div>
            <button
              *ngIf="service.filters().connective"
              (click)="clearConnectiveFilter(); $event.stopPropagation()"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Relation Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Relation type</label>
          <div class="relative relation-dropdown">
            <input
              type="text"
              [ngModel]="relationSearchText()"
              (ngModelChange)="onRelationSearchChange($event)"
              (focus)="showRelationDropdown.set(true)"
              (blur)="onRelationBlur()"
              placeholder="Search relations..."
              class="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div 
              *ngIf="showRelationDropdown() && (filteredRelations().length > 0 || relationSearchText())"
              class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              <div
                *ngIf="relationSearchText()"
                (mousedown)="selectRelation(undefined)"
                class="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-200 font-medium"
              >
                All Relations
              </div>
              <div
                *ngFor="let relation of filteredRelations()"
                (mousedown)="selectRelation(relation)"
                class="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
              >
                {{ relation }}
              </div>
              <div
                *ngIf="filteredRelations().length === 0"
                class="px-3 py-2 text-sm text-gray-500"
              >
                No relations found
              </div>
            </div>
            <button
              *ngIf="service.filters().relation"
              (click)="clearRelationFilter(); $event.stopPropagation()"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Symmetric Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Relation symmetry</label>
          <select 
            [ngModel]="service.filters().symmetric" 
            (ngModelChange)="onSymmetricChange($event)"
            class="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option [ngValue]="undefined">All</option>
            <option [ngValue]="true">Symmetric</option>
            <option [ngValue]="false">Asymmetric</option>
          </select>
        </div>
      </div>

      <!-- Search Input -->
      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Full-text Search</label>
        <div class="relative">
          <input
            type="text"
            [ngModel]="service.filters().q"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search in examples..."
            class="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Loading / Error -->
      <div *ngIf="isLoading()" class="mt-2 text-sm text-gray-600">Loading results...</div>
      <div *ngIf="loadError()" class="mt-2 text-sm text-red-600">Failed to load examples</div>

      <!-- Active Filters -->
      <div *ngIf="hasActiveFilters()" class="mt-4">
        <div class="flex flex-wrap gap-2">
          <span 
            *ngIf="service.filters().language" 
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            Language: {{ service.filters().language }}
            <button (click)="service.clearFilter('language')" class="ml-1 text-blue-600 hover:text-blue-800">
              ×
            </button>
          </span>
          
          <span
            *ngIf="service.filters().connective"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
          >
            Connective: {{ service.filters().connective }}
            <button (click)="clearConnectiveFilter()" class="ml-1 text-green-600 hover:text-green-800">
              ×
            </button>
          </span>
          
          <span 
            *ngIf="service.filters().relation" 
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
          >
            Relation: {{ service.filters().relation }}
            <button (click)="service.clearFilter('relation')" class="ml-1 text-purple-600 hover:text-purple-800">
              ×
            </button>
          </span>
          
          <span 
            *ngIf="service.filters().symmetric !== undefined && service.filters().symmetric !== null" 
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
          >
            {{ service.filters().symmetric ? 'Symmetric' : 'Asymmetric' }}
            <button (click)="service.clearFilter('symmetric')" class="ml-1 text-yellow-600 hover:text-yellow-800">
              ×
            </button>
          </span>
          
          <span 
            *ngIf="service.filters().q" 
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
          >
            Search: {{ service.filters().q }}
            <button (click)="service.clearFilter('q')" class="ml-1 text-red-600 hover:text-red-800">
              ×
            </button>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class FilterBarComponent implements OnInit {
  constructor(public service: ApiService) {}

  languages: string[] = [];
  relations: string[] = [];
  connectives: ConnectiveData[] = [];
  
  // Searchable dropdown state for Connective
  connectiveSearchText = signal<string>('');
  showConnectiveDropdown = signal<boolean>(false);
  
  // Searchable dropdown state for Relation
  relationSearchText = signal<string>('');
  showRelationDropdown = signal<boolean>(false);
  
  // Filtered connectives based on search
  filteredConnectives = computed(() => {
    const searchTerm = this.connectiveSearchText().toLowerCase();
    if (!searchTerm) {
      return this.connectives;
    }
    return this.connectives.filter(c => 
      c.label.toLowerCase().includes(searchTerm)
    );
  });
  
  // Filtered relations based on search
  filteredRelations = computed(() => {
    const searchTerm = this.relationSearchText().toLowerCase();
    if (!searchTerm) {
      return this.relations;
    }
    return this.relations.filter(r => 
      r.toLowerCase().includes(searchTerm)
    );
  });

  ngOnInit(): void {
    this.loadFilterOptions();
    
    // Set initial search text if filters are already applied
    const currentConnective = this.service.filters().connective;
    if (currentConnective) {
      this.connectiveSearchText.set(currentConnective);
    }
    
    const currentRelation = this.service.filters().relation;
    if (currentRelation) {
      this.relationSearchText.set(currentRelation);
    }
  }

  loadFilterOptions(): void {
    // Load languages from API or hardcode based on known data
    this.languages = ['pl', 'en']; // Example languages

    // Load relations from API
    this.service.getOntologyRelations().subscribe({
      next: (data) => {
        this.relations = data.map(rel => rel.label).filter((v, i, a) => a.indexOf(v) === i);
      },
      error: (err) => {
        console.error('Error loading relations:', err);
        this.relations = ['Purpose', 'Cause', 'Condition', 'Concession']; // Fallback
      }
    });

    // Load connectives from API
    this.service.getConnectives().subscribe({
      next: (data) => {
        this.connectives = data;
      },
      error: (err) => {
        console.error('Error loading connectives:', err);
        this.connectives = [];
      }
    });
  }

  hasActiveFilters(): boolean {
    const f = this.service.filters();
    return !!(f.language || f.connective || f.relation || f.symmetric !== undefined || f.q);
  }

  isLoading = computed(() => this.service.examples.isLoading());
  loadError = computed(() => this.service.examples.error());

  onLanguageChange(value: any): void {
    this.service.updateFilter('language', value);
  }

  onConnectiveChange(value: any): void {
    this.service.updateFilter('connective', value);
  }

  onRelationChange(value: any): void {
    this.service.updateFilter('relation', value);
  }

  onSymmetricChange(value: any): void {
    this.service.updateFilter('symmetric', value);
  }

  onSearchChange(value: any): void {
    this.service.updateFilter('q', value);
  }

  onConnectiveSearchChange(value: string): void {
    this.connectiveSearchText.set(value);
    this.showConnectiveDropdown.set(true);
    
    // If the value is empty, clear the filter
    if (!value) {
      this.service.clearFilter('connective');
    }
  }
  
  onConnectiveBlur(): void {
    // Delay to allow mousedown event to fire first
    setTimeout(() => {
      this.showConnectiveDropdown.set(false);
    }, 200);
  }
  
  selectConnective(label: string | undefined): void {
    if (label) {
      this.connectiveSearchText.set(label);
      this.service.updateFilter('connective', label);
    } else {
      this.connectiveSearchText.set('');
      this.service.clearFilter('connective');
    }
    this.showConnectiveDropdown.set(false);
  }

  clearConnectiveFilter(): void {
    this.service.clearFilter('connective');
    this.connectiveSearchText.set('');
    this.showConnectiveDropdown.set(false);
  }
  
  // Relation dropdown methods
  onRelationSearchChange(value: string): void {
    this.relationSearchText.set(value);
    this.showRelationDropdown.set(true);
    
    // If the value is empty, clear the filter
    if (!value) {
      this.service.clearFilter('relation');
    }
  }
  
  onRelationBlur(): void {
    // Delay to allow mousedown event to fire first
    setTimeout(() => {
      this.showRelationDropdown.set(false);
    }, 200);
  }
  
  selectRelation(relation: string | undefined): void {
    if (relation) {
      this.relationSearchText.set(relation);
      this.service.updateFilter('relation', relation);
    } else {
      this.relationSearchText.set('');
      this.service.clearFilter('relation');
    }
    this.showRelationDropdown.set(false);
  }
  
  clearRelationFilter(): void {
    this.service.clearFilter('relation');
    this.relationSearchText.set('');
    this.showRelationDropdown.set(false);
  }
}