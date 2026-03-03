const WebSocket = require("ws");
const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

let rooms = {};

wss.on("connection", (ws) => {
    // 接続維持のための処理
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);
        const rid = data.room;

        if (data.type === "JOIN") {
            if (!rooms[rid]) rooms[rid] = { players: [], parentIdx: 0, scores: [0, 0] };
            if (rooms[rid].players.length < 2) {
                rooms[rid].players.push(ws);
                ws.room = rid;
                if (rooms[rid].players.length === 2) {
                    rooms[rid].players.forEach(c => c.send(JSON.stringify({type:"START"})));
                    sendTurn(rid);
                } else {
                    ws.send(JSON.stringify({type: "WAITING"}));
                }
            }
        }

        if (data.type === "PREDICT") {
            const room = rooms[rid];
            const pIdx = room.parentIdx;
            const cIdx = 1 - pIdx;
            const pCard = room.currentPCard;
            const cCard = Math.floor(Math.random() * 52) + 1;
            
            // 勝敗判定
            const pVal = (pCard - 1) % 13 + 1;
            const cVal = (cCard - 1) % 13 + 1;
            let win = (data.choice === "HIGH" && cVal > pVal) || (data.choice === "LOW" && cVal < pVal);
            
            if(win) room.scores[cIdx] += 2;

            room.players.forEach(c => c.send(JSON.stringify({
                type: "RESULT", 
                card: cCard, 
                scores: room.scores,
                win: win
            })));

            // 2秒後に親を交代して次のターンへ
            setTimeout(() => {
                room.parentIdx = 1 - room.parentIdx; // 0と1を入れ替え
                sendTurn(rid);
            }, 3000);
        }
    });
});

function sendTurn(rid) {
    const room = rooms[rid];
    if(!room || room.players.length < 2) return;
    
    const pCard = Math.floor(Math.random() * 52) + 1;
    room.currentPCard = pCard;

    room.players.forEach((client, index) => {
        const role = (index === room.parentIdx) ? "PARENT" : "CHILD";
        client.send(JSON.stringify({
            type: "TURN", 
            role: role, 
            card: pCard,
            scores: room.scores
        }));
    });
}

// 30秒ごとに全クライアントへ生存確認（切断防止）
setInterval(() => {
    wss.clients.forEach(ws => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);
