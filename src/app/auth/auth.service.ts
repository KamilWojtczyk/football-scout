import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

const VALID_USERNAME = 'scout';
const VALID_PASSWORD = 'motorlublinscout2026';
const TOKEN_KEY = 'fs_auth_token';
const SECRET = 'football-scout-s3cr3t-k3y-2026';
const TOKEN_EXPIRY_DAYS = 30;

interface TokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router)

  login(username: string, password: string): boolean {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      const token = this.generateToken(username);
      localStorage.setItem(TOKEN_KEY, token);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      if (!payload) return false;

      const now = Date.now();
      return now < payload.exp;
    } catch {
      return false;
    }
  }

  private generateToken(username: string): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Date.now();
    const payload: TokenPayload = {
      sub: username,
      iat: now,
      exp: now + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };

    const encodedHeader = this.base64Encode(JSON.stringify(header));
    const encodedPayload = this.base64Encode(JSON.stringify(payload));
    const signature = this.createSignature(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const expectedSignature = this.createSignature(parts[0], parts[1]);
      if (parts[2] !== expectedSignature) return null;

      const payload = JSON.parse(this.base64Decode(parts[1]));
      return payload as TokenPayload;
    } catch {
      return null;
    }
  }

  private createSignature(header: string, payload: string): string {
    const data = `${header}.${payload}.${SECRET}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return this.base64Encode(hash.toString(16));
  }

  private base64Encode(str: string): string {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  private base64Decode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return decodeURIComponent(
      atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
  }
}
