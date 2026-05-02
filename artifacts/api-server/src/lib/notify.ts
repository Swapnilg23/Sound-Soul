import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { generateId } from "./id";

interface NotifyParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  trackSlug?: string;
  creatorSlug?: string;
}

export function notify(params: NotifyParams): void {
  db.insert(notificationsTable).values({
    id: generateId(),
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    trackSlug: params.trackSlug ?? null,
    creatorSlug: params.creatorSlug ?? null,
    read: false,
  }).catch(() => {});
}
