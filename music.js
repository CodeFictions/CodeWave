const app = require("express")();
app.get("/", (req, res) => {
    res.send("Server is up and running!");
});
app.listen(8080);

require("dotenv").config();

const Discord = require("discord.js");
const DisTube = require("distube");
const { prefix } = require("./config.json");
const client = new Discord.Client();

const distube = new DisTube(client, {
    searchSongs: false,
    emitNewSongOnly: true,
    highWaterMark: 1 << 25,
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity(`${client.channels.cache.size} Channels | ?help`, {
        type: "WATCHING",
    });
});

client.on("guildCreate", (guild) => {
    guild.createRole({ name: "Muted", color: "#313131" });
    console.log("Joined a new server: " + guild.name);
    console.log("It has " + guild.memberCount + " members ;)");
});

client.on("guildDelete", (guild) => {
    console.log("Left the server:" + guild.name);
});

let connectionDispatcher;

const filters = [
    "3d",
    "bassboost",
    "echo",
    "karaoke",
    "nightcore",
    "vaporwave",
    "flanger",
];

client.login(process.env.TOKEN);

client.on("message", async (message) => {
    if (message.author.bot) {
        return;
    }

    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).split(" ");
    const command = args.shift().toLowerCase();

    const voiceChannel = message.member.voice.channel;
    if (command === "radio-start") {
        if (!voiceChannel) {
            return message.channel.send("You need to be in a voice channel!");
        }

        const permissions = voiceChannel.permissionsFor(message.client.user);

        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return message.channel.send(
                "I don't have permissions to join and speak in that voice channel!"
            );
        }

        voiceChannel.join().then((connection) => {
            connectionDispatcher = connection.play(
                "https://coderadio-admin.freecodecamp.org/radio/8010/radio.mp3"
            );

            const radio_play_embed = new Discord.MessageEmbed()
                .setTitle("Started Playing the Radio!")
                .setDescription(
                    "**:white_check_mark: Joined the Voice Channel and Playing the radio.** \n \n *Powered by FreeCodeCamp Radio*"
                )
                .setThumbnail(
                    "https://media.discordapp.net/attachments/793772583946027050/801479779441967144/Z.png"
                )
                .setColor("RANDOM")
                .setFooter(
                    client.user.username,
                    client.user.displayAvatarURL()
                );
            message.channel.send(radio_play_embed);
        });
    }

    if (command === "radio-stop") {
        if (connectionDispatcher) {
            connectionDispatcher.end();
            voiceChannel.leave();
            message.channel.send(
                ":white_check_mark: Stopped the Radio and left the Voice channel!"
            );
        }
    }

    if (command === "radio-pause") {
        if (connectionDispatcher) {
            if (connectionDispatcher) {
                connectionDispatcher.end();
                return message.channel.send(
                    ":white_check_mark: Paused the Music and resting in the voice channel!"
                );
            }
        }
    }

    if (command === "ping") {
        return embedbuilder(
            client,
            message,
            `sBLUE`,
            `PING:`,
            `\`${client.ws.ping} ms\``
        );
    }

    if (message.content === "test") {
        const to_play = args.join(" ");
        message.channel.send(`${to_play}`);
    }

    if (command === "play" || command === "p") {
        const to_play = args.join(" ");

        message.channel.send(
            "<:YouTube:801465200775135282> **Searching** :mag_right: `" +
                `${to_play}` +
                "`"
        );
        return distube.play(message, args.join(" "));
    }

    if (command === "skip" || command === "s") {
        message.channel.send(":white_check_mark: Song Skipped!");
        return distube.skip(message);
    }

    if (command === "stop" || command === "leave") {
        message.channel.send(
            ":white_check_mark: Cleared the Queue and Left the Voice Channel!"
        );
        distube.stop(message);
    }

    if (command === "seek") {
        embedbuilder(
            client,
            message,
            "GREEN",
            "Seeked!",
            `seeked the song for \`${args[0]} seconds\``
        );
        return distube.seek(message, Number(args[0] * 1000));
    }
    if (filters.includes(command)) {
        let filter = distube.setFilter(message, command);
        return embedbuilder(
            client,
            message,
            "YELLOW",
            "Adding filter!",
            filter
        );
    }
    if (command === "volume" || command === "vol") {
        embedbuilder(
            client,
            message,
            "GREEN",
            "VOLUME!",
            `changed volume to \`${args[0]} %\``
        );
        return distube.setVolume(message, args[0]);
    }
    if (command === "queue" || command === "qu") {
        let queue = distube.getQueue(message);
        let curqueue = queue.songs
            .map(
                (song, id) =>
                    `**${id + 1}**. ${song.name} - \`${
                        song.formattedDuration
                    }\``
            )
            .join("\n");
        return embedbuilder(
            client,
            message,
            "GREEN",
            "Current Queue!",
            curqueue
        );
    }
    if (command === "loop" || command === "repeat") {
        if (0 <= Number(args[0]) && Number(args[0]) <= 2) {
            distube.setRepeatMode(message, parseInt(args[0]));
            embedbuilder(
                client,
                message,
                "GREEN",
                "Repeat mode set to:!",
                `${args[0]
                    .replace("0", "OFF")
                    .replace("1", "Repeat song")
                    .replace("2", "Repeat Queue")}`
            );
        } else {
            embedbuilder(
                client,
                message,
                "RED",
                "ERROR",
                `Please use a number between **0** and **2**   |   *(0: disabled, 1: Repeat a song, 2: Repeat all the queue)*`
            );
        }
    }
});

//queue
const status = (queue) =>
    `Volume: \`${queue.volume}\` | Filter: \`${
        queue.filter || "OFF"
    }\` | Loop: \`${
        queue.repeatMode
            ? queue.repeatMode === 2
                ? "All Queue"
                : "This Song"
            : "Off"
    }\` | Autoplay: \`${queue.autoplay ? "On" : "Off"}\``;
//distube
distube
    .on("playSong", (message, queue, song) => {
        embedbuilder(
            client,
            message,
            "GREEN",
            "Playing new Song!",
            `Song: \`${song.name}\`  -  \`${
                song.formattedDuration
            }\` \n\nRequested by: ${song.user}\n${status(queue)}`
        );
    })
    .on("addSong", (message, queue, song) => {
        embedbuilder(
            client,
            message,
            "GREEN",
            "Added a Song!",
            `Song: \`${song.name}\`  -  \`${song.formattedDuration}\` \n\nRequested by: ${song.user}`
        );
    })
    .on("playList", (message, queue, playlist, song) => {
        embedbuilder(
            client,
            message,
            "GREEN",
            "Playling playlist",
            `Playlist: \`${playlist.title}\`  -  \`${
                playlist.total_items
            } songs\` \n\nRequested by: ${
                song.user
            }\n\nstarting playing Song: \`${song.name}\`  -  \`${
                song.formattedDuration
            }\`\n${status(queue)}`
        );
    })
    .on("addList", (message, queue, song) => {
        embedbuilder(
            client,
            message,
            "GREEN",
            "Added a Playling!",
            `Playlist: \`${playlist.title}\`  -  \`${playlist.total_items} songs\` \n\nRequested by: ${song.user}`
        );
    })
    .on("searchResult", (message, result) => {
        let i = 0;
        embedbuilder(
            client,
            message,
            "YELLOW",
            "",
            `**Choose an option from below**\n${result
                .map(
                    (song) =>
                        `**${++i}**. ${song.name} - \`${
                            song.formattedDuration
                        }\``
                )
                .join(
                    "\n"
                )}\n*Enter anything else or wait 60 seconds to cancel*`
        );
    })
    // DisTubeOptions.searchSongs = true
    .on("searchCancel", (message) =>
        embedbuilder(client, message, "RED", `Searching canceled`, "")
    )
    .on("error", (message, err) =>
        embedbuilder(client, message, "RED", "An error encountered:", err)
    );

function embedbuilder(client, message, color, title, description) {
    let embed = new Discord.MessageEmbed()
        .setColor(color)
        .setFooter(client.user.username, client.user.displayAvatarURL());
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    return message.channel.send(embed);
}
