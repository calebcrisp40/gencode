import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";

function getAdminIds(): Set<string> {
  const raw = process.env.DISCORD_ADMIN_IDS ?? "";
  return new Set(
    raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s)),
  );
}

export function isAdmin(userId: string): boolean {
  return getAdminIds().has(userId);
}

export async function requireAdmin(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  if (isAdmin(interaction.user.id)) return true;
  await interaction.reply({
    content: "You don't have permission to use this command.",
    flags: MessageFlags.Ephemeral,
  });
  return false;
}
