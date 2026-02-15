import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  shake = false;

  private auth = inject(AuthService);
  private router = inject(Router);

  onSubmit(): void {
    this.error = '';
    this.shake = false;

    if (!this.username || !this.password) {
      this.showError('Please enter username and password');
      return;
    }

    const success = this.auth.login(this.username, this.password);
    if (success) {
      this.router.navigate(['/players']);
    } else {
      this.showError('Invalid username or password');
    }
  }

  private showError(msg: string): void {
    this.error = msg;
    this.shake = true;
    setTimeout(() => (this.shake = false), 600);
  }
}
