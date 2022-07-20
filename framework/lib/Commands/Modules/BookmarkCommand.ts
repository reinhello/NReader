import { ReaderClient } from "../../Client";
import { ActionRow, CommandInteraction, Constants, TextableChannel } from "eris";
import { API, Book } from "nhentai-api";
import { CookieJar } from "tough-cookie";
import { HttpsCookieAgent } from "http-cookie-agent/http";
import { Utils } from "givies-framework";
import { UserModel } from "../../Models";
import { createBookmarkPaginator } from "../../Modules/BookmarkPaginator";

export async function bookmarkCommand(client: ReaderClient, interaction: CommandInteraction<TextableChannel>) {
    interaction.defer(Constants.MessageFlags.EPHEMERAL);

    const jar = new CookieJar();
    jar.setCookie("cf_clearance=h87Y8lBhhqkjIKC_X5lW8XUIbjaJ5dMVnmhWVU27aWw-1658193445-0-150", "https://nhentai.net/");

    const agent = new HttpsCookieAgent({ cookies: { jar } });
    // @ts-ignore
    const api = new API({ agent });

    const args: { user?: string } = {};
    const user = interaction.member.guild.members.get(args.user || interaction.member.id);
    const guildData = await UserModel.findOne({ id: user.id });
    const bookmarked = guildData.bookmark;

    if (user) {
        if (!bookmarked || bookmarked.length === 0) {
            const embed = new Utils.RichEmbed()
                .setColor(client.config.BOT.COLOUR)
                .setDescription(client.translate("main.bookmark.none"))
                .setTitle(client.translate("main.bookmark.title", { user: user.username }));

            return interaction.createMessage({
                embeds: [embed],
                flags: Constants.MessageFlags.EPHEMERAL
            });
        }

        const bookmarkedTitle: string[] = [];
        const books: Book[] = [];

        for (let i = 0; i < bookmarked.length; i++) {
            const title = await api.getBook(parseInt(bookmarked[i])).then((book) => `${i + 1}. [\`${book.id}\`](https://nhentai.net/g/${book.id}) - \`${book.title.pretty}\``);
            const book = await api.getBook(parseInt(bookmarked[i]));

            books.push(book);
            bookmarkedTitle.push(title);
        }

        const component: ActionRow = {
            components: [
                {
                    custom_id: `see_more_${interaction.id}`,
                    label: client.translate("main.detail"),
                    style: 1,
                    type: 2
                },
                {
                    custom_id: `stop_result_${interaction.id}`,
                    label: client.translate("main.stop"),
                    style: 4,
                    type: 2
                }
            ],
            type: 1
        };

        const embed = new Utils.RichEmbed()
            .setColor(client.config.BOT.COLOUR)
            .setDescription(bookmarkedTitle.join("\n"))
            .setTitle(client.translate("main.bookmark.title", { user: user.username }));

        createBookmarkPaginator(client, books, interaction, user);
        return interaction.createMessage({
            components: [component],
            embeds: [embed],
        });
    } else {
        const embed = new Utils.RichEmbed()
            .setColor(client.config.BOT.COLOUR)
            .setDescription(client.translate("main.error"));

        return interaction.createMessage({
            embeds: [embed],
            flags: Constants.MessageFlags.EPHEMERAL
        });
    }
}