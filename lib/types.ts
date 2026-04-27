export type SubmissionStatus = "pending" | "graded";
export type ExportEntity = "users" | "submissions" | "results";

export interface AdminStats {
  registrations: number;
  submissions: number;
  graded: number;
  plagiarismFlags: number;
}

export interface DailySubmissionPoint {
  dayNumber: number;
  submissions: number;
}

export interface RegionalParticipationPoint {
  region: string;
  participants: number;
}

export interface GradingQueueItem {
  submissionId: string;
  participantName: string;
  region: string;
  taskTitle: string;
  dayNumber: number;
  aiScore: number;
  status: SubmissionStatus;
  submittedAt: string;
}

export interface PlagiarismFlagItem {
  sourceType: "work_link" | "prompt_text";
  duplicatedValue: string;
  duplicateCount: number;
  submissionIds: string[];
}

export interface AdminDashboardData {
  stats: AdminStats;
  submissionsByDay: DailySubmissionPoint[];
  regionalParticipation: RegionalParticipationPoint[];
  gradingQueue: GradingQueueItem[];
  plagiarismFlags: PlagiarismFlagItem[];
}
