import { EmbedBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { loadData, saveData, type Tier } from "../storage.js";
import { requireAdmin } from "../admin.js";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function addStock(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;
  const tier = interaction.options.getString("tier", true) as Tier;
  const file = interaction.options.getAttachment("file", true);

  if (file.size > MAX_FILE_BYTES) {
    await interaction.reply({
      content: `File is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Max is 5 MB.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  let text: string;
  try {
    const res = await fetch(file.url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    text = await res.text();
  } catch (err) {
    console.error("Failed to download attachment:", err);
    await interaction.editReply({
      content: "Failed to download the attached file. Try again.",
    });
    return;
  }

  const accounts = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("#"));

  if (accounts.length === 0) {
    await interaction.editReply({
      content: "The file is empty or has no valid lines. Put one account per line.",
    });
    return;
  }

  const data = await loadData();
  data.stock[tier].push(...accounts);
  await saveData();

  const embed = new EmbedBuilder()
    .setColor(tier === "prem" ? 0xf5b400 : 0x57f287)
    .setTitle("Stock Added")
    .setDescription(`Loaded **${accounts.length}** ${tier} account(s)`)
    .addFields(
      { name: "File", value: file.name, inline: true },
      { name: "Total in stock", value: `${data.stock[tier].length}`, inline: true },
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
