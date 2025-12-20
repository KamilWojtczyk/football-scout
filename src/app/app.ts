import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { HeaderComponent } from './header/header.component';
import { DataService } from './data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenubarModule, HeaderComponent],
  templateUrl: 'app.html',
})
export class App implements OnInit {
  private dataService = inject(DataService);

  ngOnInit(): void {
    this.dataService.getInjuries().subscribe();
  }
}
