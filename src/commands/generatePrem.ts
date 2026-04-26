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

export async function generatePrem(interaction: ChatInputCommandInteraction): Promise<void> {
  const userId = interaction.user.id;
  const data = await loadData();

  const envRoleIds = (process.env.DISCORD_PREMIUM_ROLE_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  const requiredRoleIds =
    data.settings.premiumRoleIds.length > 0 ? data.settings.premiumRoleIds : envRoleIds;
  if (requiredRoleIds.length > 0) {
    const memberRoles = getMemberRoleIds(interaction);
    const hasRole = requiredRoleIds.some((rid) => memberRoles.includes(rid));
    if (!hasRole) {
      await interaction.reply({
        content: "You don't have the premium generator role.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: "This command must be run inside a server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const expiresAt = data.subscriptions[guildId]?.[userId] ?? 0;
  if (expiresAt < Date.now()) {
    await interaction.reply({
      content:
        "You don't have an active premium subscription in this server. Ask an admin here to set one with `/subscriptionset`.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const cooldownMs = data.settings.premCooldownMinutes * 60 * 1000;
  const now = Date.now();
  const last = data.cooldowns.prem[userId] ?? 0;
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

  if (data.stock.prem.length === 0) {
    await interaction.reply({
      content: "No premium stock available right now.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const account = data.stock.prem[0]!;
  const remainingDays = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));

  const links = extractLinks(account);
  const dmEmbed = new EmbedBuilder()
    .setColor(0xf5b400)
    .setTitle("Premium account")
    .setDescription(`\`\`\`\n${account}\n\`\`\``)
    .addFields({ name: "Subscription", value: `${remainingDays} day(s) left`, inline: true })
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

  data.stock.prem.shift();
  data.cooldowns.prem[userId] = now;
  data.generated.prem += 1;
  await saveData();

  const banner = new AttachmentBuilder(BANNER_PATH, { name: "banner.png" });
  const channelEmbed = new EmbedBuilder()
    .setColor(0xf5b400)
    .setTitle("Premium Account Generated")
    .setDescription(`Check Your DMs\n<@${userId}>`)
    .setImage("attachment://banner.png")
    .setFooter({ text: "Thank You For Choosing Larps Market!" })
    .setTimestamp();

  await interaction.reply({ embeds: [channelEmbed], files: [banner] });
}
