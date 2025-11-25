import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenubarModule, HeaderComponent],
  templateUrl: 'app.html',
})
export class App {
  items = [
    { label: 'Players List', routerLink: '/players', icon: 'pi pi-users', active: true },
    { label: 'Squad Planning', routerLink: '/squad', icon: 'pi pi-sitemap' },
  ];
}
