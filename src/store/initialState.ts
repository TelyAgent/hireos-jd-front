import { JOBS } from "../data/fixtures/jobs";
import { ROLE_VERSIONS } from "../data/fixtures/roleVersions";
import { REQUIREMENTS, RESTRICTED } from "../data/fixtures/requirements";
import { COMMENT_THREADS, DOCUMENTS, SUGGESTIONS } from "../data/fixtures/documents";
import { APPROVALS, JOB_ACTIVITY, PUBLICATIONS } from "../data/fixtures/approvals";
import { CONNECTIONS, FILES, OP_ACTIVITY } from "../data/fixtures/files";
import { TASKS } from "../data/fixtures/tasks";
import type { AppState } from "./types";

/** Deep clone so edits in the prototype store never mutate the fixture modules. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const PREFS_STORAGE_KEY = "hireos-jd-prefs";
export const PREF_KEYS = ["lang", "theme", "accent", "textSize", "sidenavCollapsed"] as const;

export const initialState: AppState = {
  lang: "en",
  theme: "light",
  accent: "teal",
  textSize: "medium",
  systemDark: false,
  sidenavCollapsed: false,

  currentUserId: "linh",

  jobs: clone(JOBS),
  roleVersions: clone(ROLE_VERSIONS),
  requirements: clone(REQUIREMENTS),
  restricted: clone(RESTRICTED),
  drafts: clone(DOCUMENTS),
  comments: clone(COMMENT_THREADS),
  suggestions: clone(SUGGESTIONS),
  approvals: clone(APPROVALS),
  publications: clone(PUBLICATIONS),
  activity: clone(JOB_ACTIVITY),
  tasks: clone(TASKS),
  files: clone(FILES),
  connections: clone(CONNECTIONS),
  opActivity: clone(OP_ACTIVITY),

  wsSelection: null,
  wsSideTab: "copilot",
  wsMode: "editing",
  wsAudience: "internal",
  wsCurrentJob: null,
  wsCopilotThread: [],

  geminiChats: {},
  geminiConversationIds: {},

  homeTrendsOpen: false,

  toasts: [],
};
