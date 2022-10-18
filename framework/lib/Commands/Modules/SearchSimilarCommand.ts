import { NReaderClient } from "../../Client";
import {
    MessageActionRow,
    CommandInteraction,
    Constants,
    TextChannel,
} from "oceanic.js";
import { ComponentBuilder, EmbedBuilder } from "@oceanicjs/builders";
import { Util } from "../../Utils";
import { createSearchPaginator } from "../../Modules/SearchPaginator";
import { GuildModel, UserModel } from "../../Models";
import { setTimeout } from "node:timers/promises";

export async function searchSimilarCommand(
    client: NReaderClient,
    interaction: CommandInteraction<TextChannel>
) {
    const galleryID = interaction.data.options.getInteger("id").toString();
    const guildData = await GuildModel.findOne({ id: interaction.guildID });
    const userData = await UserModel.findOne({ id: interaction.user.id });

    const gallery = await client.api.getGallery(galleryID);
    const tags = gallery.tags.tags.map((tag) => tag.name);

    client.stats.updateUserHistory(
        interaction.user.id,
        "searched",
        galleryID,
        "search-similar"
    );

    client.stats.logActivities(
        interaction.user.id,
        "search-similar",
        galleryID
    );

    if (
        Util.findCommonElement(tags, client.config.API.RESTRICTED_TAGS) &&
        !guildData.settings.whitelisted &&
        !userData.settings.premium
    ) {
        const embed = new EmbedBuilder()
            .setColor(client.config.BOT.COLOUR)
            .setDescription(
                client.translate("main.tags.restricted", {
                    channel:
                        "[#info](https://discord.com/channels/763678230976659466/1005030227174490214)",
                    server: "https://discord.gg/b7AW2Zkcsw",
                })
            );

        return interaction.createMessage({
            embeds: [embed.toJSON()],
            flags: Constants.MessageFlags.EPHEMERAL,
        });
    }

    await interaction.defer();
    await setTimeout(2000);

    client.api
        .getGalleryRelated(galleryID)
        .then(async (search) => {
            if (search.result.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(client.config.BOT.COLOUR)
                    .setDescription(client.translate("main.search.empty"));

                return interaction.createFollowup({
                    embeds: [embed.toJSON()],
                });
            }

            const title = search.result.map(
                (gallery, index) =>
                    `\`⬛ ${
                        (index + 1).toString().length > 1
                            ? `${index + 1}`
                            : `${index + 1} `
                    }\` - [\`${gallery.id}\`](${gallery.url}) - \`${
                        gallery.title.pretty.length >= 30
                            ? `${gallery.title.pretty.slice(0, 30)}...`
                            : gallery.title.pretty
                    }\``
            );

            const embed = new EmbedBuilder()
                .setColor(client.config.BOT.COLOUR)
                .setDescription(title.join("\n"))
                .setTitle(
                    client.translate("main.page", {
                        firstIndex: search.page,
                        lastIndex: search.numPages.toLocaleString(),
                    })
                );

            const components = new ComponentBuilder<MessageActionRow>()
                .addInteractionButton(
                    Constants.ButtonStyles.PRIMARY,
                    `see_more_${interaction.id}`,
                    client.translate("main.detail")
                )
                .addInteractionButton(
                    Constants.ButtonStyles.DANGER,
                    `stop_result_${interaction.id}`,
                    client.translate("main.stop")
                )
                .toJSON();

            createSearchPaginator(client, search, interaction);
            interaction.createFollowup({
                components,
                embeds: [embed.toJSON()],
            });
        })
        .catch((err: Error) => {
            const embed = new EmbedBuilder()
                .setColor(client.config.BOT.COLOUR)
                .setDescription(
                    client.translate("main.invalid", { result: galleryID })
                );

            interaction.createFollowup({
                embeds: [embed.toJSON()],
            });

            return client.logger.error({
                message: err.message,
                subTitle: "NHentaiAPI::SearchALike",
                title: "API",
            });
        });
}
