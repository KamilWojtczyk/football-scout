import { Routes } from '@angular/router';
import { SquadPlanningComponent } from './squad/squad-planning.component';
import { PlayersListComponent } from './players/players-list.component';
import { PlayerOverviewComponent } from './players/player-overview/player-overview.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'players' },
  { path: 'players', component: PlayersListComponent },
  { path: 'players/:tab/:name', component: PlayerOverviewComponent },
  { path: 'squad', component: SquadPlanningComponent },
  { path: '**', redirectTo: 'players' },
];
