import React from 'react';
import type { Thread } from '../../data/mockData';

interface ThreadItemProps {
    thread: Thread;
}

export const ThreadItem: React.FC<ThreadItemProps> = ({ thread }) => {
    return (
        <div className="thread-item">
            <img src={thread.author.avatar} alt={thread.author.username} className="thread-avatar" />
            <div className="thread-content">
                <div className="thread-meta-top">
                    {thread.isPinned && (
                        <span className="thread-badge pinned">
                            <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                            Sabit
                        </span>
                    )}
                    <span className="thread-badge category">
                        {thread.categoryName}
                    </span>
                    <span className="thread-date">• {thread.createdAt}</span>
                </div>

                <h3 className="thread-title">
                    {thread.title}
                </h3>

                <div className="thread-meta-bottom">
                    <span className="meta-user">
                        @{thread.author.username}
                    </span>
                    <span className="meta-stat">
                        <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        {thread.viewCount}
                    </span>
                    <span className="meta-stat">
                        <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        {thread.replyCount} Cevap
                    </span>
                    <div className="spacer"></div>
                    <div className="thread-tags">
                        {thread.tags.map(tag => (
                            <span key={tag} className="thread-tag">#{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
