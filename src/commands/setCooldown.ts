import { EmbedBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { loadData, saveData, type Tier } from "../storage.js";
import { requireAdmin } from "../admin.js";

function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "no cooldown";
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  return parts.join(" ");
}

export async function setCooldown(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const tier = interaction.options.getString("tier", true) as Tier;
  const hours = interaction.options.getInteger("hours") ?? 0;
  const minutes = interaction.options.getInteger("minutes") ?? 0;
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes < 0) {
    await interaction.reply({
      content: "Cooldown can't be negative.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const data = await loadData();
  if (tier === "free") {
    data.settings.freeCooldownMinutes = totalMinutes;
  } else {
    data.settings.premCooldownMinutes = totalMinutes;
  }
  await saveData();

  const label = tier === "prem" ? "Premium" : "Free";
  const embed = new EmbedBuilder()
    .setColor(tier === "prem" ? 0xf5b400 : 0x57f287)
    .setTitle("Cooldown Updated")
    .setDescription(`${label} generator cooldown is now **${formatDuration(totalMinutes)}**.`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
