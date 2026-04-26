import { EmbedBuilder, MessageFlags, time, type ChatInputCommandInteraction } from "discord.js";
import { loadData, saveData } from "../storage.js";
import { requireAdmin } from "../admin.js";

export async function subscriptionSet(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: "This command must be run inside a server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const user = interaction.options.getUser("user", true);
  const days = interaction.options.getInteger("days", true);
  const data = await loadData();

  if (!data.subscriptions[guildId]) data.subscriptions[guildId] = {};
  const guildSubs = data.subscriptions[guildId]!;
  const guildName = interaction.guild?.name ?? "this server";

  if (days === 0) {
    delete guildSubs[user.id];
    await saveData();
    await interaction.reply({
      content: `Revoked premium subscription for <@${user.id}> in **${guildName}**.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
  guildSubs[user.id] = expiresAt;
  await saveData();

  const embed = new EmbedBuilder()
    .setColor(0xf5b400)
    .setTitle("Subscription Granted")
    .setDescription(
      `<@${user.id}> now has **${days}** day(s) of premium access in **${guildName}**.`,
    )
    .addFields({
      name: "Expires",
      value: time(Math.floor(expiresAt / 1000), "F"),
    })
    .setFooter({ text: "Subscriptions are per-server. Run this in each server they need access to." })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
