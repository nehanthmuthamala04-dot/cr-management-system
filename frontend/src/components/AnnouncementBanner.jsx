export default function AnnouncementBanner({ announcements }) {
  const text = announcements?.length
    ? announcements.map((item) => `${item.title}: ${item.message}`).join("   |   ")
    : "No announcements yet.";

  return (
    <div className="announcement-banner">
      <div className="marquee">{text}</div>
    </div>
  );
}
