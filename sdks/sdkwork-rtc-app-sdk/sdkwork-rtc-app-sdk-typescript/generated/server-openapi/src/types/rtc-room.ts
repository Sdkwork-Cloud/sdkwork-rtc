export interface RtcRoom {
  id: string;
  tenantId: string;
  organizationId: string;
  ownerUserId: string;
  title: string;
  status: 'active' | 'archived' | 'disabled';
}
