export interface Contact {
  id: string;
  name: string;
  email: string;
}

export interface GroupMember extends Contact {}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
}

export interface Invitation {
  id: string;
  instrumentId: string;
  emails: string[];
  sentAt: string;
}

export interface CreateInvitationDto {
  emails: string[];
}
