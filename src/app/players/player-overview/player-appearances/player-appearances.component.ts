import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../data.service';
import { AppearanceHistoryRecord, AppearanceCompetition } from '../../../types';
import { FormsModule } from '@angular/forms';

import {
  Agg,
  emptyAgg,
  addTotals,
  addSummary,
  clampPct,
} from './player-appearances.types';

@Component({
  selector: 'app-player-appearances',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './player-appearances.component.html',
  styleUrls: ['./player-appearances.component.scss'],
})
export class PlayerAppearancesComponent implements OnChanges {
  @Input() tmUrl?: string | null;

  private data = inject(DataService);

  loading = false;
  record: AppearanceHistoryRecord | null = null;

  selectedSeason: 'all' | string = 'all';

  seasons: string[] = [];
  aggAll: Agg = emptyAgg();
  aggBySeason: Record<string, Agg> = {};

  ngOnChanges() {
    this.fetch();
  }

  private fetch() {
    this.record = null;
    this.loading = true;
    this.selectedSeason = 'all';

    this.data.getAppearancesByTmUrl(this.tmUrl).subscribe({
      next: (rec) => {
        this.record = rec;
        this.loading = false;
        this.rebuild();
      },
      error: () => {
        this.loading = false;
        this.record = null;
      },
    });
  }

  private rebuild() {
    this.seasons = [];
    this.aggAll = emptyAgg();
    this.aggBySeason = {};

    const rec = this.record;
    if (!rec?.seasons?.length) return;

    this.seasons = rec.seasons.map((s) => s.season);

    for (const s of rec.seasons) {
      const agg = emptyAgg();
      for (const comp of s.competitions || []) {
        addTotals(agg, comp.totals);
        addSummary(agg, comp);
      }
      this.aggBySeason[s.season] = agg;

      Object.assign(this.aggAll, {
        matches_total: this.aggAll.matches_total + agg.matches_total,
        matches_played: this.aggAll.matches_played + agg.matches_played,
        minutes_played: this.aggAll.minutes_played + agg.minutes_played,
        goals: this.aggAll.goals + agg.goals,
        assists: this.aggAll.assists + agg.assists,
        yellow_cards: this.aggAll.yellow_cards + agg.yellow_cards,
        second_yellow_cards: this.aggAll.second_yellow_cards + agg.second_yellow_cards,
        red_cards: this.aggAll.red_cards + agg.red_cards,

        squad: this.aggAll.squad + agg.squad,
        starting_eleven: this.aggAll.starting_eleven + agg.starting_eleven,
        substituted_in: this.aggAll.substituted_in + agg.substituted_in,
        on_the_bench: this.aggAll.on_the_bench + agg.on_the_bench,
        suspended: this.aggAll.suspended + agg.suspended,
        injured: this.aggAll.injured + agg.injured,
        absence: this.aggAll.absence + agg.absence,
      });
    }
  }

  get activeAgg(): Agg {
    if (this.selectedSeason === 'all') return this.aggAll;
    return this.aggBySeason[this.selectedSeason] || emptyAgg();
  }

  formatSeasonLabel(season: string): string {
    if (!season) return '';
    if (season.includes('/')) return season;
    
    const year = parseInt(season, 10);
    if (!isNaN(year)) {
      const nextYear = (year + 1) % 100;
      return `${year}/${nextYear < 10 ? '0' : ''}${nextYear}`;
    }
    return season;
  }

  get startingPct(): number {
    const a = this.activeAgg;
    return clampPct(a.matches_total ? (a.starting_eleven / a.matches_total) * 100 : 0);
  }

  get minutesPct(): number {
    const a = this.activeAgg;
    const maxMinutes = a.matches_total * 90;
    return clampPct(maxMinutes ? (a.minutes_played / maxMinutes) * 100 : 0);
  }

  get goalPct(): number {
    const a = this.activeAgg;
    const ga = a.goals + a.assists;
    return clampPct(a.matches_total ? (ga / a.matches_total) * 100 : 0);
  }

  get seasonRows(): Array<{ season: string; agg: Agg }> {
    return this.seasons.map((s) => ({ season: s, agg: this.aggBySeason[s] || emptyAgg() }));
  }

  get competitionRows(): AppearanceCompetition[] {
    const rec = this.record;
    if (!rec) return [];
    if (this.selectedSeason === 'all') return [];
    return rec.seasons.find((s) => s.season === this.selectedSeason)?.competitions || [];
  }
}
