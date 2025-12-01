import { Component } from '@angular/core';
import { Manifest } from '../types';
import { DataService } from '../data.service';

import { Router, RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [CommonModule, RouterModule, TooltipModule],
  templateUrl: 'header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  manifest: Manifest | null = null;
  loading = false;

  constructor(private data: DataService, public router: Router) {}

  ngOnInit() {
    this.loading = true;
    this.data.getManifest().subscribe({
      next: (m) => {
        this.manifest = m;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get formattedUpdateDate(): string {
    if (!this.manifest?.updated_at) return '';

    try {
      const date = new Date(this.manifest.updated_at);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return this.manifest.updated_at;
    }
  }
}
