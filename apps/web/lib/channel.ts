import type { Channel } from "@souvenir/db";

export function deriveChannel(contact: string): Channel {
  return contact.includes("@") ? "EMAIL" : "WHATSAPP";
}
