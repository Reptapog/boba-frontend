export interface CommentType {
  commentId: string;
  parentCommentId: string | null;
  chainParentId: string | null;
  secretIdentity: {
    name: string;
    avatar: string;
  };
  userIdentity?: {
    name: string;
    avatar: string;
  };
  content: string;
  created: string;
  isNew: boolean;
}

export interface PostType {
  postId: string;
  threadId: string;
  parentPostId: string;
  secretIdentity: {
    name: string;
    avatar: string;
  };
  userIdentity?: {
    name: string;
    avatar: string;
  };
  created: string;
  content: string;
  options: {
    wide?: boolean;
  };
  tags: {
    whisperTags: string[];
    indexTags: string[];
    categoryTags: string[];
    contentWarnings: string[];
  };
  comments?: CommentType[];
  postsAmount: number;
  commentsAmount: number;
  threadsAmount: number;
  newPostsAmount: number;
  newCommentsAmount: number;
  isNew: boolean;
  isOwn: boolean;
}
export interface ThreadType {
  posts: PostType[];
  threadId: string;
  isNew: boolean;
  newPostsAmount: number;
  newCommentsAmount: number;
  totalCommentsAmount: number;
  totalPostsAmount: number;
  directThreadsAmount: number;
  lastActivity?: string;
  muted: boolean;
  hidden: boolean;
  defaultView: "thread" | "gallery" | "timeline";
  personalIdentity?: {
    name: string;
    avatar: string;
  };
}

export interface BoardActivityResponse {
  nextPageCursor: string | null;
  // This thread will only have the top post and no comments.
  activity: ThreadType[];
}

export interface BoardDescription {
  id?: number;
  index: number;
  title: string;
  type: "text" | "category_filter";
  description?: string;
  categories?: string[];
}

export interface Role {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Permissions {
  canEditBoardData: boolean;
}

export interface BoardData {
  slug: string;
  avatarUrl: string;
  tagline: string;
  accentColor: string;
  descriptions: BoardDescription[];
  muted: boolean;
  permissions?: Permissions;
  postingIdentities?: Role[];
}

export interface PostData {
  content: string;
  forceAnonymous: boolean;
  whisperTags: string[];
  indexTags: string[];
  categoryTags: string[];
  contentWarnings: string[];
  identityId?: string;
}

export interface CommentData {
  content: string;
  forceAnonymous: boolean;
  replyToCommentId: string | null;
}

export interface CategoryFilterType {
  name: string;
  active: boolean;
}

export interface ThreadPostInfoType {
  children: PostType[];
  post: PostType;
  parent: PostType | null;
}

export interface ThreadCommentInfoType {
  roots: CommentType[];
  parentChainMap: Map<string, CommentType>;
  parentChildrenMap: Map<string, CommentType[]>;
}

export enum THREAD_VIEW_MODES {
  THREAD,
  MASONRY,
  TIMELINE,
}
