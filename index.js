require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const axios = require('axios');

const TOKEN = process.env.TOKEN;
const prefix = process.env.PREFIX;
const serverid = process.env.SERVER_ID;
const channelid = process.env.CHANNEL_ID;
const hooklink = process.env.WEBHOOK_URL;


const client = new Client({ checkUpdate: false });


const discord_api = 'https://discord.com/api/v9/';
const agent_data = '{"os":"Windows","browser":"Chrome","device":"","system_locale":"ru-RU","browser_user_agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36","browser_version":"126.0.0.0","os_version":"10","referrer":"","referring_domain":"","referrer_current":"","referring_domain_current":"","release_channel":"stable","client_build_number":309515,"client_event_source":null}'
const headers = {
    Authorization: TOKEN,
    'x-super-properties': btoa(agent_data)
};

const randint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pattern = /:(.*?):/g;

const replaceEmojis = (text) => {
  const matches = (text.match(pattern) || []).map(str => str.replace(/:/g, ''));
  if (!matches.length) return text;

  matches.forEach(emoj => {
    const emoji = client.emojis.cache.find(emoji => emoji.name === emoj);
    text = text.replace(`:${emoj}:`, `<${emoji.animated ? 'a' : ''}꞉${emoji.name}꞉${emoji.id}>`);
  });

  return text.replaceAll('꞉', ':');
};


async function sendforward(message, datatosend) {

  await axios.post(hooklink, datatosend);
  const msgs = await axios.get(`${discord_api}channels/${channelid}/messages?limit=1`, {headers});
  await axios.delete(`${discord_api}channels/${message.channel.id}/messages/${message.id}`, {headers});
  await axios.post(
      `${discord_api}channels/${message.channel.id}/messages`,
      {
        flags: 4096,
        message_reference: {
          guild_id: serverid,
          channel_id: channelid,
          message_id: msgs.data[0].id,
          type: 1
        },
      },
      {headers}
    )
    .then(response => {
      console.log(response.data, response.status);
    })
    .catch(error => {
      console.error(error);
    });
};

client.once("ready", () => { 
  console.log(`Logged in as ${client.user.username}!`);
});

client.on("messageCreate", async (message) => {
    if (message.author.id != client.user.id) return; 

    const args = message.content.trim().split(/ +/);

    const command = args.shift().toLowerCase();

    if (command === prefix + 'embed' && hooklink) {
      const replacedext = replaceEmojis(args.join(' '));
      if (!replacedext) return;
    
      await sendforward(message, {
        embeds: [{ description: replacedext || 'No description', color: randint(0, 16777215) }]
      });
    } else if (command === prefix + 'help') {
      await message.reply(`Prefix: ${prefix} \n Commands: ${prefix}embed - sends a message as an embed \n\n Write a message with :emoji name: to send a message with a custom and/or animated emoji`);
    } else {
      const replacedext = replaceEmojis(message.content);
      if (replacedext === message.content) return;
    
      await sendforward(message, { content: replacedext });
    }
    
})

client.login(TOKEN);