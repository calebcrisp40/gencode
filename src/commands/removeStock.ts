import { EmbedBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { loadData, saveData, type Tier } from "../storage.js";
import { requireAdmin } from "../admin.js";

export async function removeStock(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;
  const tier = interaction.options.getString("tier", true);
  const amount = interaction.options.getInteger("amount");
  const data = await loadData();

  const tiers: Tier[] = tier === "all" ? ["free", "prem"] : [tier as Tier];
  let totalRemoved = 0;
  const lines: string[] = [];

  for (const t of tiers) {
    const before = data.stock[t].length;
    if (amount === null) {
      data.stock[t] = [];
      totalRemoved += before;
      lines.push(`Cleared **${before}** ${t} account(s)`);
    } else {
      const removed = data.stock[t].splice(0, amount);
      totalRemoved += removed.length;
      lines.push(`Removed **${removed.length}** ${t} account(s) (${data.stock[t].length} left)`);
    }
  }

  await saveData();

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle("Stock Removed")
    .setDescription(lines.join("\n"))
    .setFooter({ text: `Total removed: ${totalRemoved}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
