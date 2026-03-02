const WebSocket = require("ws");
const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

let rooms = {};

wss.on("connection", (ws) => {
    ws.on("message", (msg) => {
        const data = JSON.parse(msg);
        if (data.type === "JOIN") {
            const rid = data.room;
            if (!rooms[rid]) rooms[rid] = [];
            if (rooms[rid].length < 2) {
                rooms[rid].push(ws);
                ws.room = rid;
                if (rooms[rid].length === 2) {
                    rooms[rid].forEach(c => c.send(JSON.stringify({type:"START"})));
                    sendTurn(rid);
                }
            }
        }
        if (data.type === "PREDICT") {
            const rid = data.room;
            const cCard = Math.floor(Math.random() * 52) + 1;
            rooms[rid].forEach(c => c.send(JSON.stringify({type:"RESULT", card: cCard, choice: data.choice})));
            setTimeout(() => sendTurn(rid), 2000);
        }
    });
});

function sendTurn(rid) {
    const pCard = Math.floor(Math.random() * 52) + 1;
    if(!rooms[rid]) return;
    rooms[rid][0].send(JSON.stringify({type:"TURN", role:"PARENT", card:pCard}));
    rooms[rid][1].send(JSON.stringify({type:"TURN", role:"CHILD", card:pCard}));
}
console.log(`Server started on port ${port}`);
