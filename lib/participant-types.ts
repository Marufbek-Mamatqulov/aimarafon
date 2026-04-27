export type SubmissionStatus = "pending" | "graded";

export interface ParticipantTask {
  id: string;
  day_number: number;
  title: string;
  description: string;
  video_url: string | null;
  instruction_markdown: string;
  deadline: string;
}

export interface ParticipantSubmission {
  id: string;
  task_id: string;
  prompt_text: string;
  work_link: string | null;
  file_url: string | null;
  status: SubmissionStatus;
  submitted_at: string;
  final_score: number | null;
  ai_score: number | null;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  region: string;
  total_points: number;
  rank: number;
}

export interface ParticipantProfile {
  id: string;
  full_name: string;
  email: string;
  role: "participant" | "expert" | "admin";
}
