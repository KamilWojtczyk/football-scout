import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../data.service';
import { InjuryHistoryRecord, InjuryRow } from '../../../types';
import {
  BODY_PART_LABELS,
  INJURY_BODY_MARKERS,
  INJURY_TO_BODY_PART_RULES,
} from '../player-overview.constants';
import { BodyPartKey } from '../player-overview.types';

interface EnrichedInjury extends InjuryRow {
  body_part: BodyPartKey;
  timestamp: number;
}

@Component({
  selector: 'app-player-injuries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-injuries.component.html',
  styleUrls: ['./player-injuries.component.scss'],
})
export class PlayerInjuriesComponent implements OnChanges {
  @Input() tmUrl: string | null | undefined;

  private dataService = inject(DataService);

  injuryHistory: InjuryHistoryRecord | null = null;
  allPlayerInjuries: EnrichedInjury[] = [];
  injuriesLoading = false;
  selectedBodyPart: BodyPartKey = 'all';

  readonly markers = INJURY_BODY_MARKERS;
  readonly BODY_PART_LABELS = BODY_PART_LABELS;

  partCountsMap: Partial<Record<BodyPartKey, number>> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tmUrl']) {
      const tmId = this.extractTmPlayerId(this.tmUrl);
      if (tmId) {
        this.loadInjuriesForPlayerId(tmId);
      } else {
        this.resetInjuries();
      }
    }
  }

  private extractTmPlayerId(tmUrl?: string | null): number | null {
    if (!tmUrl) return null;
    const m = tmUrl.match(/spieler\/(\d+)/i);
    return m ? Number(m[1]) : null;
  }

  private resetInjuries() {
    this.injuryHistory = null;
    this.allPlayerInjuries = [];
    this.selectedBodyPart = 'all';
    this.partCountsMap = {};
  }

  private loadInjuriesForPlayerId(playerId: number) {
    this.injuriesLoading = true;
    this.resetInjuries();

    this.dataService.getInjuries().subscribe({
      next: (all: InjuryHistoryRecord[]) => {
        const record = all.find((r) => r.player_id === playerId);
        if (record) {
          this.injuryHistory = record;
          this.allPlayerInjuries = (record.injuries || [])
            .map((inj) => ({
              ...inj,
              body_part: this.mapInjuryToBodyPart(inj.injury),
              timestamp: this.parseTmDate(inj.from),
            }))
            .sort((a, b) => b.timestamp - a.timestamp);

          this.calculatePartCounts();
        }
      },
      error: () => {
        this.resetInjuries();
      },
      complete: () => {
        this.injuriesLoading = false;
      },
    });
  }

  private mapInjuryToBodyPart(name: string): BodyPartKey {
    const s = (name ?? '').trim();
    if (!s) return 'other';
    for (const rule of INJURY_TO_BODY_PART_RULES) {
      for (const re of rule.re) {
        if (re.test(s)) return rule.part;
      }
    }
    return 'other';
  }

  private parseTmDate(d: string): number {
    const m = (d ?? '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return 0;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
  }

  private calculatePartCounts() {
    const counts: any = {};
    for (const inj of this.allPlayerInjuries) {
      counts[inj.body_part] = (counts[inj.body_part] ?? 0) + 1;
    }
    this.partCountsMap = counts;
  }

  get partCounts(): Partial<Record<BodyPartKey, number>> {
    return this.partCountsMap;
  }

  selectBodyPart(part: BodyPartKey) {
    this.selectedBodyPart = part;
  }

  get selectedPartLabel() {
    return BODY_PART_LABELS[this.selectedBodyPart];
  }

  get selectedInjuries() {
    if (this.selectedBodyPart === 'all') return this.allPlayerInjuries;
    return this.allPlayerInjuries.filter((i) => i.body_part === this.selectedBodyPart);
  }

  getActiveBodyParts(): BodyPartKey[] {
    const counts = this.partCounts;
    const parts: BodyPartKey[] = [
      'head',
      'neck',
      'shoulder',
      'arm',
      'hand',
      'chest',
      'back',
      'abdomen',
      'hip',
      'thigh',
      'knee',
      'calf',
      'ankle',
      'foot',
    ];
    return parts.filter((p) => (counts[p] ?? 0) > 0);
  }

  hasInjury(part: BodyPartKey): boolean {
    return (this.partCounts[part] ?? 0) > 0;
  }
}
