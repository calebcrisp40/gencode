import type { ChatInputCommandInteraction } from "discord.js";

export function getMemberRoleIds(interaction: ChatInputCommandInteraction): string[] {
  const member = interaction.member;
  if (!member || !("roles" in member) || !member.roles || typeof member.roles === "string") {
    return [];
  }
  if ("cache" in member.roles) {
    return Array.from(member.roles.cache.keys());
  }
  if (Array.isArray(member.roles)) {
    return member.roles;
  }
  return [];
}
