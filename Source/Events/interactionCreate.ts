"use strict";

import { Event } from "../Interfaces";
import { ActionRowComponents, ComponentInteraction, EmbedOptions, TextableChannel } from "eris";
import API from "../Extensions/API";
import ButtonNavigator from "../Extensions/ButtonNavigator/worker";

export const event: Event = {
    name: "interactionCreate",
    run: async (client, interaction: ComponentInteraction<TextableChannel>) => {
        if (interaction.type === 3 && interaction.data.component_type === 2) {
            switch (interaction.data.custom_id) {
                case "agree_privacy":
                    const agreeComponent: ActionRowComponents[] = [
                        {
                            type: 2,
                            custom_id: "agree_privacy",
                            label: "Agree",
                            style: 3,
                            disabled: true
                        },
                        {
                            type: 2,
                            custom_id: "disagree_policy",
                            label: "Disagree",
                            style: 4,
                            disabled: true
                        }
                    ];

                    const agreeEmbed: EmbedOptions = {
                        title: "First Experience [APPROVED]",
                        description: `You've agreed to the **Privacy Policy**! You may start using the commands. If you're completely new, type \`${client.database.fetch(`Database.${interaction.guildID}.Prefix`) || client.config.PREFIX}help\``,
                        color: client.config.COLOUR
                    }

                    interaction.acknowledge().then(() => {
                        interaction.editMessage(interaction.message.id, { embeds: [agreeEmbed], components: [{ type: 1, components: agreeComponent }] });
                    })
                    client.database.set(`Database.${interaction.member ? interaction.member.id : interaction.user.id}.Experience`, true);
                    break;
                case "disagree_privacy":
                    const disagreeComponent: ActionRowComponents[] = [
                        {
                            type: 2,
                            custom_id: "agree_privacy",
                            label: "Agree",
                            style: 3,
                            disabled: true
                        },
                        {
                            type: 2,
                            custom_id: "disagree_policy",
                            label: "Disagree",
                            style: 4,
                            disabled: true
                        }
                    ];

                    const disagreeEmbed: EmbedOptions = {
                        title: "First Experience [DISAPPROVED]",
                        description: `You've **NOT** agree to the **Privacy Policy**! You're not permitted to use any commands unless you click **Agree**.`,
                        color: client.config.COLOUR
                    }

                    interaction.acknowledge().then(() => {
                        interaction.editMessage(interaction.message.id, { embeds: [disagreeEmbed], components: [{ type: 1, components: disagreeComponent }] });
                    })
                    client.database.set(`${interaction.member ? interaction.member.id : interaction.user.id}`, false);
                    break;
                case "read_prop":
                    const code: string = await client.database.fetch(`Database.${interaction.guildID}.${interaction.member.id}.Book`);

                    API.getCode(code).then(async (res) => {
                        let embeds: EmbedOptions[] = await res.pages.map((url: string) => ({ title: res.title, image: { url: url }, thumbnail: { url: res.thumbnails[0] }, color: client.config.COLOUR, footer: { text: `Requested By: ${interaction.member.username}#${interaction.member.discriminator}` } } as EmbedOptions));

                        await client.database.set(`Database.${interaction.guildID}.${interaction.member.id}.BookEmbed`, embeds);

                        await ButtonNavigator(interaction.message, embeds);

                    });
                    interaction.acknowledge();
                    break;
                case "kill_prop":
                    client.database.delete(`Database.${interaction.guildID}.${interaction.member.id}.Book`);
                    interaction.acknowledge();
                    interaction.message.delete();
                    // client.deleteMessage(interaction.channel.id, interaction.message.id).catch(() => { });
                    break;
            }
        }
    }
}
