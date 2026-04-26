import {
  EmbedBuilder,
  MessageFlags,
  REST,
  Routes,
  type ChatInputCommandInteraction,
} from "discord.js";
import { commands } from "./index.js";
import { requireAdmin } from "../admin.js";

export async function sync(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    await interaction.editReply("Missing bot token in the environment.");
    return;
  }
  const clientId = interaction.client.user.id;
  const rest = new REST({ version: "10" }).setToken(token);
  const body = commands.map((cmd) => cmd.data);

  const guildIds = (process.env.DISCORD_GUILD_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  const results: string[] = [];
  try {
    if (guildIds.length > 0) {
      await rest.put(Routes.applicationCommands(clientId), { body: [] });
      results.push("Cleared global commands.");
      for (const guildId of guildIds) {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
        results.push(`Synced ${commands.length} command(s) to guild \`${guildId}\`.`);
      }
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body });
      results.push(
        `Synced ${commands.length} command(s) globally. May take up to 1 hour to appear everywhere.`,
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await interaction.editReply(`Failed to sync commands: ${msg}`);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Commands Synced")
    .setDescription(results.join("\n"))
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
