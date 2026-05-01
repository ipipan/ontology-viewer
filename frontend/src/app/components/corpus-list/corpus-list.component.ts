import { Component, OnInit, signal } from '@angular/core';
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
          (click)="corpus.count > 0 ? selectCorpus(corpus) : null"
          [class.bg-blue-50]="selectedCorpus?.name === corpus.name && corpus.count > 0"
          [class.border-blue-300]="selectedCorpus?.name === corpus.name && corpus.count > 0"
          [class.bg-gray-50]="corpus.count === 0"
          [class.border-gray-200]="corpus.count === 0"
          [class.cursor-not-allowed]="corpus.count === 0"
          class="p-3 border rounded-lg transition-colors"
          [class.cursor-pointer]="corpus.count > 0"
          [class.hover:bg-gray-100]="corpus.count > 0"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium text-gray-900">{{ corpus.name }}</span>
            <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {{ corpus.count }}
            </span>
          </div>
          <div class="text-sm text-gray-500 mt-1">
            Language: {{ corpus.language }}
          </div>
        </div>
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
  selectedCorpus: Corpus | null = null;
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

        // Auto-select first corpus if available (will be the one with most examples)
        if (this.corpora.length > 0) {
          this.selectCorpus(this.corpora[0]);
        }
      },
      error: (err) => {
        this.error = 'Failed to load corpora';
        this.loading = false;
        console.error('Error loading corpora:', err);
      }
    });
  }

  selectCorpus(corpus: Corpus): void {
    this.selectedCorpus = corpus;
    this.apiService.updateFilter('corpus', corpus.name);
  }
}