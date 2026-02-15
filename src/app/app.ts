import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { HeaderComponent } from './header/header.component';
import { DataService } from './data.service';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenubarModule, HeaderComponent],
  templateUrl: 'app.html',
})
export class App implements OnInit {
  private dataService = inject(DataService);
  private router = inject(Router);
  private authService = inject(AuthService);

  get isLoginPage(): boolean {
    return this.router.url === '/login';
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.dataService.getInjuries().subscribe();
    }
  }
}
