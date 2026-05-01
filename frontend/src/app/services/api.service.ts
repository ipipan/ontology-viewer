import { Injectable, computed, signal } from '@angular/core';
import * as ngCore from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { Example, Corpus, PaginatedResponse, FilterParams, ConnectiveData } from '../models/example.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) { }

  // Filters state kept centrally via signals
  private _filters = signal<FilterParams>({
    corpus: 'PDC',
    page: 1,
    page_size: 25
  });
  filters = this._filters.asReadonly();

  updateFilter<K extends keyof FilterParams>(key: K, value: FilterParams[K] | undefined): void {
    const current = this._filters();
    const next: FilterParams = { ...current, [key]: value } as FilterParams;
    // Reset pagination when non-pagination filters change
    if (key !== 'page' && key !== 'page_size') {
      next.page = 1;
    }
    this._filters.set(next);
  }

  clearFilter(key: keyof FilterParams): void {
    this.updateFilter(key as any, undefined as any);
  }

  getHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  getCorpora(): Observable<Corpus[]> {
    return this.http.get<Corpus[]>(`${this.baseUrl}/corpora`);
  }

  // Examples resource that reloads when filters change
  examples: any = (ngCore as any).resource({
    request: this.filters,
    loader: async (opts: { request: FilterParams; abortSignal?: AbortSignal }) => {
      const params = opts.request;
      let httpParams = new HttpParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
      const request$ = this.http.get<PaginatedResponse>(`${this.baseUrl}/examples`, { params: httpParams });
      return await lastValueFrom(request$);
    }
  });

  getExampleById(id: string): Observable<Example> {
    return this.http.get<Example>(`${this.baseUrl}/examples/${id}`);
  }

  getOntologyClasses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ontology/classes`);
  }

  getOntologyRelations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ontology/relations`);
  }

  getConnectives(): Observable<ConnectiveData[]> {
    return this.http.get<ConnectiveData[]>(`${this.baseUrl}/connectives`);
  }
}