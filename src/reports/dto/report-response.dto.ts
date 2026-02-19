import type { ReportType, ReportStatus, ReportReason } from '../entities/report.entity';

export class ReportResponseDto {
  id: number;
  type: ReportType;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Информация о том, кто подал жалобу
  reporter: {
    id: number;
    username: string;
    email: string;
  };

  // Информация об объекте жалобы
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

  // Информация о том, кто обработал жалобу
  reviewedBy?: {
    id: number;
    username: string;
  };

  adminNotes?: string;
}