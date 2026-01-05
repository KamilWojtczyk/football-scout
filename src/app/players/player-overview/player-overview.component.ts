import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { switchMap, map, forkJoin } from 'rxjs';

import { DataService } from '../../data.service';
import { Manifest, PlayerRow } from '../../types';
import { daysLeftFromIso, contractDaysLeftClass, formatDaysLeft } from '../../util';
import { PlayerOverviewService } from './player-overview.service';
import { POLAR_GROUP_STYLES, POLAR_GROUP_LABELS } from './player-overview.constants';
import { PhysicalChartDef, PolarGroupKey } from './player-overview.types';
import { PlayerInjuriesComponent } from './player-injuries/player-injuries.component';
import { PlayerAppearancesComponent } from './player-appearances/player-appearances.component';

@Component({
  selector: 'app-player-overview',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule,
    PlayerInjuriesComponent,
    PlayerAppearancesComponent,
    PlayerAppearancesComponent,
  ],
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
  legendGroups: PolarGroupKey[] = [];

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
}
