import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppearanceHistoryRecord, InjuryHistoryRecord, Manifest, PlayerRow } from './types';
import { map, Observable, of, shareReplay } from 'rxjs';
import { parseJsonOrJsonl } from './util';

const BASE = 'https://kamilwojtczyk.github.io/football-data-public/data/json';

const APPEARANCES_BASE = `${BASE}/appearances`;
const APPEARANCES_BUCKETS = 1024;

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  injuriesCache$: Observable<InjuryHistoryRecord[]> | null = null;

  private appearancesBucketCache = new Map<number, Observable<AppearanceHistoryRecord[]>>();

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

  getAppearancesByTmUrl(
    tmUrl: string | null | undefined
  ): Observable<AppearanceHistoryRecord | null> {
    const id = this.extractPlayerId(tmUrl);
    if (!id) return of(null);
    return this.getAppearancesByPlayerId(id);
  }

  getAppearancesByPlayerId(playerId: number): Observable<AppearanceHistoryRecord | null> {
    const bucket = ((playerId % APPEARANCES_BUCKETS) + APPEARANCES_BUCKETS) % APPEARANCES_BUCKETS;
    return this.loadAppearancesBucket(bucket).pipe(
      map((rows) => rows.find((r) => r.player_id === playerId) ?? null)
    );
  }

  private loadAppearancesBucket(bucket: number): Observable<AppearanceHistoryRecord[]> {
    const cached = this.appearancesBucketCache.get(bucket);
    if (cached) return cached;

    const p4 = String(bucket).padStart(4, '0');
    const url = `${APPEARANCES_BASE}/b${p4}.jsonl`;

    const req$ = this.http.get(url, { responseType: 'text' }).pipe(
      map((txt) => parseJsonOrJsonl<AppearanceHistoryRecord>(txt)),
      shareReplay(1)
    );

    this.appearancesBucketCache.set(bucket, req$);
    return req$;
  }

  private extractPlayerId(tmUrl: string | null | undefined): number | null {
    if (!tmUrl) return null;
    const m = String(tmUrl).match(/\/spieler\/(\d+)/);
    return m ? Number(m[1]) : null;
  }
}
