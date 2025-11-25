import { Routes } from '@angular/router';
import { SquadPlanningComponent } from './squad/squad-planning.component';
import { PlayersListComponent } from './players/players-list.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'players' },
  { path: 'players', component: PlayersListComponent },
  { path: 'squad', component: SquadPlanningComponent },
  { path: '**', redirectTo: 'players' },
];
