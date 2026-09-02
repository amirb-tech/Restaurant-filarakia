export const TEMPERATURES = ["HOT", "WARM", "COLD"] as const;
export type Temperature = (typeof TEMPERATURES)[number];

export const STAGES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "ESTIMATE_SENT",
  "BOOKED",
  "WON",
  "LOST",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  ESTIMATE_SENT: "Estimate Sent",
  BOOKED: "Booked",
  WON: "Won",
  LOST: "Lost",
};

export const MESSAGE_DIRECTIONS = ["INBOUND", "OUTBOUND"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_CHANNELS = ["SMS", "CALL", "SYSTEM"] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

export const APPOINTMENT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const SCHEDULED_TASK_TYPES = [
  "FOLLOW_UP_1H",
  "FOLLOW_UP_24H",
  "FOLLOW_UP_3D",
  "ESTIMATE_FOLLOW_UP",
  "REACTIVATION",
  "NO_SHOW_RESCHEDULE",
  "APPOINTMENT_REMINDER_24H",
  "APPOINTMENT_REMINDER_2H",
] as const;
export type ScheduledTaskType = (typeof SCHEDULED_TASK_TYPES)[number];

export const SCHEDULED_TASK_STATUSES = ["PENDING", "SENT", "CANCELLED", "FAILED"] as const;
export type ScheduledTaskStatus = (typeof SCHEDULED_TASK_STATUSES)[number];
