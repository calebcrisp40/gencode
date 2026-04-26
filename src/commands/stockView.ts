import { EmbedBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { loadData } from "../storage.js";

export async function stockView(interaction: ChatInputCommandInteraction): Promise<void> {
  const data = await loadData();
  const guildId = interaction.guildId;
  const activeSubs = guildId
    ? Object.values(data.subscriptions[guildId] ?? {}).filter((ts) => ts > Date.now()).length
    : 0;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Stock Overview")
    .addFields(
      { name: "Free Stock", value: `${data.stock.free.length}`, inline: true },
      { name: "Premium Stock", value: `${data.stock.prem.length}`, inline: true },
      { name: "Active Subs", value: `${activeSubs}`, inline: true },
      { name: "Generated (Free)", value: `${data.generated.free}`, inline: true },
      { name: "Generated (Prem)", value: `${data.generated.prem}`, inline: true },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
