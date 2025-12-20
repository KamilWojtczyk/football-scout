import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InjuryHistoryRecord, Manifest, PlayerRow } from './types';
import { map, Observable, shareReplay } from 'rxjs';
import { parseJsonOrJsonl } from './util';

const BASE = 'https://kamilwojtczyk.github.io/football-data-public/data/json';

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  injuriesCache$: Observable<InjuryHistoryRecord[]> | null = null;

  getManifest(): Observable<Manifest> {
    return this.http.get<Manifest>(`${BASE}/manifest.json`);
  }
  getTab(file: string): Observable<PlayerRow[]> {
    return this.http.get<PlayerRow[]>(`${BASE}/${file}`);
  }

  getInjuries(): Observable<InjuryHistoryRecord[]> {
    if (!this.injuriesCache$) {
      this.injuriesCache$ = this.http.get(`${BASE}/injuries.json`, { responseType: 'text' }).pipe(
        map((txt) => parseJsonOrJsonl<InjuryHistoryRecord>(txt)),
        shareReplay(1)
      );
    }
    return this.injuriesCache$;
  }
}
