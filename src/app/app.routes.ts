import { Routes } from '@angular/router';
import { SquadPlanningComponent } from './squad/squad-planning.component';
import { PlayersListComponent } from './players/players-list.component';
import { PlayerOverviewComponent } from './players/player-overview/player-overview.component';
import { LoginComponent } from './auth/login.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canMatch: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'players' },
      { path: 'players', component: PlayersListComponent },
      { path: 'players/:tab/:name', component: PlayerOverviewComponent },
      { path: 'squad', component: SquadPlanningComponent },
      { path: '**', redirectTo: 'players' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
