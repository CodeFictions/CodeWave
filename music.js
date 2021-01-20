require("dotenv").config();

const Discord = require("discord.js");
const DisTube = require("distube");
const client = new Discord.Client({ disableMentions: "everone" });
const config = {
    prefix: "?",
    token: process.env.TOKEN,
};
const distube = new DisTube(client, {
    searchSongs: true,
    emitNewSongOnly: true,
    highWaterMark: 1 << 25,
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity(
        `${client.channels.cache.size} Channels | !radio help`,
        {
            type: "WATCHING",
        }
    );
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

//events
client.login(config.token);

client.on("message", async (message) => {
    if (message.author.bot) {
        return;
    }

    if (!message.guild) return;
    const args = message.content
        .slice(config.prefix.length)
        .trim()
        .split(/ +/g);
    const command = args.shift();

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
            return message.channel.send("Playing!");
        });
    }

    if (command === "radio-stop") {
        if (connectionDispatcher) {
            connectionDispatcher.end();
            voiceChannel.leave();
            return message.channel.send("Stopped");
        }
    }

    if (command === "radio-pause") {
        if (connectionDispatcher) {
            if (connectionDispatcher) {
                connectionDispatcher.end();
                return message.channel.send("Paused");
            }
        }
    }

    if (command === "test") {
        message.channel.send("Tesiting Succesful");
    }

    if (command === "help") {
        const helpEmbed = new Discord.MessageEmbed()
            .setTitle(`CodeWave's commands list | prefix \`${config.prefix}\``)
            .addField("```!radio start```", "Starting Playing the Radio!")
            .addField(
                "```!radio stop```",
                "Stopping the music and leaving the VC!"
            )
            .addField(
                "```!radio pause```",
                "Give it a Break! Just kiddin', Pause and Chill all you want without leaving the Voice Channel!"
            )
            .setImage(bot.user.avatarURL)
            .setColor("RANDOM");
        message.channel.send(helpEmbed);
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

    if (command === "play" || command === "p") {
        embedbuilder(client, message, "YELLOW", "Searching!", args.join(" "));
        return distube.play(message, args.join(" "));
    }
    if (command === "skip" || command === "s") {
        embedbuilder(client, message, "YELLOW", "SKIPPED!", `Skipped the song`);
        return distube.skip(message);
    }
    if (command === "stop" || command === "leave") {
        embedbuilder(client, message, "RED", "STOPPED!", `Leaved the channel`);
        return distube.stop(message);
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
    if (command === "jump") {
        let queue = distube.getQueue(message);
        if (0 <= Number(args[0]) && Number(args[0]) <= queue.songs.length) {
            embedbuilder(
                client,
                message,
                "RED",
                "ERROR",
                `Jumped ${parseInt(args[0])} songs!`
            );
            return distube
                .jump(message, parseInt(args[0]))
                .catch((err) => message.channel.send("Invalid song number."));
        } else {
            embedbuilder(
                client,
                message,
                "RED",
                "ERROR",
                `Please use a number between **0** and **${
                    DisTube.getQueue(message).length
                }**   |   *(0: disabled, 1: Repeat a song, 2: Repeat all the queue)*`
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
