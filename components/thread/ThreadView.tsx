import React from "react";
import { NewThread, DefaultTheme } from "@bobaboard/ui-components";
import ThreadPost, { scrollToPost } from "./ThreadPost";
import debug from "debug";
import {
  ThreadContextType,
  withThreadData,
} from "components/thread/ThreadQueryHook";
import { PostType } from "../../types/Types";
import Link from "next/link";
import classnames from "classnames";
import CommentsThread, { commentHandlers } from "./CommentsThread";
import { usePageDetails, ThreadPageDetails } from "utils/router-utils";
import { useAuth } from "components/Auth";
import { useStemOptions } from "components/hooks/useStemOptions";
import { useBoardContext } from "components/BoardContext";
import { useThreadEditors } from "components/editors/withEditors";
import { useCollapseManager } from "./useCollapseManager";

const log = debug("bobafrontend:threadLevel-log");
const info = debug("bobafrontend:threadLevel-info");

export const getCommentThreadId = (postId: string) => {
  return `${postId}_comment`;
};
export const extractPostId = (levelId: string) => {
  if (levelId.indexOf(`_comment`) === -1) {
    return levelId;
  }
  return levelId.substring(0, levelId.indexOf(`_comment`));
};

export const scrollToComment = (commentId: string, color: string) => {
  log(`Beaming up to comment with id ${commentId}`);
  const element: HTMLElement | null = document.querySelector(
    `.comment[data-comment-id='${commentId}']`
  );
  if (!element) {
    return;
  }
  const observer = new IntersectionObserver((observed) => {
    if (observed[0].isIntersecting) {
      commentHandlers.get(commentId)?.highlight(color), observer.disconnect();
    }
  });
  observer.observe(element);
  element.classList.add("outline-hidden");
  window.scroll({
    top:
      element.getBoundingClientRect().top +
      window.pageYOffset -
      (DefaultTheme.HEADER_HEIGHT_PX + 2),
    behavior: "smooth",
  });
};

// const MemoizedThreadIndent = React.memo(ThreadIndent);
const ThreadLevel: React.FC<{
  post: PostType;
  postsMap: Map<string, { children: PostType[]; parent: PostType | null }>;
  level?: number;
  isLoggedIn: boolean;
  lastOf?: { level: number; postId: string }[];
  showThread?: boolean;
  isCollapsed: (levelId: string) => boolean;
  onToggleCollapseLevel: (levelId: string) => void;
}> = (props) => {
  const {
    onNewComment,
    onNewContribution,
    onEditContribution,
  } = useThreadEditors();
  info(
    `Rendering subtree at level ${props.level} starting with post with id ${props.post.postId}`
  );

  const hasNestedContributions = props.postsMap.has(props.post.postId);
  // When there's only comments replying to the post, then the indentation is just made of
  // the comments themselves.
  // If there's comments and contributions, then the contributions are indented immediately
  // underneath this post, and the comments thread, is another extra indent at the beginning
  // of the contributions indent.
  // It's easier to reason about this when realizing that comments can be collapsed independently
  // from other contributions, and thus need their own special "indent level".
  const commentsThread = (
    <NewThread.Indent
      id={
        hasNestedContributions
          ? getCommentThreadId(props.post.postId)
          : props.post.postId
      }
      collapsed={props.isCollapsed(
        hasNestedContributions
          ? getCommentThreadId(props.post.postId)
          : props.post.postId
      )}
    >
      <CommentsThread parentPostId={props.post.postId} />
    </NewThread.Indent>
  );

  const hasComments = !!props.post.comments?.length;
  return (
    <>
      <NewThread.Item key={props.post.postId}>
        {(setHandler, boundaryId) => (
          <>
            <div
              className={classnames("post", {
                "with-indent": props.postsMap.has(props.post.postId),
              })}
            >
              <ThreadPost
                post={props.post}
                isLoggedIn={props.isLoggedIn}
                onNewContribution={onNewContribution}
                onNewComment={onNewComment}
                onEditPost={onEditContribution}
                avatarRef={setHandler}
                onNotesClick={props.onToggleCollapseLevel}
              />
            </div>
            {!hasNestedContributions && hasComments && commentsThread}
            {hasNestedContributions && (
              <NewThread.Indent
                id={props.post.postId}
                collapsed={props.isCollapsed(props.post.postId)}
              >
                {hasComments && (
                  <NewThread.Item parentBoundary={boundaryId}>
                    {commentsThread}
                  </NewThread.Item>
                )}
                {props.postsMap
                  .get(props.post.postId)
                  ?.children.flatMap((post: PostType) => (
                    <ThreadLevel key={post.postId} {...props} post={post} />
                  ))}
              </NewThread.Indent>
            )}
          </>
        )}
      </NewThread.Item>
      <style jsx>
        {`
          .level {
            width: 100%;
          }
          .post {
            margin-top: 30px;
            margin-bottom: 15px;
            position: relative;
            pointer-events: none !important;
          }
        `}
      </style>
    </>
  );
};

interface ThreadViewProps extends ThreadContextType {
  onTotalPostsChange: (total: number) => void;
}

const ThreadView: React.FC<ThreadViewProps> = ({
  currentRoot,
  parentChildrenMap,
  chronologicalPostsSequence,
  ...props
}) => {
  const {
    postId,
    threadBaseUrl,
    slug: boardSlug,
    threadId,
  } = usePageDetails<ThreadPageDetails>();
  const { isLoggedIn } = useAuth();
  const { onNewContribution } = useThreadEditors();
  const boardData = useBoardContext(boardSlug);

  const {
    onCollapseLevel,
    onUncollapseLevel,
    getCollapseReason,
    onToggleCollapseLevel,
    isCollapsed,
  } = useCollapseManager();

  const getStemOptions = useStemOptions({
    boardSlug,
    threadId,
    onCollapse: onCollapseLevel,
    onScrollTo: (levelId) => {
      if (!levelId) {
        return;
      }
      scrollToPost(extractPostId(levelId), boardData?.accentColor);
    },
    onReply: (levelId) => {
      if (!levelId) {
        return;
      }
      onNewContribution(extractPostId(levelId));
    },
  });

  React.useEffect(() => {
    props.onTotalPostsChange(chronologicalPostsSequence.length);
  }, [chronologicalPostsSequence]);

  if (!currentRoot) {
    return <div />;
  }
  return (
    <div className="thread-container">
      <div
        className={classnames("whole-thread", {
          visible: !!postId,
        })}
      >
        <Link
          as={`${threadBaseUrl}${window.location.search}`}
          href={`/[boardId]/thread/[...threadId]`}
          shallow={true}
        >
          <a>Show whole thread</a>
        </Link>
      </div>
      <NewThread
        onCollapseLevel={onCollapseLevel}
        onUncollapseLevel={onUncollapseLevel}
        getCollapseReason={getCollapseReason}
        getStemOptions={getStemOptions}
      >
        <ThreadLevel
          post={currentRoot}
          postsMap={parentChildrenMap}
          isLoggedIn={isLoggedIn}
          onToggleCollapseLevel={onToggleCollapseLevel}
          isCollapsed={isCollapsed}
        />
      </NewThread>
      <style jsx>{`
        .whole-thread {
          margin-bottom: -5px;
          padding-top: 10px;
          display: none;
        }
        .whole-thread.visible {
          display: block;
        }
        .whole-thread a {
          color: white;
          font-size: 13px;
        }
        .thread-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

ThreadView.whyDidYouRender = true;

const MemoizedThreadView = React.memo(withThreadData(ThreadView));
MemoizedThreadView.whyDidYouRender = true;
export default MemoizedThreadView;
