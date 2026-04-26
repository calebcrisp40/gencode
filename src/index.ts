import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  MessageFlags,
} from "discord.js";
import { commands } from "./commands/index.js";
import { loadData } from "./storage.js";

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("Missing DISCORD_BOT_TOKEN environment variable.");
  process.exit(1);
}

await loadData();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commandMap = new Map(commands.map((c) => [c.data.name, c]));

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${c.user.id}&permissions=274877957632&scope=bot+applications.commands`;
  console.log("===================================================================");
  console.log("Invite this bot to your server with the link below:");
  console.log(inviteUrl);
  console.log("===================================================================");
  try {
    const rest = new REST({ version: "10" }).setToken(token);
    const body = commands.map((cmd) => cmd.data);
    const guildIds = (process.env.DISCORD_GUILD_ID ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (guildIds.length > 0) {
      await rest.put(Routes.applicationCommands(c.user.id), { body: [] });
      console.log("Cleared global commands.");
      for (const guildId of guildIds) {
        await rest.put(Routes.applicationGuildCommands(c.user.id, guildId), { body });
        console.log(
          `Registered ${commands.length} command(s) to guild ${guildId} (instant).`,
        );
      }
    } else {
      for (const [guildId] of c.guilds.cache) {
        try {
          await rest.put(Routes.applicationGuildCommands(c.user.id, guildId), { body: [] });
          console.log(`Cleared guild-scoped commands in ${guildId}.`);
        } catch (err) {
          console.error(`Failed to clear guild commands in ${guildId}:`, err);
        }
      }
      await rest.put(Routes.applicationCommands(c.user.id), { body });
      console.log(
        `Registered ${commands.length} command(s) globally. Note: global commands can take up to 1 hour to appear in every server.`,
      );
    }
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commandMap.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error in command ${interaction.commandName}:`, err);
    const reply = {
      content: "Something went wrong while running that command.",
      flags: MessageFlags.Ephemeral,
    } as const;
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

client.on(Events.Error, (err) => {
  console.error("Client error:", err);
});

await client.login(token);
