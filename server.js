let ws;
    let room;
    let myPlayerIndex = -1; 
    let pingInterval;
    const SERVER_URL = 'wss://high-low-game-i5xg.onrender.com';

    function startOnline() {
        room = document.getElementById('room-id').value;
        if(!room) return alert("IDを入力してください");
        connect();
        document.getElementById('setup-overlay').style.display = 'none';
    }

    function connect() {
        if(ws) ws.close();
        ws = new WebSocket(SERVER_URL);

        ws.onopen = () => {
            ws.send(JSON.stringify({type: 'JOIN', room: room}));
            if(pingInterval) clearInterval(pingInterval);
            pingInterval = setInterval(() => {
                if(ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({type: 'PING'}));
            }, 25000);
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            handleServerData(data);
        };

        ws.onclose = () => {
            document.getElementById('status').innerText = "Disconnected. Reconnecting...";
            setTimeout(connect, 3000);
        };
    }

    function handleServerData(data) {
        const status = document.getElementById('status');
        
        // スコアデータが含まれていれば常に更新
        if (data.scores && myPlayerIndex !== -1) {
            document.getElementById('my-score').innerText = data.scores[myPlayerIndex];
            document.getElementById('opp-score').innerText = data.scores[1 - myPlayerIndex];
        }

        switch(data.type) {
            case 'ASSIGN_ID':
                myPlayerIndex = data.index;
                console.log("Your Player Index is:", myPlayerIndex);
                break;
            case 'TURN':
                renderTurn(data);
                break;
            case 'RESULT':
                revealResult(data);
                break;
            case 'WAITING':
                status.innerText = "WAITING FOR OPPONENT...";
                break;
            case 'START':
                status.innerText = "GAME START!";
                break;
        }
    }

    function renderTurn(data) {
        const pSlot = document.getElementById('p-slot');
        const cSlot = document.getElementById('c-slot');
        const status = document.getElementById('status');

        pSlot.innerHTML = `<div class="card"><img src="images/png/${getCardFile(data.card)}"></div>`;
        cSlot.innerHTML = `<div class="card card-back"></div>`;

        if(data.role === 'CHILD') {
            status.innerText = "YOUR TURN: HIGH OR LOW?";
            document.getElementById('h-btn').disabled = false;
            document.getElementById('l-btn').disabled = false;
            document.getElementById('box-me').classList.add('active');
            document.getElementById('box-opp').classList.remove('active');
        } else {
            status.innerText = "OPPONENT'S TURN...";
            document.getElementById('h-btn').disabled = true;
            document.getElementById('l-btn').disabled = true;
            document.getElementById('box-opp').classList.add('active');
            document.getElementById('box-me').classList.remove('active');
        }
    }

    function revealResult(data) {
        const cSlot = document.getElementById('c-slot');
        cSlot.innerHTML = `<div class="card"><img src="images/png/${getCardFile(data.card)}"></div>`;
        
        const status = document.getElementById('status');
        if (data.win) {
            status.innerHTML = "<span style='color:#00ff00'>WIN! +2 PTS</span>";
        } else {
            status.innerHTML = "<span style='color:#ff4444'>LOSE...</span>";
        }
        // 結果表示時にもう一度スコアを念押しで更新
        if (data.scores && myPlayerIndex !== -1) {
            document.getElementById('my-score').innerText = data.scores[myPlayerIndex];
            document.getElementById('opp-score').innerText = data.scores[1 - myPlayerIndex];
        }
    }

    // --- predict と getCardFile は以前のまま ---
