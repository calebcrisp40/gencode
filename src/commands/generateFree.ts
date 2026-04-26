import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AttachmentBuilder,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from "discord.js";
import { loadData, saveData } from "../storage.js";
import { extractLinks } from "../links.js";
import { getMemberRoleIds } from "../roleCheck.js";

const BANNER_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../assets/banner.png",
);

export async function generateFree(interaction: ChatInputCommandInteraction): Promise<void> {
  const userId = interaction.user.id;
  const data = await loadData();

  if (data.settings.freeRoleIds.length > 0) {
    const memberRoles = getMemberRoleIds(interaction);
    const hasRole = data.settings.freeRoleIds.some((rid) => memberRoles.includes(rid));
    if (!hasRole) {
      await interaction.reply({
        content: "You don't have the free generator role.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  const cooldownMs = data.settings.freeCooldownMinutes * 60 * 1000;
  const now = Date.now();
  const last = data.cooldowns.free[userId] ?? 0;
  if (cooldownMs > 0 && now - last < cooldownMs) {
    const remainingMs = cooldownMs - (now - last);
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    await interaction.reply({
      content: `You're on cooldown. Try again in **${hours}h ${minutes}m**.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (data.stock.free.length === 0) {
    await interaction.reply({
      content: "No free stock available right now.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const account = data.stock.free[0]!;

  const links = extractLinks(account);
  const dmEmbed = new EmbedBuilder()
    .setColor(0xc80046)
    .setTitle("Free account")
    .setDescription(`\`\`\`\n${account}\n\`\`\``)
    .setFooter({ text: `Claimed from ${interaction.guild?.name ?? "Direct Message"}` })
    .setTimestamp();
  if (links.length > 0) {
    dmEmbed.addFields({
      name: links.length === 1 ? "Link" : "Links",
      value: links.map((u) => `[${u}](${u})`).join("\n"),
    });
  }

  try {
    await interaction.user.send({ embeds: [dmEmbed] });
  } catch {
    await interaction.reply({
      content:
        "I couldn't DM you. Please enable direct messages from server members and try again.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  data.stock.free.shift();
  data.cooldowns.free[userId] = now;
  data.generated.free += 1;
  await saveData();

  const banner = new AttachmentBuilder(BANNER_PATH, { name: "banner.png" });
  const channelEmbed = new EmbedBuilder()
    .setColor(0xc80046)
    .setTitle("Free Account Generated")
    .setDescription(`Check Your DMs\n<@${userId}>`)
    .setImage("attachment://banner.png")
    .setFooter({ text: "Thank You For Choosing Larps Market!" })
    .setTimestamp();

  await interaction.reply({ embeds: [channelEmbed], files: [banner] });
}
