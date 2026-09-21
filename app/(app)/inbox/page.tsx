import { getSession } from "@/lib/auth";
import { InboxClient } from "./InboxClient";

export default async function InboxPage() {
  const session = await getSession();
  return <InboxClient user={session!.user} />;
}
