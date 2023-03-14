const { Client, Intents, Collection, MessageAttachment, MessageEmbed, Permissions, Constants, ApplicationCommandPermissionsManager } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_WEBHOOKS, Intents.FLAGS.GUILD_INVITES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING] });
const ayarlar = require("./ayarlar");
const db = require("orio.db")
const message = require("./events/message");
let prefix = ayarlar.prefix;
const moment = require("moment")
moment.locale("tr")
const Discord = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
let slashCommands = ayarlar.slashCommands;
if (slashCommands == true) { let sunucuID = ayarlar.sunucuID; if (sunucuID == "") { return console.log(`\n\n[${moment().format('LTS')}] Hata => Slash komutların çalışması için *AYARLAR.JS* dosyasındaki "sunucuID" kısmını doldurmalısın.\n\n`) } }



client.commands = new Collection();
client.aliases = new Collection();

["command"].forEach(handler => {
  require(`./komutcalistirici`)(client);
});

client.on("ready", () => {
  require("./events/eventLoader")(client);
  if (slashCommands == true) {
    let commands = client.guilds.cache.get(ayarlar.sunucuID).commands;

    commands.create({
      name: "abone-sistemi-kur",
      description: "Abone sistemini kurarsın.",
      options: [{
        name: "abone-rol",
        description: "Abone rolünü seçmelisin.",
        type: "ROLE",
        required: true
      },
      {
        name: "abone-yetkilisi",
        description: "Abone yetkilisi rolünü seçmelisin.",
        type: "ROLE",
        required: true
      },
      {
        name: "log-kanalı",
        description: "Abone loglarının gideceği kanalı seçmelisin.",
        type: "CHANNEL",
        channelTypes: "GUILD_TEXT",
        required: true
      }]
    })
    commands.create({
      name: "abone",
      description: "İstediğin bir kullanıcıya abone rolü verirsin.",
      options: [{
        name: "kullanıcı",
        description: "Abone rolü vermek istediğin kullanıcıyı seçmelisin.",
        type: "USER",
        required: true
      }]
    })
    commands.create({
      name: "abone-kaldır",
      description: "İstediğin bir kullanıcının abone rolünü kaldırırsın.",
      options: [{
        name: "kullanıcı",
        description: "Abonene rolünü kaldıracağın kullanıcıyı seçmelisin.",
        type: "USER",
        required: true
      }]
    })
  }

});

client.on("interactionCreate", (interaction) => {
  const { commandName, options } = interaction;

  if (commandName == "abone-sistemi-kur") {
    if (!interaction.member.permissions.has("ADMINISTRATOR")) { return interaction.reply({ content: `Bu komutu uygulayabilmek için gerekli yetkiye sahip değilsin.`, ephemeral: true }) }

    let abone_rol = options.getRole("abone-rol")
    let abone_yetkili = options.getRole("abone-yetkilisi")
    let log_kanalı = options.getChannel("log-kanalı")

    db.set(`abone_rol-${interaction.guild.id}`, abone_rol.id)
    db.set(`abone_yetkili-${interaction.guild.id}`, abone_yetkili.id)
    db.set(`abone_log_kanal-${interaction.guild.id}`, log_kanalı.id)

    interaction.reply({ content: `Abone sistemi başarıyla **kuruldu.** 🎉`, ephemeral: true })
  }

  if (commandName == "abone") {

    //KONTROL
    let abone_rol = db.get(`abone_rol-${interaction.guild.id}`)
    let abone_yetkili = db.get(`abone_yetkili-${interaction.guild.id}`)
    let log_kanalı = db.get(`abone_log_kanal-${interaction.guild.id}`)
    if (!abone_rol) { return interaction.reply({ content: `[HATA] Sistem kurulumu yapılmamış. ➝ _/abone-sistemi-kur_`, ephemeral: true }) }
    if (!abone_yetkili) { return interaction.reply({ content: `[HATA] Sistem kurulumu yapılmamış. ➝ _/abone-sistemi-kur_`, ephemeral: true }) }
    if (!log_kanalı) { return interaction.reply({ content: `[HATA] Sistem kurulumu yapılmamış. ➝ _/abone-sistemi-kur_`, ephemeral: true }) }

    if (!interaction.member.roles.cache.get(abone_yetkili)) { return interaction.reply({ content: `Bu komudu uygulayabilmek için _Abone Yetkilisi_ olman gerekiyor.`, ephemeral: true }) }

    let kullanici = options.getUser("kullanıcı")
    if (interaction.guild.members.cache.get(kullanici.id).roles.cache.get(abone_rol)) { return interaction.reply({ content: `Bu kullanıcı zaten abone rolüne sahip!`, ephemeral: true }) }
    interaction.guild.members.cache.get(kullanici.id).roles.add(abone_rol).catch(error => console.log(error))

    let yetkili = kullanici
    let kullanıcı = kullanici


    let AboneVerildiMesajı = ayarlar.AboneVerildiMesajı
    const AboneVerildiMesajı_v2 = AboneVerildiMesajı
      .replace("{yetkili}", interaction.member)
      .replace("{kullanıcı}", kullanici)
    // ABONE VERİLDİ MESAJI
    interaction.reply(`${AboneVerildiMesajı_v2}`)

    // ABONE LOG
    if (ayarlar.AboneLog == true) {
      let AboneLogMesajı = ayarlar.AboneLogMesajı
      const AboneLogMesajı_v2 = AboneLogMesajı
        .replace("{yetkili}", interaction.member)
        .replace("{kullanıcı}", kullanici)
      interaction.guild.channels.cache.get(log_kanalı).send(`${AboneLogMesajı_v2}`)
    }

  }
  if (commandName == "abone-kaldır") {

    //KONTROL
    let abone_rol = db.get(`abone_rol-${interaction.guild.id}`)
    let abone_yetkili = db.get(`abone_yetkili-${interaction.guild.id}`)
    let log_kanalı = db.get(`abone_log_kanal-${interaction.guild.id}`)
    if (!abone_rol) { return interaction.reply({ content: `[HATA] Sistem kurulumu yapılmamış. ➝ _/abone-sistemi-kur_`, ephemeral: true }) }
    if (!abone_yetkili) { return interaction.reply({ content: `[HATA] Sistem kurulumu yapılmamış. ➝ _/abone-sistemi-kur_`, ephemeral: true }) }
    if (!log_kanalı) { return interaction.reply({ content: `[HATA] Sistem kurulumu yapılmamış. ➝ _/abone-sistemi-kur_`, ephemeral: true }) }

    if (!interaction.member.roles.cache.get(abone_yetkili)) { return interaction.reply({ content: `Bu komudu uygulayabilmek için _Abone Yetkilisi_ olman gerekiyor.`, ephemeral: true }) }

    let kullanici = options.getUser("kullanıcı")
    if (!interaction.guild.members.cache.get(kullanici.id).roles.cache.get(abone_rol)) {
      return interaction.reply({ content: `Bu kullanıcı hali hazırda abone rolüne sahip değil!`, ephemeral: true })
    }
    interaction.guild.members.cache.get(kullanici.id).roles.remove(abone_rol).catch(error => console.log(error))
    interaction.reply({content:`${kullanici} Adlı kullanıcının abone rolü kaldırıldı.`})

    if(ayarlar.AboneLog == true) {
      let AboneKaldirmaLogMesajı = ayarlar.AboneLogKaldırmaMesajı
      if(AboneKaldirmaLogMesajı == "") {return}
      const AboneLogKaldırmaMesajı_v2 = AboneKaldirmaLogMesajı
      .replace("{yetkili}", interaction.member)
      .replace("{kullanıcı}", kullanici)
      interaction.guild.channels.cache.get(log_kanalı).send({content:`${AboneLogKaldırmaMesajı_v2}`})
    }
  }
})


client.login(ayarlar.token);
