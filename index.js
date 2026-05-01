const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');

const client = new Client();

// Grupos fechados
const gruposFechados = new Set();

// Sistema anti-spam
const spamControl = new Map();

// Sistema de níveis
const xpUsuarios = new Map();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🤖 Bot online!');
});

// BOAS-VINDAS
client.on('group_join', async notification => {

    const chat = await notification.getChat();

    const contato = await notification.getContact();

    chat.sendMessage(
`🌸 Olá @${contato.number}, seja muito bem-vindo(a) ao grupo!

✨ Leia as regras
💬 Respeite todos
🚫 Evite spam
🎵 Divirta-se

Esperamos que você goste daqui 💖`,
        {
            mentions: [contato]
        }
    );
});

client.on('message', async message => {

    const chat = await message.getChat();

    if (!chat.isGroup) return;

    const contato = await message.getContact();

    const participante = chat.participants.find(
        p => p.id._serialized === contato.id._serialized
    );

    const isAdmin = participante.isAdmin || participante.isSuperAdmin;

    const grupoId = chat.id._serialized;

    const texto = message.body.toLowerCase();

    // =========================
    // SISTEMA DE NÍVEL
    // =========================

    if (!xpUsuarios.has(contato.id._serialized)) {
        xpUsuarios.set(contato.id._serialized, 0);
    }

    xpUsuarios.set(
        contato.id._serialized,
        xpUsuarios.get(contato.id._serialized) + 5
    );

    const xp = xpUsuarios.get(contato.id._serialized);

    const nivel = Math.floor(xp / 100);

    // =========================
    // FECHAR GRUPO
    // =========================

    if (texto === 'f' && isAdmin) {

        gruposFechados.add(grupoId);

        await chat.sendMessage(
            '🔒 Grupo fechado! Apenas administradores podem falar.'
        );

        return;
    }

    // =========================
    // ABRIR GRUPO
    // =========================

    if (texto === 'a' && isAdmin) {

        gruposFechados.delete(grupoId);

        await chat.sendMessage(
            '🔓 Grupo liberado! Todos podem falar novamente.'
        );

        return;
    }

    // =========================
    // GRUPO FECHADO
    // =========================

    if (gruposFechados.has(grupoId)) {

        if (!isAdmin) {

            await chat.sendMessage(
                `⚠️ @${contato.number}, apenas administradores podem falar agora.`,
                {
                    mentions: [contato]
                }
            );

            return;
        }
    }

    // =========================
    // ANTI-LINK
    // =========================

    if (
        texto.includes('http') ||
        texto.includes('https') ||
        texto.includes('chat.whatsapp.com')
    ) {

        if (!isAdmin) {

            await message.delete(true);

            await chat.sendMessage(
                `🚫 @${contato.number}, links não são permitidos!`,
                {
                    mentions: [contato]
                }
            );

            return;
        }
    }

    // =========================
    // ANTI-SPAM
    // =========================

    const agora = Date.now();

    if (!spamControl.has(contato.id._serialized)) {
        spamControl.set(contato.id._serialized, []);
    }

    const mensagens = spamControl.get(contato.id._serialized);

    mensagens.push(agora);

    const recentes = mensagens.filter(t => agora - t < 5000);

    spamControl.set(contato.id._serialized, recentes);

    if (recentes.length >= 5 && !isAdmin) {

        await chat.sendMessage(
            `⚠️ @${contato.number}, pare de enviar spam!`,
            {
                mentions: [contato]
            }
        );

        return;
    }

    // =========================
    // MENU
    // =========================

    if (texto === '!menu') {

        await chat.sendMessage(
`🤖 MENU PRINCIPAL

📌 COMANDOS

!menu
!regras
!puxar
!nivel
!musica
!ticket

🔒 F = fechar grupo
🔓 A = abrir grupo

🛡️ SISTEMAS ATIVOS

✅ Anti-link
✅ Anti-spam
✅ Sistema de níveis
✅ Ban automático
✅ Boas-vindas`
        );
    }

    // =========================
    // REGRAS
    // =========================

    if (texto === '!regras') {

        await chat.sendMessage(
`📜 REGRAS DO GRUPO

1️⃣ Respeite todos os membros
2️⃣ Proibido spam
3️⃣ Proibido links sem permissão
4️⃣ Evite brigas
5️⃣ Conteúdo inadequado = ban
6️⃣ Obedeça os administradores`
        );
    }

    // =========================
    // PUXAR MENU
    // =========================

    if (texto === '!puxar') {

        await chat.sendMessage(
`📂 MENU DE PUXADAS

🔎 !id
📊 !nivel
🎫 !ticket
🎵 !musica`
        );
    }

    // =========================
    // ID
    // =========================

    if (texto === '!id') {

        await chat.sendMessage(
            `🆔 Seu número: ${contato.number}`
        );
    }

    // =========================
    // BAN POR MARCAÇÃO
    // =========================

    if (texto === 'ban!' && isAdmin) {

        const mencionados = await message.getMentions();

        if (mencionados.length > 0) {

            for (const membro of mencionados) {

                await chat.removeParticipants([
                    membro.id._serialized
                ]);
            }

            await chat.sendMessage(
                '🚫 Usuário removido com sucesso!'
            );
        }
    }

    // =========================
    // NÍVEL
    // =========================

    if (texto === '!nivel') {

        await chat.sendMessage(
            `⭐ @${contato.number}
XP: ${xp}
Nível: ${nivel}`,
            {
                mentions: [contato]
            }
        );
    }

    // =========================
    // MÚSICA
    // =========================

    if (texto === '!musica') {

        await chat.sendMessage(
            '🎵 Sistema de música ativado!'
        );
    }

    // =========================
    // TICKET
    // =========================

    if (texto === '!ticket') {

        await chat.sendMessage(
`🎫 TICKET ABERTO

Nossa equipe responderá você em breve.`
        );
    }

    // =========================
    // BAN AUTOMÁTICO
    // =========================

    if (texto.includes('site+18') && !isAdmin) {

        await chat.removeParticipants([
            contato.id._serialized
        ]);
    }
});

client.initialize();
