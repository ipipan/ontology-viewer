import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Corpus } from '../../models/example.model';

@Component({
  selector: 'app-corpus-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border p-4">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Corpora</h2>

      <div class="space-y-3">
        <div
          *ngFor="let corpus of corpora"
          (click)="corpus.count > 0 ? toggleCorpus(corpus) : null"
          [class.bg-blue-50]="isSelected(corpus) && corpus.count > 0"
          [class.border-blue-300]="isSelected(corpus) && corpus.count > 0"
          [class.bg-gray-50]="corpus.count === 0"
          [class.border-gray-200]="corpus.count === 0"
          [class.cursor-not-allowed]="corpus.count === 0"
          class="p-3 border rounded-lg transition-colors"
          [class.cursor-pointer]="corpus.count > 0"
          [class.hover:bg-gray-100]="corpus.count > 0 && !isSelected(corpus)"
        >
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-2">
              <input
                type="checkbox"
                [checked]="isSelected(corpus)"
                [disabled]="corpus.count === 0"
                (click)="$event.stopPropagation(); corpus.count > 0 ? toggleCorpus(corpus) : null"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="font-medium text-gray-900">{{ corpus.name }}</span>
            </div>
            <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {{ corpus.count }}
            </span>
          </div>
          <div class="text-sm text-gray-500 mt-1 ml-6">
            Language: {{ corpus.language }}
          </div>
        </div>
      </div>

      <div *ngIf="corpora.length > 0" class="mt-3 flex gap-2">
        <button
          (click)="selectAll()"
          class="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          Select All
        </button>
        <button
          (click)="deselectAll()"
          class="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
        >
          Deselect All
        </button>
      </div>

      <div *ngIf="loading" class="text-center py-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
      </div>

      <div *ngIf="error" class="text-red-600 text-sm mt-2 p-2 bg-red-50 rounded-md">
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CorpusListComponent implements OnInit {
  corpora: Corpus[] = [];
  selectedCorpora: Set<string> = new Set();
  loading = false;
  error = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadCorpora();
  }

  loadCorpora(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getCorpora().subscribe({
      next: (data) => {
        // Sort corpora by number of examples (count) in descending order
        this.corpora = data.sort((a, b) => b.count - a.count);
        this.loading = false;
        // No auto-select: user must explicitly choose corpora
      },
      error: (err) => {
        this.error = 'Failed to load corpora';
        this.loading = false;
        console.error('Error loading corpora:', err);
      }
    });
  }

  isSelected(corpus: Corpus): boolean {
    return this.selectedCorpora.has(corpus.name);
  }

  toggleCorpus(corpus: Corpus): void {
    if (this.selectedCorpora.has(corpus.name)) {
      this.selectedCorpora.delete(corpus.name);
    } else {
      this.selectedCorpora.add(corpus.name);
    }
    this.applyCorpusFilter();
  }

  selectAll(): void {
    for (const corpus of this.corpora) {
      if (corpus.count > 0) {
        this.selectedCorpora.add(corpus.name);
      }
    }
    this.applyCorpusFilter();
  }

  deselectAll(): void {
    this.selectedCorpora.clear();
    this.applyCorpusFilter();
  }

  private applyCorpusFilter(): void {
    const selected = Array.from(this.selectedCorpora);
    this.apiService.updateFilter('corpus', selected.length > 0 ? selected : undefined);
  }
}