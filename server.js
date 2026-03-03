const WebSocket = require("ws");
const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

// 部屋のデータを保存するオブジェクト
let rooms = {};

wss.on("connection", (ws) => {
    ws.isAlive = true;
    // クライアントからの生存確認に応答
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);
        const rid = data.room;

        // 1. 入室処理
        if (data.type === "JOIN") {
            if (!rooms[rid]) {
                rooms[rid] = { 
                    players: [], 
                    scores: [0, 0], 
                    parentIdx: 0, 
                    currentPCard: null 
                };
            }

            const room = rooms[rid];

            // 満員でない場合のみ追加
            if (room.players.length < 2) {
                const myIndex = room.players.length;
                room.players.push(ws);
                ws.room = rid;
                ws.myIndex = myIndex;

                // クライアントに「君は○番だ」と背番号を教える（重要：これでスコアが固定される）
                ws.send(JSON.stringify({ type: "ASSIGN_ID", index: myIndex }));

                if (room.players.length === 2) {
                    // 2人揃ったら全員に開始合図
                    room.players.forEach(p => p.send(JSON.stringify({ type: "START" })));
                    // 最初のターンを開始
                    setTimeout(() => sendTurn(rid), 1000);
                } else {
                    ws.send(JSON.stringify({ type: "WAITING" }));
                }
            }
        }

        // 2. 予想処理
        if (data.type === "PREDICT") {
            const room = rooms[rid];
            if (!room) return;

            const pIdx = room.parentIdx;
            const cIdx = 1 - pIdx;
            const pCard = room.currentPCard;
            const cCard = Math.floor(Math.random() * 52) + 1; // 子のカードを決定
            
            // 勝敗判定
            const pVal = (pCard - 1) % 13 + 1;
            const cVal = (cCard - 1) % 13 + 1;
            const win = (data.choice === "HIGH" && cVal > pVal) || (data.choice === "LOW" && cVal < pVal);
            
            if (win) room.scores[cIdx] += 2;

            // 全員に結果を送信
            room.players.forEach(p => p.send(JSON.stringify({
                type: "RESULT", 
                card: cCard, 
                scores: room.scores,
                win: win,
                choice: data.choice
            })));

            // 3秒後に親を交代して次のターンへ
            setTimeout(() => {
                room.parentIdx = 1 - room.parentIdx; 
                sendTurn(rid);
            }, 3000);
        }

        // 3. 生存確認（PING）への応答
        if (data.type === "PING") {
            ws.send(JSON.stringify({ type: "PONG" }));
        }
    });

    // 切断時の処理
    ws.on("close", () => {
        const rid = ws.room;
        if (rooms[rid]) {
            // プレイヤーをリストから除外
            rooms[rid].players = rooms[rid].players.filter(p => p !== ws);
            // 部屋が空になったら削除
            if (rooms[rid].players.length === 0) delete rooms[rid];
        }
    });
});

// 次のターンを送信する関数
function sendTurn(rid) {
    const room = rooms[rid];
    if (!room || room.players.length < 2) return;
    
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

// サーバー側から定期的に生存確認を行い、フリーズを防ぐ
setInterval(() => {
    wss.clients.forEach(ws => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

console.log(`Luxury High-Low Server started on port ${port}`);
