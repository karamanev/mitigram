import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Contact, Group, Invitation } from '@mitigram/shared';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3000/api';

  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.base}/contacts`);
  }

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.base}/groups`);
  }

  createInvitation(instrumentId: string, emails: string[]): Observable<Invitation> {
    return this.http.post<Invitation>(`${this.base}/instruments/${instrumentId}/invitations`, {
      emails,
    });
  }
}
