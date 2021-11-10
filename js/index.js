const ChatControl = require("./chat-control");
const chat = new ChatControl({
    dataDir: "C:\\temp\\matrix-data\\",
    domain: "lolec.ru"
});

chat.copyTemplate("C:\\temp\\matrix-data\\homeserver-template.yaml", "C:\\temp\\matrix-data\\homeserver.yaml", {
    "#DOMAIN": "vamily.ru"
})