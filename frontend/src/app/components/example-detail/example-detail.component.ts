import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Example } from '../../models/example.model';

@Component({
  selector: 'app-example-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="example" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">

        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-gray-900">Example Details</h3>
          <button
            (click)="close()"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="space-y-6">
          <!-- Text -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Complete Sentence</label>
            <p class="text-gray-900 text-lg font-medium bg-gray-50 p-3 rounded-md">{{ example?.text }}</p>
          </div>

          <!-- Notation -->
          <div *ngIf="example?.notation">
            <label class="block text-sm font-medium text-gray-700 mb-1">Notation</label>
            <p class="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded inline-block">#{{ example?.notation }}</p>
          </div>

          <!-- Basic Info Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Relation</label>
              <p class="text-gray-900">{{ example?.relation }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <p class="text-gray-900">{{ example?.language }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Symmetry</label>
              <p
                [class.text-green-600]="example?.symmetric"
                [class.text-yellow-600]="!example?.symmetric"
                class="font-medium"
              >
                {{ example?.symmetric !== null ? (example?.symmetric ? 'Symmetric' : 'Asymmetric') : 'Unknown' }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Corpus</label>
              <p class="text-gray-900">{{ example?.corpus }}</p>
            </div>
          </div>

          <!-- Arguments and Connective -->
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900 border-b pb-2">Discourse Structure</h4>

            <!-- Arg1 parts -->
            <div *ngFor="let arg of example?.arg1; let i = index" class="bg-red-50 p-4 rounded-md">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-red-800">Argument 1 <span *ngIf="(example?.arg1?.length || 0) > 1">(part {{ i + 1 }})</span></label>
                <div class="flex items-center space-x-2">
                  <span class="px-2 py-1 text-xs font-medium bg-red-200 text-red-800 rounded">{{ arg.type }}</span>
                  <span *ngIf="arg.order" class="text-xs text-red-600">Order: {{ arg.order }}</span>
                </div>
              </div>
              <p class="text-gray-800">{{ arg.text }}</p>
              <p class="text-xs text-gray-500 mt-1">ID: {{ shortenId(arg.id) }}</p>
            </div>

            <!-- Connective parts -->
            <div *ngFor="let conn of example?.connective; let i = index" class="bg-purple-50 p-4 rounded-md">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-purple-800">Connective <span *ngIf="(example?.connective?.length || 0) > 1">(part {{ i + 1 }})</span></label>
                <div class="flex items-center space-x-2">
                  <span class="px-2 py-1 text-xs font-medium bg-purple-200 text-purple-800 rounded">Connective</span>
                  <span *ngIf="conn.order" class="text-xs text-purple-600">Order: {{ conn.order }}</span>
                </div>
              </div>
              <p class="text-gray-800 font-medium">{{ conn.text }}</p>
              <p class="text-xs text-gray-500 mt-1">ID: {{ shortenId(conn.id) }}</p>
            </div>

            <!-- Arg2 parts -->
            <div *ngFor="let arg of example?.arg2; let i = index" class="bg-blue-50 p-4 rounded-md">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-blue-800">Argument 2 <span *ngIf="(example?.arg2?.length || 0) > 1">(part {{ i + 1 }})</span></label>
                <div class="flex items-center space-x-2">
                  <span class="px-2 py-1 text-xs font-medium bg-blue-200 text-blue-800 rounded">{{ arg.type }}</span>
                  <span *ngIf="arg.order" class="text-xs text-blue-600">Order: {{ arg.order }}</span>
                </div>
              </div>
              <p class="text-gray-800">{{ arg.text }}</p>
              <p class="text-xs text-gray-500 mt-1">ID: {{ shortenId(arg.id) }}</p>
            </div>
          </div>

          <!-- Ontology Types -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ontology Types</label>
            <div class="flex flex-wrap gap-2">
              <span
                *ngFor="let type of example?.ontology_types"
                class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full"
              >
                {{ shortenUri(type) }}
              </span>
            </div>
          </div>

          <!-- Provenance -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Provenance</label>
            <p class="text-gray-900 text-sm">{{ example?.provenance }}</p>
          </div>

          <!-- ID -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ID</label>
            <p class="text-gray-900 text-sm font-mono break-all">{{ example?.id }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 flex justify-end">
          <button
            (click)="close()"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ExampleDetailComponent {
  @Input() example: Example | null = null;

  close(): void {
    this.example = null;
  }

  // Pipe to shorten URI for display
  shortenUri(uri: string): string {
    if (uri.includes('#')) {
      return uri.split('#')[1];
    }
    if (uri.includes('/')) {
      return uri.split('/').pop() || uri;
    }
    return uri;
  }

  // Shorten long IDs for display
  shortenId(id: string): string {
    if (id.length > 30) {
      return id.substring(0, 15) + '...' + id.substring(id.length - 15);
    }
    return id;
  }
}