import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-xl pt-10 text-center">
      <span className="tile-icon mx-auto grid size-16 place-items-center rounded-full"><Bell size={26} aria-hidden /></span>
      <h2 className="mt-5 text-2xl">You&rsquo;re all caught up</h2>
      <p className="mx-auto mt-2 max-w-sm text-muted">Top-ups, card payments and security alerts will appear here.</p>
    </div>
  );
}
