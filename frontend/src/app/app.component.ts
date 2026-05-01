import { Component } from '@angular/core';
import { CorpusListComponent } from './components/corpus-list/corpus-list.component';
import { FilterBarComponent } from './components/filter-bar/filter-bar.component';
import { ExamplesListComponent } from './components/examples-list/examples-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 class="text-2xl font-bold text-gray-900">ISO 24617-8 Ontology Viewer</h1>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Corpus List Panel -->
          <div class="lg:col-span-1">
            <app-corpus-list></app-corpus-list>
          </div>

          <!-- Main Content Area -->
          <div class="lg:col-span-3">
            <!-- Filter Bar -->
            <app-filter-bar></app-filter-bar>
            
            <!-- Examples List -->
            <app-examples-list></app-examples-list>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  imports: [
    CorpusListComponent,
    FilterBarComponent,
    ExamplesListComponent,
  ]
})
export class AppComponent {
  title = 'ontology-viewer';
}