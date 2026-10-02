/**
 * 09 - Pre-filled Magic Links Helper for Admin
 */

export const getWebsiteBaseUrl = () => {
  return (
    import.meta.env.VITE_WEBSITE_URL ||
    (window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://www.inxyme.com")
  );
};

export const buildContactMagicUrl = (contact) => {
  if (!contact) return "";
  const baseUrl = getWebsiteBaseUrl();
  const uid = contact._id || contact.uid || "";

  if (contact.pageUrl && contact.pageUrl.startsWith("/")) {
    const sep = contact.pageUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${contact.pageUrl}${sep}uid=${encodeURIComponent(uid)}`;
  }

  if (contact.courseTitle) {
    const slug = contact.courseTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `${baseUrl}/course/${slug}?uid=${encodeURIComponent(uid)}`;
  }

  return `${baseUrl}/courses?uid=${encodeURIComponent(uid)}`;
};

export const buildWhatsAppMagicLink = (contact) => {
  const phone = contact?.phone ? contact.phone.replace(/[^0-9]/g, "") : "";
  const name =
    contact?.name && contact.name !== "Website Lead"
      ? contact.name
      : "there";
  const course = contact?.courseTitle || "your training course";
  const magicUrl = buildContactMagicUrl(contact);

  const message = `Hi ${name}! Here is the course link for ${course} you inquired about:
${magicUrl}

⚡ We have already pre-filled your details (Name & Number) — just tap 'Submit' to confirm your seat without typing! 🚀`;

  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
};
