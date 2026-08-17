export interface StoryViewer {
  id: string;
  name: string;
  avatarUrl: string;
  viewedAt: string;
  isFan: boolean;
}

export interface StoryItem {
  id: string;
  groupId: string;
  groupName: string;
  authorName: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  locationTag?: string;
  musicTag?: string;
  createdAt: string;
  expiresAt: string; // ISO 24h later
  viewsCount: number;
  viewers: StoryViewer[];
  isSeenByMe?: boolean;
}
