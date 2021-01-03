const Discord = require("discord.js");
const bot = new Discord.Client();
const config = require("./config.json");

bot.login(config.token);

bot.on("ready", () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    bot.user.setActivity(`${bot.channels.cache.size} Channels | !radio help`, {
        type: "WATCHING",
    });
});

bot.on("guildCreate", (guild) => {
    guild.createRole({ name: "Muted", color: "#313131" });
    console.log("Joined a new server: " + guild.name);
    console.log("It has " + guild.memberCount + " members ;)");
});

bot.on("guildDelete", (guild) => {
    console.log("Left the server:" + guild.name);
});

let connectionDispatcher;

bot.on("message", (message) => {
    if (message.author.bot) return;
    if (message.content.indexOf(config.prefix) !== 0) return;
    const args = message.content
        .slice(config.prefix.length)
        .trim()
        .split(/ +/g);
    const command = args.shift().toLowerCase();

    const voiceChannel = message.member.voice.channel;

    if (message.member.hasPermission("ADMINISTRATOR")) {
        if (command === "play") {
            if (!voiceChannel) {
                return message.channel.send(
                    "You need to be in a voice channel!"
                );
            }

            const permissions = voiceChannel.permissionsFor(
                message.client.user
            );

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

        if (command === "stop") {
            if (connectionDispatcher) {
                connectionDispatcher.end();
                voiceChannel.leave();
                return message.channel.send("Stopped");
            }
        }

        if (command === "pause") {
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
                .setTitle(
                    `CodeWave's commands list | prefix \`${config.prefix}\``
                )
                .addField("```!radio play```", "Starting Playing the Radio!")
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
    }
    if (!message.member.hasPermission("ADMINISTRATOR")) {
        message.channel.send(
            ":no_entry: Insufficient Permissions! Only an Admin can use this!"
        );
    }
});
