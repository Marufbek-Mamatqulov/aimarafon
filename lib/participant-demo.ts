import type {
  LeaderboardEntry,
  ParticipantProfile,
  ParticipantSubmission,
  ParticipantTask,
} from "@/lib/participant-types";

const now = new Date();

function deadlineInDays(days: number) {
  const date = new Date(now);
  date.setDate(now.getDate() + days);
  return date.toISOString();
}

export const demoProfile: ParticipantProfile = {
  id: "demo-user",
  full_name: "Demo Participant",
  email: "demo@aimarafon.uz",
  role: "participant",
};

export const demoTasks: ParticipantTask[] = [
  {
    id: "task-day-1",
    day_number: 1,
    title: "AI bilan dars rejasi yaratish",
    description: "Mavzu asosida 45 daqiqalik zamonaviy dars rejasi tuzing.",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    instruction_markdown:
      "1. GPT orqali dars rejasi promptini yozing.\\n2. Natijani Canva/Gamma bilan vizual ko'rinishga keltiring.\\n3. Yakuniy havola va promptni yuboring.",
    deadline: deadlineInDays(1),
  },
  {
    id: "task-day-2",
    day_number: 2,
    title: "Baholash rubrikasi generatsiyasi",
    description: "Fan bo'yicha 7 mezonli rubrika yarating va asoslang.",
    video_url: null,
    instruction_markdown:
      "Prompt quality va natija tahliliga urg'u bering. Ishni PDF yoki rasm bilan birga yuboring.",
    deadline: deadlineInDays(2),
  },
  {
    id: "task-day-3",
    day_number: 3,
    title: "AI yordamida prezentatsiya",
    description: "Maktab yoki ish joyi uchun amaliy prezentatsiya tayyorlang.",
    video_url: null,
    instruction_markdown:
      "Canva yoki Gamma'dan foydalaning. Prompt matni va ish linkini albatta kiriting.",
    deadline: deadlineInDays(3),
  },
  {
    id: "task-day-4",
    day_number: 4,
    title: "Ma'lumot tahlili mini-loyiha",
    description: "Oddiy dataset asosida xulosa chiqaruvchi mini loyiha qiling.",
    video_url: null,
    instruction_markdown:
      "Analitik xulosani qisqa, tushunarli va amaliy yozing.",
    deadline: deadlineInDays(4),
  },
  {
    id: "task-day-5",
    day_number: 5,
    title: "O'quv kontentini avtomatlashtirish",
    description: "AI yordamida haftalik kontent reja yarating.",
    video_url: null,
    instruction_markdown:
      "Yaratilgan reja utility va creativity bo'yicha asoslangan bo'lsin.",
    deadline: deadlineInDays(5),
  },
  {
    id: "task-day-6",
    day_number: 6,
    title: "Prompt optimizatsiyasi",
    description: "Bir vazifa uchun 3 xil prompt variantini taqqoslang.",
    video_url: null,
    instruction_markdown:
      "Har bir variant uchun natija tahlili yozing.",
    deadline: deadlineInDays(6),
  },
  {
    id: "task-day-7",
    day_number: 7,
    title: "Yakuniy capstone topshiriq",
    description: "Amaliy ta'lim yoki ish jarayoniga AI integratsiyasi demo loyihasi.",
    video_url: null,
    instruction_markdown:
      "To'liq prompt, natija, tahlil va amaliy qo'llash rejasi kiritilsin.",
    deadline: deadlineInDays(7),
  },
];

export const demoSubmissions: ParticipantSubmission[] = [
  {
    id: "submission-day-1",
    task_id: "task-day-1",
    prompt_text: "Siz tajribali metodistsiz. 45 daqiqalik dars rejasini bosqichma-bosqich yozing...",
    work_link: "https://gamma.app/demo-day-1",
    file_url: null,
    status: "graded",
    submitted_at: new Date().toISOString(),
    ai_score: 86,
    final_score: 88,
  },
];

export const demoLeaderboard: LeaderboardEntry[] = [
  {
    user_id: "u1",
    full_name: "Nodira Karimova",
    region: "Samarqand",
    total_points: 264,
    rank: 1,
  },
  {
    user_id: "u2",
    full_name: "Sherzod Rahimov",
    region: "Toshkent shahri",
    total_points: 258,
    rank: 2,
  },
  {
    user_id: "demo-user",
    full_name: "Demo Participant",
    region: "Buxoro",
    total_points: 88,
    rank: 23,
  },
];
