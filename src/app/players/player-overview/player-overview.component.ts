import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { switchMap, map, forkJoin } from 'rxjs';

import { DataService } from '../../data.service';
import { InjuryHistoryRecord, Manifest, PlayerRow, InjuryRow } from '../../types';
import { daysLeftFromIso, contractDaysLeftClass, formatDaysLeft } from '../../util';
import { PlayerOverviewService } from './player-overview.service';
import {
  POLAR_GROUP_STYLES,
  POLAR_GROUP_LABELS,
  BODY_PART_LABELS,
  INJURY_BODY_MARKERS,
  INJURY_TO_BODY_PART_RULES,
} from './player-overview.constants';
import { PhysicalChartDef, PolarGroupKey, BodyPartKey } from './player-overview.types';

interface EnrichedInjury extends InjuryRow {
  body_part: BodyPartKey;
  timestamp: number;
}

@Component({
  selector: 'app-player-overview',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './player-overview.component.html',
  styleUrls: ['./player-overview.component.scss'],
})
export class PlayerOverviewComponent implements OnInit {
  dataLabelPlugin = ChartDataLabels;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  private playerOverviewService = inject(PlayerOverviewService);

  player: PlayerRow | null = null;
  tabName: string | null = null;
  manifest: Manifest | null = null;

  private tabRows: PlayerRow[] = [];

  // Chart Data
  polarData: any;
  polarOptions: ChartOptions | null = null;
  polarPlugins: any[] = [ChartDataLabels];
  trendData: any;
  trendOptions: ChartOptions | null = null;
  trendPlugins: any[] = [];
  physicalCharts: PhysicalChartDef[] = [];
  valueForMoneyStars = 0;

  contractDays: number | null = null;
  contractBadgeClass = '';
  contractBadgeLabel = '';

  readonly polarGroupStyles = POLAR_GROUP_STYLES;
  readonly polarGroupLabels = POLAR_GROUP_LABELS;
  readonly BODY_PART_LABELS = BODY_PART_LABELS;
  legendGroups: PolarGroupKey[] = [];

  injuryHistory: InjuryHistoryRecord | null = null;
  allPlayerInjuries: EnrichedInjury[] = [];
  injuriesLoading = false;
  selectedBodyPart: BodyPartKey = 'all';

  readonly markers = INJURY_BODY_MARKERS;

  get isGoalkeeperTab(): boolean {
    return (this.tabName ?? '').toLowerCase().includes('keeper');
  }

  ngOnInit() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.tabName = params.get('tab');
          const playerName = params.get('name');

          return forkJoin({
            manifest: this.dataService.getManifest(),
          }).pipe(
            switchMap(({ manifest }) => {
              this.manifest = manifest;
              const tab = manifest.tabs.find((t) => t.name === this.tabName);
              if (!tab) {
                throw new Error(`Tab ${this.tabName} not found`);
              }
              return this.dataService
                .getTab(tab.file)
                .pipe(map((rows) => ({ rows, tab, playerName })));
            })
          );
        })
      )
      .subscribe({
        next: ({ rows, tab, playerName }) => {
          this.tabRows = rows || [];
          this.player = this.tabRows.find((r) => r['player_name'] === playerName) || null;

          if (this.player) {
            this.initContractMeta();
            this.valueForMoneyStars = this.playerOverviewService.getValueForMoneyStars(
              this.player,
              this.tabRows
            );

            const polarParams = this.playerOverviewService.getPolarChart(
              this.player,
              tab.columns,
              this.tabName
            );
            this.polarData = polarParams.data;
            this.polarOptions = polarParams.options;
            this.legendGroups = polarParams.legendGroups;

            const trendParams = this.playerOverviewService.getTrendChart(
              this.player,
              tab.columns,
              this.tabName
            );
            this.trendData = trendParams.data;
            this.trendOptions = trendParams.options;
            this.trendPlugins = trendParams.plugins;

            this.physicalCharts = this.playerOverviewService.getPhysicalCharts(
              this.player,
              tab.columns,
              this.tabName
            );

            const tmId = this.extractTmPlayerId(this.player['tm_url']);
            if (tmId) {
              this.loadInjuriesForPlayerId(tmId);
            } else {
              this.resetInjuries();
            }
          }
        },
        error: (err) => console.error(err),
      });
  }

  goBack() {
    this.router.navigate(['/players'], { queryParams: { tab: this.tabName } });
  }

  private initContractMeta() {
    const iso = this.player?.['contract_expires'] as string | undefined;
    this.contractDays = daysLeftFromIso(iso);
    this.contractBadgeClass = contractDaysLeftClass(this.contractDays);
    this.contractBadgeLabel = formatDaysLeft(this.contractDays);
  }

  getStarsArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => (i < rating ? 1 : 0));
  }

  getPlayerImage(player: PlayerRow): string {
    const img = player['image_url'] as string | undefined;
    return img && img.length
      ? img
      : 'https://img.a.transfermarkt.technology/portrait/header/default.jpg?lm=1';
  }

  private extractTmPlayerId(tmUrl?: string | null): number | null {
    if (!tmUrl) return null;
    const m = tmUrl.match(/spieler\/(\d+)/i);
    return m ? Number(m[1]) : null;
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

  private parseTmDate(d: string): number {
    const m = (d ?? '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return 0;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
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

  partCountsMap: Partial<Record<BodyPartKey, number>> = {};

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
