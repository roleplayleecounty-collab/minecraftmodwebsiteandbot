// ===============================
// LICENSE BOT v4 (STABLE CORE)
// FIXED INTERACTIONS + CLEAN FLOW
// ===============================

const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    ChannelType
} = require('discord.js');



const { v4: uuidv4 } = require('uuid');
const fs = require('fs');


process.on('unhandledRejection', console.log);
process.on('uncaughtException', console.log);


const express = require("express");
const app = express(); // ✅ DEFINE APP FIRST

// Web server (required for Render web service)
app.get("/", (req, res) => {
  res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});



// ================= CONFIG =================
const TOKEN = 'MTQ5NzA2MDMxNzkwNDI0NDc5Ng.Gnk3tF.TygDsImY7W4374t8iEaUXZytpih1jBbwATY_EY';
const CLIENT_ID = '1497060317904244796';
const GUILD_ID = '1490057043015499886';

const STAFF_ROLES = ['1497371753952055387', '1491805824031522968'];
const LOG_CHANNEL_ID = '1497372864842563715';

const ROLE_KRYPTON = '1497381762865561682';
const ROLE_NOVA = '1497381865277886605';
const ROLE_PARAGON = '1497382032244736200';
const BOTDEV_ID = '937095746971398166';

const DB_FILE = './licenses.json';

// ================= DATABASE =================
let db = { licenses: {}, users: {} };

function loadDB() {
    if (fs.existsSync(DB_FILE)) {
        db = JSON.parse(fs.readFileSync(DB_FILE));
    }
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

loadDB();


// ================= CLIENT =================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// ================= COMMANDS =================
const commands = [
    new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Get purchase instructions via tickets')
        .addStringOption(opt =>
            opt.setName('client')
                .setDescription('Product')
                .setRequired(true)
                .addChoices(
                    { name: 'Krypton', value: 'krypton' },
                    { name: 'Nova', value: 'nova' },
                    { name: 'Paragon', value: 'paragon' }
                )
        ),

        new SlashCommandBuilder()
    .setName('update')
    .setDescription('Send bot update (BotDev only)'),

        new SlashCommandBuilder()
    .setName('genlicense')
    .setDescription('Generate a license (staff only)')
    .addStringOption(opt =>
        opt.setName('client')
            .setDescription('Select product')
            .setRequired(true)
            .addChoices(
                { name: 'Krypton', value: 'krypton' },
                { name: 'Nova', value: 'nova' },
                { name: 'Paragon', value: 'paragon' }
            )
    ),

    new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('Redeem license key')
        .addStringOption(opt =>
            opt.setName('code')
                .setDescription('License key')
                .setRequired(true)
        ),



    new SlashCommandBuilder()
        .setName('licenses')
        .setDescription('View all licenses (staff only)'),

    new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('View user licenses (staff only)')
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('User')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('botdev')
        .setDescription('Bot info')
];

// ================= REGISTER =================
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands.map(c => c.toJSON()) }
    );
    console.log('✅ Commands registered');
})();

// ================= HELPERS =================
function isStaff(member) {
    return member.roles.cache.some(r => STAFF_ROLES.includes(r.id));
}

function genCode(type) {
    return `${type.toUpperCase()}-${uuidv4().split('-')[0]}`;
}

function generateLicense(type, userId) {
    const code = genCode(type);

    db.licenses[code] = {
        userId,
        type,
        used: false,
        createdAt: Date.now()
    };

    if (!db.users[userId]) db.users[userId] = [];
    db.users[userId].push(code);

    saveDB();
    return code;
}

// ================= LOG =================
function log(msg) {
    client.channels.fetch(LOG_CHANNEL_ID)
        .then(c => c.send(msg))
        .catch(() => {});
}

// ================= CORE =================
async function handleRedeem(user, code, guild) {
    const data = db.licenses[code];

    if (!data) return '❌ Invalid license';
    if (data.used) return '⚠️ Already used';

    data.used = true;
    saveDB();

    log(`🔑 ${user.tag} redeemed ${code}`);

    if (guild) {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (member) {
            if (data.type === 'krypton') await member.roles.add(ROLE_KRYPTON).catch(() => {});
            if (data.type === 'nova') await member.roles.add(ROLE_NOVA).catch(() => {});
            if (data.type === 'paragon') await member.roles.add(ROLE_PARAGON).catch(() => {});
        }
    }

    // 🔥 CLIENT RESPONSES
    if (data.type === 'nova') {
        return '🚧 Thank you for buying Nova!\nhttps://www.mediafire.com/file/21wmimb6yntxvum/Nova-Patched-Client-Mod-Fabric-1.21.11.jar/file';
    }

    if (data.type === 'paragon') {
        return '⚔️ Thank you for buying Paragon!\nInstall it here! https://www.mediafire.com/file/ble5mkt30p5yypq/Paragon_Client_1.21.11_Optimized.jar/file.';
    }

    return '🔥 Thank you for buying Krypton!\nhttps://www.mediafire.com/file/oiz20ehm7yci095/Krypton%252B.jar/file';
}
// ================= EVENTS =================
client.on('ready', () => {
    console.log(`🚀 Logged in as ${client.user.tag}`);


    // Set Do Not Disturb
    client.user.setStatus('dnd');

    
    const statuses = [
        (g) => ({ name: "Krypton System 🔐", type: 0 }),
        (g) => ({ name: "Nova Loader 🚧", type: 0 }),
        (g) => ({ name: "Paragon Loader ⚔️", type: 0 }),
        (g) => ({ name: "License System Active 🔑", type: 0 }),
        (g) => ({ name: "Ticket Support 🎫", type: 3 }),
        (g) => ({ name: `Watching ${g.memberCount} Users`, type: 3 }),
        (g) => ({ name: "Anti-Leak Protection 🛡️", type: 0 }),
        (g) => ({ name: "Developed by baylogandev 💻", type: 0 })
    ];

    let i = 0;

    setInterval(() => {
        try {
            const guild = client.guilds.cache.get('1490057043015499886');
            if (!guild) return;

            const status = statuses[i](guild);

            client.user.setPresence({
                status: 'dnd',
                activities: [
                    {
                        name: status.name,
                        type: status.type
                    }
                ]
            });

            i = (i + 1) % statuses.length;

        } catch (err) {
            console.log("Status error:", err);
        }
    }, 15000); // ✅ 15 seconds
});

// ================= SAFE INTERACTION HANDLER =================
client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;

    try {

        // ALWAYS FIRST
        await i.deferReply({ flags: 64 });

        // ================= BUY =================
        if (i.commandName === 'buy') {
            const type = i.options.getString('client');

            const embed = new EmbedBuilder()
                .setTitle('🛒 Purchase via Tickets')
                .setColor('Gold')
                .setDescription(
                    `You selected **${type.toUpperCase()}**\n\n` +
                    `➡️ Go to the tickets channel\n` +
                    `➡️ Open a purchase ticket\n` +
                    `➡️ Staff will assist you\n\n` +
                    `⚠️ Do not redeem yet`
                );

            i.user.send({ embeds: [embed] }).catch(() => {});
            return i.editReply('📩 Check your DMs for instructions');
        }

 // ================= UPDATE =================
if (i.commandName === 'update') {

    // 🔒 ONLY 1 USER CAN USE
    if (i.user.id !== BOTDEV_ID) {
        return i.editReply('❌ You are not allowed to use this command');
    }

    const message = `**📢 Bot Update**

\`\`\`ansi
[1;35m======================================[0m
[1;36m        PARAGON CLIENTS UPDATE        [0m
[1;35m======================================[0m

[1;32m✔ Paragon Available[0m
[1;34m➤ Purchase & redeem now enabled[0m

[1;32m✔ Krypton Available[0m
[1;34m➤ Instant license redeem active[0m

[1;32m✔ Nova Released[0m
[1;34m➤ Now purchasable & fully redeemable[0m

[1;32m✔ Links Updated[0m
[1;34m➤ All purchase & download links refreshed[0m

[1;32m✔ License System Upgraded[0m
[1;34m➤ Rotating keys system[0m
[1;34m➤ DM redeem support[0m
[1;34m➤ Staff generation tools[0m

[1;32m✔ Purchase System[0m
[1;34m➤ Use /buy to purchase products[0m
[1;34m➤ Instant + staff-assisted checkout[0m

[1;32m✔ Anti-Leak Protection[0m
[1;34m➤ License tracking enabled[0m

[1;35m--------------------------------------[0m

[1;36mEverything is now live and updated[0m
[1;36mUse the bot to get started 👀[0m
\`\`\``;

    const UPDATE_CHANNEL_ID = '1497390255404355656';

    try {
        const updateChannel = await client.channels.fetch(UPDATE_CHANNEL_ID);

        if (!updateChannel) {
            return i.editReply('❌ Update channel not found');
        }

        await updateChannel.send(message);

    } catch (err) {
        console.log('Update send error:', err);
        return i.editReply('❌ Failed to send update (check bot permissions)');
    }

    // optional log
    try {
        const logCh = await client.channels.fetch(LOG_CHANNEL_ID);
        if (logCh) await logCh.send(message);
    } catch {}
}
    
        // ================= GENLICENSE =================
if (i.commandName === 'genlicense') {

    // 🔒 staff check
    if (!isStaff(i.member)) {
        return i.editReply('❌ Staff only');
    }

    const type = i.options.getString('client');

    // generate license (assign to "staff" or null user)
    const code = generateLicense(type, 'staff');

    // clean embed
    const embed = new EmbedBuilder()
        .setTitle('🔑 License Generated')
        .setColor('Purple')
        .setDescription(
            `Product: **${type.toUpperCase()}**\n` +
            `License: \`${code}\``
        )
        .setFooter({ text: `Generated by ${i.user.tag}` });

    // send to staff privately
    await i.user.send({ embeds: [embed] }).catch(() => {});

    // reply in slash command
    await i.editReply('✅ License generated and sent to your DMs');

    // log it
    log(`🛠️ ${i.user.tag} generated ${type} license → ${code}`);
}

        // ================= REDEEM =================
        if (i.commandName === 'redeem') {
            const res = await handleRedeem(
                i.user,
                i.options.getString('code'),
                i.guild
            );
            return i.editReply(res);
        }


        // ================= LICENSE LIST =================
        if (i.commandName === 'licenses') {
            if (!isStaff(i.member))
                return i.editReply('❌ Staff only');

            const list = Object.entries(db.licenses)
                .slice(0, 25)
                .map(([k, v]) => `${k} | ${v.type} | used: ${v.used}`)
                .join('\n');

            return i.editReply(list || 'No licenses');
        }

        // ================= USER INFO =================
        if (i.commandName === 'userinfo') {
            if (!isStaff(i.member))
                return i.editReply('❌ Staff only');

            const user = i.options.getUser('user');
            const list = db.users[user.id] || [];

            return i.editReply(list.join('\n') || 'No licenses');
        }

        // ================= BOTDEV =================
        if (i.commandName === 'botdev') {
            return i.editReply('🤖 License System v4 Stable Build');
        }

    } catch (err) {
        console.log('Interaction error:', err);

        if (!i.replied) {
            i.reply({ content: '⚠️ Error occurred', flags: 64 }).catch(() => {});
        }
    }
});

const dmCooldown = new Map();

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    if (msg.channel.type !== ChannelType.DM) return;

    const content = msg.content.trim();

    // ❌ ignore empty / test spam messages
    if (!content || content.length < 3) return;

    // 🔒 cooldown (prevents double replies)
    const now = Date.now();
    const last = dmCooldown.get(msg.author.id) || 0;

    if (now - last < 3000) return;
    dmCooldown.set(msg.author.id, now);

    try {
        const res = await handleRedeem(msg.author, content, null);

        if (res) {
            await msg.reply(res);
        }
    } catch (err) {
        console.log('DM redeem error:', err);
    }




});
client.login(TOKEN);
