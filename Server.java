import java.io.*;
import java.net.*;
import java.util.*;

public class HighLowServer {
    private static List<Integer> deck;
    private static PrintWriter[] out = new PrintWriter[2];
    private static BufferedReader[] in = new BufferedReader[2];

    public static void main(String[] args) throws IOException {
        ServerSocket server = new ServerSocket(12345);
        System.out.println("サーバー起動。接続を待機中...");

        for (int i = 0; i < 2; i++) {
            Socket s = server.accept();
            out[i] = new PrintWriter(s.getOutputStream(), true);
            in[i] = new BufferedReader(new InputStreamReader(s.getInputStream()));
            out[i].println("WELCOME|PLAYER" + (i + 1));
            System.out.println("Player " + (i + 1) + " が接続しました。");
        }

        playGame();
    }

    private static void playGame() throws IOException {
        deck = new ArrayList<>();
        for (int i = 1; i <= 52; i++) deck.add(i);
        Collections.shuffle(deck);

        int[] scores = {0, 0};
        boolean player1IsParent = true;

        while (!deck.isEmpty()) {
            int parentIdx = player1IsParent ? 0 : 1;
            int childIdx = player1IsParent ? 1 : 0;

            int pCard = deck.remove(0);
            int cCard = deck.remove(0);
            int pVal = (pCard - 1) % 13 + 1;
            int cVal = (cCard - 1) % 13 + 1;

            // 状態通知
            out[parentIdx].println("TURN|PARENT|" + pCard + "|" + scores[0] + "|" + scores[1]);
            out[childIdx].println("TURN|CHILD|" + pCard + "|" + scores[0] + "|" + scores[1]);

            // 子の予想を待つ
            String choice = in[childIdx].readLine(); // "HIGH" or "LOW"
            boolean win = false;
            if (choice.equals("HIGH") && cVal > pVal) win = true;
            if (choice.equals("LOW") && cVal < pVal) win = true;

            if (win) scores[childIdx] += 2;

            // 結果を全員に送信
            String res = "RESULT|" + cCard + "|" + (win ? "WIN" : "LOSE");
            out[0].println(res);
            out[1].println(res);

            player1IsParent = !player1IsParent;
        }
        out[0].println("END|" + scores[0] + "|" + scores[1]);
        out[1].println("END|" + scores[0] + "|" + scores[1]);
    }
}
