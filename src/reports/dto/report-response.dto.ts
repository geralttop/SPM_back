import type { ReportType, ReportStatus, ReportReason } from '../entities/report.entity';
export class ReportResponseDto {
    id: number;
    type: ReportType;
    reason: ReportReason;
    description?: string;
    status: ReportStatus;
    createdAt: Date;
    updatedAt: Date;
    reporter: {
        id: number;
        username: string;
        email: string;
    };
    point?: {
        id: string;
        name: string;
        author: {
            id: number;
            username: string;
        };
    };
    comment?: {
        id: number;
        content: string;
        author: {
            id: number;
            username: string;
        };
    };
    reportedUser?: {
        id: number;
        username: string;
        email: string;
        isBlocked: boolean;
    };
    reviewedBy?: {
        id: number;
        username: string;
    };
    adminNotes?: string;
}
