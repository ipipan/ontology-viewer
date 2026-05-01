import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Example, OrderedElement, Argument, Connective } from '../../models/example.model';

@Component({
  selector: 'app-examples-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border p-4">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Examples</h2>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-500 mt-2">Loading examples...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="loadError()" class="text-red-600 p-4 bg-red-50 rounded-md">
        Failed to load examples
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading() && (examples()?.length || 0) === 0" class="text-center py-8">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No examples found</h3>
        <p class="mt-1 text-sm text-gray-500">Try adjusting your search filters.</p>
      </div>

      <!-- Examples List -->
      <div *ngIf="!isLoading() && (examples()?.length || 0) > 0" class="space-y-4">
        <div
          *ngFor="let example of examples()!"
          class="p-4 border rounded-md hover:bg-gray-50 transition-colors"
        >
          <!-- Header with relation and metadata -->
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-900">{{ example.relation }}</span>
              <span *ngIf="example.notation" class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                #{{ example.notation }}
              </span>
            </div>
            <div class="flex space-x-2">
              <span
                *ngIf="example.symmetric !== null"
                [class.bg-green-100]="example.symmetric"
                [class.bg-yellow-100]="!example.symmetric"
                [class.text-green-800]="example.symmetric"
                [class.text-yellow-800]="!example.symmetric"
                class="px-2 py-1 text-xs font-medium rounded-full"
              >
                {{ example.symmetric ? 'Symmetric' : 'Asymmetric' }}
              </span>
              <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {{ example.language }}
              </span>
            </div>
          </div>

          <!-- Full sentence -->
          <p class="text-gray-800 mb-3 font-medium">{{ example.text }}</p>

          <!-- Arguments and Connective (merged and sorted by order) -->
          <div class="relations-grid">
            <div class="relations-header">Type</div>
            <div class="relations-header">Text</div>
            <div class="relations-header">Order</div>
            <ng-container *ngFor="let el of getOrderedElements(example)">
              <!-- Type column -->
              <div class="relations-cell">
                <span class="text-xs font-medium text-gray-500">{{ el.kind === 'arg1' ? 'Arg1' : el.kind === 'arg2' ? 'Arg2' : 'Conn' }}:</span>
                <span *ngIf="el.kind === 'arg1'" class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">{{ asArg(el).type }}</span>
                <span *ngIf="el.kind === 'arg2'" class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{{ asArg(el).type }}</span>
                <span *ngIf="el.kind === 'connective'" class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Connective</span>
              </div>
              <!-- Text column -->
              <div class="relations-cell">
                <span class="text-sm text-gray-700" [class.font-medium]="el.kind === 'connective'">{{ el.data.text }}</span>
              </div>
              <!-- Order column -->
              <div class="relations-cell">
                <span *ngIf="el.data.order != null" class="text-xs text-gray-400">{{ el.data.order }}</span>
              </div>
            </ng-container>
          </div>

          <div class="text-xs text-gray-500 mt-3 pt-2 border-t">
            Corpus: {{ example.corpus }} • ID: {{ shortenId(example.id) }}
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="!isLoading() && pagination() && pagination()!.total > 0" class="mt-6 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Showing {{ (pagination()!.page - 1) * pagination()!.page_size + 1 }} to
          {{ Math.min(pagination()!.page * pagination()!.page_size, pagination()!.total) }} of
          {{ pagination()!.total }} results
        </div>

        <div class="flex space-x-2">
          <button
            (click)="previousPage()"
            [disabled]="pagination()!.page === 1"
            [class.opacity-50]="pagination()!.page === 1"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Previous
          </button>

          <button
            (click)="nextPage()"
            [disabled]="pagination()!.page * pagination()!.page_size >= pagination()!.total"
            [class.opacity-50]="pagination()!.page * pagination()!.page_size >= pagination()!.total"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .relations-grid {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      overflow: hidden;
    }
    .relations-header {
      padding: 0.375rem 0.75rem;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    .relations-cell {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-bottom: 1px solid #f3f4f6;
    }
    .relations-grid > .relations-cell:nth-last-child(-n+3) {
      border-bottom: none;
    }
  `]
})
export class ExamplesListComponent implements OnInit {
  // expose Math
  Math = Math;

  constructor(public service: ApiService) {}

  ngOnInit(): void {}

  // Signals derived from resource
  examples = computed<Example[] | undefined>(() => this.service.examples.value()?.results);
  pagination = computed(() => this.service.examples.value());
  isLoading = computed(() => this.service.examples.isLoading());
  loadError = computed(() => this.service.examples.error());

  previousPage(): void {
    const page = this.pagination()?.page || 1;
    if (page > 1) this.service.updateFilter('page', page - 1);
  }

  nextPage(): void {
    const p = this.pagination();
    if (!p) return;
    if (p.page * p.page_size < p.total) this.service.updateFilter('page', p.page + 1);
  }

  // Merge arg1, arg2, and connective into a single list sorted by order
  getOrderedElements(example: Example): OrderedElement[] {
    const elements: OrderedElement[] = [
      ...example.arg1.map((a: Argument): OrderedElement => ({ kind: 'arg1', data: a })),
      ...example.arg2.map((a: Argument): OrderedElement => ({ kind: 'arg2', data: a })),
      ...example.connective.map((c: Connective): OrderedElement => ({ kind: 'connective', data: c })),
    ];
    return elements.sort((a, b) => (a.data.order ?? Infinity) - (b.data.order ?? Infinity));
  }

  // Type-narrowing helper for Argument elements in template
  asArg(el: OrderedElement): Argument {
    return el.data as Argument;
  }

  // Pipe to shorten long IDs for display
  shortenId(id: string): string {
    if (id.length > 30) {
      return id.substring(0, 15) + '...' + id.substring(id.length - 15);
    }
    return id;
  }
}