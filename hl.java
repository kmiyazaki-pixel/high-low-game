// GameController.java
@RestController
@RequestMapping("/api")
public class GameController {

    private List<Integer> deck;
    private int p1Score = 0;
    private int p2Score = 0;
    private boolean isP1Parent = true; // P1が親かどうか

    public GameController() {
        initGame();
    }

    private void initGame() {
        deck = new ArrayList<>();
        for (int i = 1; i <= 13; i++) {
            for (int j = 0; j < 4; j++) deck.add(i);
        }
        Collections.shuffle(deck);
    }

    @PostMapping("/play")
    public Map<String, Object> play(@RequestBody Map<String, String> request) {
        String prediction = request.get("prediction");
        
        // デッキから2枚引く
        int parentCard = deck.remove(0);
        int childCard = deck.remove(0);

        boolean win = false;
        if (prediction.equals("HIGH") && childCard > parentCard) win = true;
        if (prediction.equals("LOW") && childCard < parentCard) win = true;

        // スコア加算（当たれば2枚獲得、外れや同数は捨てる）
        if (win) {
            if (isP1Parent) p2Score += 2; // 親がP1なら、当てるのは子(P2)
            else p1Score += 2;
        }

        String message = win ? "的中！2枚獲得" : "残念！没収";
        if (parentCard == childCard) message = "同数につき没収";

        // 親の交代
        isP1Parent = !isP1Parent;

        Map<String, Object> response = new HashMap<>();
        response.put("parentCard", parentCard);
        response.put("childCard", childCard);
        response.put("p1Score", p1Score);
        response.put("p2Score", p2Score);
        response.put("remaining", deck.size());
        response.put("message", message);
        response.put("nextTurn", isP1Parent ? "Player 1の親番です" : "Player 2の親番です");
        
        if (deck.isEmpty()) {
            response.put("winner", p1Score > p2Score ? "Player 1" : (p2Score > p1Score ? "Player 2" : "引き分け"));
        }

        return response;
    }
}
