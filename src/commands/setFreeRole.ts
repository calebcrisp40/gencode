import { EmbedBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { loadData, saveData } from "../storage.js";
import { requireAdmin } from "../admin.js";

function formatRoles(ids: string[]): string {
  if (ids.length === 0) return "*none — free role check is disabled*";
  return ids.map((id) => `<@&${id}> (\`${id}\`)`).join("\n");
}

export async function setFreeRole(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const sub = interaction.options.getSubcommand(true);
  const data = await loadData();

  if (sub === "list") {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Free Generator Roles")
      .setDescription(formatRoles(data.settings.freeRoleIds));
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }

  if (sub === "clear") {
    data.settings.freeRoleIds = [];
    await saveData();
    await interaction.reply({
      content: "Cleared all free generator roles. Anyone can use `/generatefree` now.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const role = interaction.options.getRole("role", true);
  const roleId = role.id;

  if (sub === "add") {
    if (data.settings.freeRoleIds.includes(roleId)) {
      await interaction.reply({
        content: `<@&${roleId}> is already a free generator role.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    data.settings.freeRoleIds.push(roleId);
    await saveData();
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("Free Role Added")
      .setDescription(`Added <@&${roleId}>.\n\n**Current roles:**\n${formatRoles(data.settings.freeRoleIds)}`);
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }

  if (sub === "remove") {
    const before = data.settings.freeRoleIds.length;
    data.settings.freeRoleIds = data.settings.freeRoleIds.filter((id) => id !== roleId);
    if (data.settings.freeRoleIds.length === before) {
      await interaction.reply({
        content: `<@&${roleId}> isn't in the free role list.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await saveData();
    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("Free Role Removed")
      .setDescription(`Removed <@&${roleId}>.\n\n**Current roles:**\n${formatRoles(data.settings.freeRoleIds)}`);
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }

  if (sub === "set") {
    data.settings.freeRoleIds = [roleId];
    await saveData();
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Free Role Set")
      .setDescription(`Free generator role is now <@&${roleId}>.`);
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }
}
