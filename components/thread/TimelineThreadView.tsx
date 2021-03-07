import React from "react";
import { NewThread, SegmentedButton } from "@bobaboard/ui-components";
import debug from "debug";
import {
  ThreadContextType,
  withThreadData,
} from "components/thread/ThreadQueryHook";
import classnames from "classnames";
import CommentsThread from "./CommentsThread";
import ThreadPost, { scrollToPost } from "./ThreadPost";
import { ThreadPageDetails, usePageDetails } from "utils/router-utils";
import { useAuth } from "components/Auth";
import { useStemOptions } from "components/hooks/useStemOptions";
import { extractPostId } from "./ThreadView";
import { useBoardContext } from "components/BoardContext";
import { TIMELINE_VIEW_MODE, useThreadView } from "./useThreadView";
import { useThreadEditors } from "components/editors/withEditors";
import { useCollapseManager } from "./useCollapseManager";
//import { useHotkeys } from "react-hotkeys-hook";

// @ts-ignore
const log = debug("bobafrontend:threadLevel-log");

interface TimelineViewProps extends ThreadContextType {
  displayAtMost: number;
  onTotalPostsChange: (total: number) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  chronologicalPostsSequence,
  ...props
}) => {
  const { updatedPosts, allPosts } = React.useMemo(() => {
    const updatedPosts = chronologicalPostsSequence.filter(
      (post) => post.isNew || post.newCommentsAmount > 0
    );

    return {
      allPosts: chronologicalPostsSequence,
      updatedPosts,
    };
  }, [chronologicalPostsSequence]);
  const { timelineViewMode, setTimelineViewMode } = useThreadView();
  const {
    onNewComment,
    onNewContribution,
    onEditContribution,
  } = useThreadEditors();
  const {
    onCollapseLevel,
    onUncollapseLevel,
    onToggleCollapseLevel,
    getCollapseReason,
    isCollapsed,
  } = useCollapseManager();

  const { slug: boardSlug, threadId } = usePageDetails<ThreadPageDetails>();
  const boardData = useBoardContext(boardSlug);
  const { isLoggedIn } = useAuth();

  const displayPosts =
    timelineViewMode === TIMELINE_VIEW_MODE.ALL
      ? allPosts
      : timelineViewMode == TIMELINE_VIEW_MODE.LATEST
      ? [...allPosts].reverse()
      : updatedPosts;

  const { onTotalPostsChange } = props;
  React.useEffect(() => {
    onTotalPostsChange(displayPosts.length);
  }, [displayPosts.length, onTotalPostsChange]);

  const getStemOptions = useStemOptions({
    boardSlug,
    threadId,
    onCollapse: (levelId) => {
      onCollapseLevel(levelId);
    },
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

  const viewChangeOptions = React.useMemo(
    () => [
      {
        id: TIMELINE_VIEW_MODE.NEW,
        label: "New",
        updates: updatedPosts.length > 0 ? updatedPosts.length : undefined,
        onClick: () => setTimelineViewMode(TIMELINE_VIEW_MODE.NEW),
      },
      {
        id: TIMELINE_VIEW_MODE.LATEST,
        label: "Latest",
        onClick: () => setTimelineViewMode(TIMELINE_VIEW_MODE.LATEST),
      },
      {
        id: TIMELINE_VIEW_MODE.ALL,
        label: `All (${allPosts.length})`,
        onClick: () => setTimelineViewMode(TIMELINE_VIEW_MODE.ALL),
      },
    ],
    [updatedPosts, setTimelineViewMode, allPosts.length]
  );

  return (
    <div
      className={classnames("timeline-container", {
        "logged-in": isLoggedIn,
      })}
    >
      <div className="timeline-views">
        <SegmentedButton
          options={viewChangeOptions}
          selected={timelineViewMode}
        />
      </div>
      <div>
        {displayPosts.length == 0 && (
          <div className="empty">No new or updated post!</div>
        )}
        {displayPosts
          .filter((_, index) => index < props.displayAtMost)
          .map((post) => (
            <div className="thread" key={post.postId}>
              <NewThread
                onCollapseLevel={onCollapseLevel}
                onUncollapseLevel={onUncollapseLevel}
                getCollapseReason={getCollapseReason}
                getStemOptions={getStemOptions}
              >
                {(setThreadBoundary) => (
                  <>
                    <div className="post" key={post.postId}>
                      <ThreadPost
                        post={post}
                        isLoggedIn={isLoggedIn}
                        onNewContribution={onNewContribution}
                        onNewComment={onNewComment}
                        onEditPost={onEditContribution}
                        showThread
                        avatarRef={setThreadBoundary}
                        onNotesClick={onToggleCollapseLevel}
                      />
                    </div>
                    {post.comments && (
                      <NewThread.Indent
                        id={post.postId}
                        collapsed={isCollapsed(post.postId)}
                      >
                        <div className="comments-thread">
                          <CommentsThread parentPostId={post.postId} />
                        </div>
                      </NewThread.Indent>
                    )}
                  </>
                )}
              </NewThread>
            </div>
          ))}
      </div>
      <style jsx>{`
        .timeline-container {
          width: 100%;
          text-align: center;
          max-width: 550px;
          margin: 0 auto;
        }
        .post {
          position: relative;
          z-index: 1;
        }
        .thread {
          margin-bottom: 20px;
        }
        .empty {
          color: white;
          width: 100%;
        }
        .timeline-views {
          margin: 20px auto;
          max-width: 300px;
        }
        .button {
          display: none;
        }
        .logged-in .button {
          display: block;
        }
      `}</style>
    </div>
  );
};

export default withThreadData(TimelineView);
