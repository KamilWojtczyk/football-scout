import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Manifest, PlayerRow } from './types';
import { Observable } from 'rxjs';

const BASE = 'https://kamilwojtczyk.github.io/football-data-public/data/json';

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  getManifest(): Observable<Manifest> {
    return this.http.get<Manifest>(`${BASE}/manifest.json`);
  }
  getTab(file: string): Observable<PlayerRow[]> {
    return this.http.get<PlayerRow[]>(`${BASE}/${file}`);
  }
}
