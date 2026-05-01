function responder(mensagem) {

    if (mensagem === "!oi") {
        return "Oiii 😄";
    }

    if (mensagem === "!menu") {
        return `
🤖 MENU

!oi
!menu
!hora
`;
    }

    if (mensagem === "!hora") {
        return new Date().toLocaleTimeString();
    }

    return "Comando não encontrado";
}

console.log(responder("!menu"));
