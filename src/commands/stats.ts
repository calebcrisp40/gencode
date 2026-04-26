import { EmbedBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { loadData } from "../storage.js";

export async function stats(interaction: ChatInputCommandInteraction): Promise<void> {
  const data = await loadData();
  const now = Date.now();
  const guildId = interaction.guildId;
  const guildSubs = guildId ? (data.subscriptions[guildId] ?? {}) : {};
  const activeHere = Object.values(guildSubs).filter((exp) => exp > now).length;
  const totalHere = Object.keys(guildSubs).length;
  const activeAll = Object.values(data.subscriptions)
    .flatMap((g) => Object.values(g))
    .filter((exp) => exp > now).length;
  const totalGenerated = data.generated.free + data.generated.prem;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Larps Market — Stats")
    .addFields(
      {
        name: "Accounts Generated",
        value: [
          `Total: **${totalGenerated}**`,
          `Free: **${data.generated.free}**`,
          `Premium: **${data.generated.prem}**`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "Current Stock",
        value: [
          `Free: **${data.stock.free.length}**`,
          `Premium: **${data.stock.prem.length}**`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "Subscribers",
        value: [
          `Active here: **${activeHere}**`,
          `All-time here: **${totalHere}**`,
          `Active across all servers: **${activeAll}**`,
        ].join("\n"),
        inline: true,
      },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
