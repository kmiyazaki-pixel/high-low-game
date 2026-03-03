const WebSocket = require("ws");
const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

let rooms = {};

wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);
        const rid = data.room;

        if (data.type === "JOIN") {
            if (!rooms[rid]) {
                rooms[rid] = { players: [], scores: [0, 0], parentIdx: 0, currentPCard: null };
            }
            const room = rooms[rid];
            if (room.players.length < 2) {
                const myIndex = room.players.length;
                room.players.push(ws);
                ws.room = rid;
                ws.myIndex = myIndex;
                ws.send(JSON.stringify({ type: "ASSIGN_ID", index: myIndex }));

                if (room.players.length === 2) {
                    room.players.forEach(p => p.send(JSON.stringify({ type: "START" })));
                    setTimeout(() => sendTurn(rid), 1000);
                } else {
                    ws.send(JSON.stringify({ type: "WAITING" }));
                }
            }
        }

        if (data.type === "PREDICT") {
            const room = rooms[rid];
            if (!room) return;
            const pCard = room.currentPCard;
            const cCard = Math.floor(Math.random() * 52) + 1;
            const win = ((data.choice === "HIGH" && ((cCard-1)%13+1) > ((pCard-1)%13+1)) || 
                         (data.choice === "LOW" && ((cCard-1)%13+1) < ((pCard-1)%13+1)));
            
            if (win) room.scores[1 - room.parentIdx] += 1;

            room.players.forEach(p => p.send(JSON.stringify({
                type: "RESULT", card: cCard, scores: room.scores, win: win, choice: data.choice
            })));

            setTimeout(() => {
                room.parentIdx = 1 - room.parentIdx; 
                sendTurn(rid);
            }, 3000);
        }

        if (data.type === "PING") ws.send(JSON.stringify({ type: "PONG" }));
    });

    ws.on("close", () => {
        const rid = ws.room;
        if (rooms[rid]) {
            rooms[rid].players = rooms[rid].players.filter(p => p !== ws);
            rooms[rid].players.forEach(p => p.send(JSON.stringify({ type: "OPPONENT_LEFT" })));
            if (rooms[rid].players.length === 0) delete rooms[rid];
        }
    });
});

function sendTurn(rid) {
    const room = rooms[rid];
    if (!room || room.players.length < 2) return;
    room.currentPCard = Math.floor(Math.random() * 52) + 1;
    room.players.forEach((client, index) => {
        client.send(JSON.stringify({
            type: "TURN", 
            role: (index === room.parentIdx ? "PARENT" : "CHILD"),
            card: room.currentPCard,
            scores: room.scores
        }));
    });
}

setInterval(() => {
    wss.clients.forEach(ws => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);
