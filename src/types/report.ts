// Report Enums as const objects (TypeScript erasableSyntaxOnly uyumlu)
export const ReportReason = {
    Spam: 1,
    Harassment: 2,
    InappropriateContent: 3,
    Misinformation: 4,
    Other: 5
} as const;

export type ReportReason = typeof ReportReason[keyof typeof ReportReason];

export const ReportStatus = {
    Pending: 1,
    Reviewed: 2,
    Resolved: 3,
    Rejected: 4
} as const;

export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

// Report DTOs
export interface CreateReportDto {
    reportedUserId?: number | null;
    reportedPostId?: number | null;
    reportedThreadId?: number | null;
    reason: ReportReason;
    description?: string;
}

export interface UpdateReportStatusDto {
    status: ReportStatus;
    adminNote?: string;
}

export interface Report {
    id: number;
    reporterId: number;
    reporterUsername?: string;
    reporterEmail?: string;
    reportedUserId?: number | null;
    reportedUsername?: string;
    reportedPostId?: number | null;
    postTitle?: string;
    reportedThreadId?: number | null;
    threadTitle?: string;
    reason: ReportReason;
    description?: string;
    status: ReportStatus;
    reviewedByUserId?: number | null;
    reviewedByUsername?: string;
    reviewedAt?: string;
    adminNote?: string;
    createdAt: string;
}

// My Reports için basitleştirilmiş response
export interface MyReport {
    id: number;
    reporterUsername: string;
    reportedType: 'User' | 'Post' | 'Thread';
    reportedInfo: string;
    reason: ReportReason;
    status: ReportStatus;
    createdAt: string;
}

export interface PaginatedReportResponse {
    items: MyReport[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

// Helper fonksiyonlar
export const getReportReasonText = (reason: ReportReason): string => {
    switch (reason) {
        case ReportReason.Spam:
            return 'Spam';
        case ReportReason.Harassment:
            return 'Taciz/Hakaret';
        case ReportReason.InappropriateContent:
            return 'Uygunsuz İçerik';
        case ReportReason.Misinformation:
            return 'Yanıltıcı Bilgi';
        case ReportReason.Other:
            return 'Diğer';
        default:
            return 'Bilinmiyor';
    }
};

export const getReportStatusText = (status: ReportStatus): string => {
    switch (status) {
        case ReportStatus.Pending:
            return 'Beklemede';
        case ReportStatus.Reviewed:
            return 'İncelendi';
        case ReportStatus.Resolved:
            return 'Çözüldü';
        case ReportStatus.Rejected:
            return 'Reddedildi';
        default:
            return 'Bilinmiyor';
    }
};
