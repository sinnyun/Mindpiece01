export type Category = '灵感' | '待办' | '随笔' | '堆栈' | '归档';
export type NoteType = 'normal' | 'video' | 'webpage';

export interface NoteVersion {
  id: string;
  name: string;
  timestamp: string;
  type: 'initial' | 'auto-save' | 'branch';
  parentId?: string;
  title: string;
  content: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: Category;
  date: string;
  tags: string[];
  isStack?: boolean;
  childCount?: number;
  imageUrl?: string;
  children?: Note[];
  parentId?: string;
  stackName?: string;
  versions?: NoteVersion[];
  currentVersionId?: string;
  noteType?: NoteType;
  videoUrl?: string;
  webpageUrl?: string;
  webpageScreenshotUrl?: string;
  isPinned?: boolean;
}
