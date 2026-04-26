import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import { addStock } from "./addStock.js";
import { generateFree } from "./generateFree.js";
import { generatePrem } from "./generatePrem.js";
import { subscriptionSet } from "./subscriptionSet.js";
import { stockView } from "./stockView.js";
import { removeStock } from "./removeStock.js";
import { setBanner } from "./setBanner.js";
import { setCooldown } from "./setCooldown.js";
import { stats } from "./stats.js";
import { sync } from "./sync.js";
import { setPremiumRole } from "./setPremiumRole.js";
import { setFreeRole } from "./setFreeRole.js";

export interface Command {
  data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands: Command[] = [
  {
    data: new SlashCommandBuilder()
      .setName("addstock")
      .setDescription("Add accounts to the stock for a service")
      .addStringOption((o) =>
        o.setName("tier").setDescription("free or prem").setRequired(true).addChoices(
          { name: "free", value: "free" },
          { name: "prem", value: "prem" },
        ),
      )
      .addAttachmentOption((o) =>
        o
          .setName("file")
          .setDescription("A .txt file with one account per line")
          .setRequired(true),
      )
      .toJSON(),
    execute: addStock,
  },
  {
    data: new SlashCommandBuilder()
      .setName("removestock")
      .setDescription("Remove accounts from stock")
      .addStringOption((o) =>
        o
          .setName("tier")
          .setDescription("Which stock to remove from")
          .setRequired(true)
          .addChoices(
            { name: "free", value: "free" },
            { name: "prem", value: "prem" },
            { name: "all", value: "all" },
          ),
      )
      .addIntegerOption((o) =>
        o
          .setName("amount")
          .setDescription("How many to remove from the top (omit to clear everything)")
          .setMinValue(1),
      )
      .toJSON(),
    execute: removeStock,
  },
  {
    data: new SlashCommandBuilder()
      .setName("generatefree")
      .setDescription("Generate a free account")
      .toJSON(),
    execute: generateFree,
  },
  {
    data: new SlashCommandBuilder()
      .setName("generateprem")
      .setDescription("Generate a premium account (subscription required)")
      .toJSON(),
    execute: generatePrem,
  },
  {
    data: new SlashCommandBuilder()
      .setName("subscriptionset")
      .setDescription("Grant a user premium access for X days")
      .addUserOption((o) =>
        o.setName("user").setDescription("User to grant subscription to").setRequired(true),
      )
      .addIntegerOption((o) =>
        o
          .setName("days")
          .setDescription("Number of days (use 0 to revoke)")
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(3650),
      )
      .toJSON(),
    execute: subscriptionSet,
  },
  {
    data: new SlashCommandBuilder()
      .setName("stockview")
      .setDescription("View current account stock")
      .toJSON(),
    execute: stockView,
  },
  {
    data: new SlashCommandBuilder()
      .setName("setbanner")
      .setDescription("Set the banner image shown when accounts are generated")
      .addAttachmentOption((o) =>
        o
          .setName("image")
          .setDescription("PNG, JPG, WEBP, or GIF (max 8 MB)")
          .setRequired(true),
      )
      .toJSON(),
    execute: setBanner,
  },
  {
    data: new SlashCommandBuilder()
      .setName("setcooldown")
      .setDescription("Set the cooldown for free or premium generations (0/0 disables)")
      .addStringOption((o) =>
        o
          .setName("tier")
          .setDescription("Which generator to set the cooldown for")
          .setRequired(true)
          .addChoices(
            { name: "free", value: "free" },
            { name: "prem", value: "prem" },
          ),
      )
      .addIntegerOption((o) =>
        o.setName("hours").setDescription("Cooldown hours").setMinValue(0).setMaxValue(720),
      )
      .addIntegerOption((o) =>
        o.setName("minutes").setDescription("Cooldown minutes").setMinValue(0).setMaxValue(59),
      )
      .toJSON(),
    execute: setCooldown,
  },
  {
    data: new SlashCommandBuilder()
      .setName("stats")
      .setDescription("View overall bot usage stats")
      .toJSON(),
    execute: stats,
  },
  {
    data: new SlashCommandBuilder()
      .setName("sync")
      .setDescription("Re-push slash commands to all configured servers")
      .toJSON(),
    execute: sync,
  },
  {
    data: new SlashCommandBuilder()
      .setName("setpremiumrole")
      .setDescription("Manage which roles can use /generateprem")
      .addSubcommand((s) =>
        s
          .setName("set")
          .setDescription("Replace all premium roles with a single role")
          .addRoleOption((o) =>
            o.setName("role").setDescription("Role required to use /generateprem").setRequired(true),
          ),
      )
      .addSubcommand((s) =>
        s
          .setName("add")
          .setDescription("Add another role that can use /generateprem")
          .addRoleOption((o) =>
            o.setName("role").setDescription("Role to add").setRequired(true),
          ),
      )
      .addSubcommand((s) =>
        s
          .setName("remove")
          .setDescription("Remove a role from the premium list")
          .addRoleOption((o) =>
            o.setName("role").setDescription("Role to remove").setRequired(true),
          ),
      )
      .addSubcommand((s) =>
        s.setName("list").setDescription("Show the current premium role list"),
      )
      .addSubcommand((s) =>
        s.setName("clear").setDescription("Disable the premium role check"),
      )
      .toJSON(),
    execute: setPremiumRole,
  },
  {
    data: new SlashCommandBuilder()
      .setName("setfreerole")
      .setDescription("Manage which roles can use /generatefree")
      .addSubcommand((s) =>
        s
          .setName("set")
          .setDescription("Replace all free roles with a single role")
          .addRoleOption((o) =>
            o.setName("role").setDescription("Role required to use /generatefree").setRequired(true),
          ),
      )
      .addSubcommand((s) =>
        s
          .setName("add")
          .setDescription("Add another role that can use /generatefree")
          .addRoleOption((o) =>
            o.setName("role").setDescription("Role to add").setRequired(true),
          ),
      )
      .addSubcommand((s) =>
        s
          .setName("remove")
          .setDescription("Remove a role from the free list")
          .addRoleOption((o) =>
            o.setName("role").setDescription("Role to remove").setRequired(true),
          ),
      )
      .addSubcommand((s) =>
        s.setName("list").setDescription("Show the current free role list"),
      )
      .addSubcommand((s) =>
        s.setName("clear").setDescription("Disable the free role check"),
      )
      .toJSON(),
    execute: setFreeRole,
  },
];
