import { EmbedBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { loadData, saveData } from "../storage.js";
import { requireAdmin } from "../admin.js";

function formatRoles(ids: string[]): string {
  if (ids.length === 0) return "*none — premium role check is disabled*";
  return ids.map((id) => `<@&${id}> (\`${id}\`)`).join("\n");
}

export async function setPremiumRole(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const sub = interaction.options.getSubcommand(true);
  const data = await loadData();

  if (sub === "list") {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Premium Generator Roles")
      .setDescription(formatRoles(data.settings.premiumRoleIds));
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }

  if (sub === "clear") {
    data.settings.premiumRoleIds = [];
    await saveData();
    await interaction.reply({
      content: "Cleared all premium generator roles. Anyone with a subscription can use `/generateprem` now.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const role = interaction.options.getRole("role", true);
  const roleId = role.id;

  if (sub === "add") {
    if (data.settings.premiumRoleIds.includes(roleId)) {
      await interaction.reply({
        content: `<@&${roleId}> is already a premium generator role.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    data.settings.premiumRoleIds.push(roleId);
    await saveData();
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("Premium Role Added")
      .setDescription(`Added <@&${roleId}>.\n\n**Current roles:**\n${formatRoles(data.settings.premiumRoleIds)}`);
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }

  if (sub === "remove") {
    const before = data.settings.premiumRoleIds.length;
    data.settings.premiumRoleIds = data.settings.premiumRoleIds.filter((id) => id !== roleId);
    if (data.settings.premiumRoleIds.length === before) {
      await interaction.reply({
        content: `<@&${roleId}> isn't in the premium role list.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await saveData();
    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("Premium Role Removed")
      .setDescription(`Removed <@&${roleId}>.\n\n**Current roles:**\n${formatRoles(data.settings.premiumRoleIds)}`);
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }

  if (sub === "set") {
    data.settings.premiumRoleIds = [roleId];
    await saveData();
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Premium Role Set")
      .setDescription(`Premium generator role is now <@&${roleId}>.`);
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }
}
