import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EmbedBuilder, MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { requireAdmin } from "../admin.js";

const MAX_BANNER_BYTES = 8 * 1024 * 1024;
const ASSETS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../assets",
);
const BANNER_PATH = path.join(ASSETS_DIR, "banner.png");

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

export async function setBanner(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;
  const file = interaction.options.getAttachment("image", true);

  if (file.size > MAX_BANNER_BYTES) {
    await interaction.reply({
      content: `Image is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Max is 8 MB.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (file.contentType && !ALLOWED_TYPES.has(file.contentType.toLowerCase())) {
    await interaction.reply({
      content: "That file isn't a supported image. Use PNG, JPG, WEBP, or GIF.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const res = await fetch(file.url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(ASSETS_DIR, { recursive: true });
    await fs.writeFile(BANNER_PATH, buffer);
  } catch (err) {
    console.error("Failed to save banner:", err);
    await interaction.editReply({ content: "Failed to save the banner image. Try again." });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Banner Updated")
    .setDescription("New banner will be used on the next account generation.")
    .setImage(file.url)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
