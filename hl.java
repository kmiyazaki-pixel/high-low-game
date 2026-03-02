import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Scanner;

public class RoyalHighAndLow {
    // カードクラス
    static class Card {
        int id; // 1-52
        String suit;
        int rank; // 1(A) - 13(K)

        Card(int id) {
            this.id = id;
            String[] suits = {"Hearts", "Spades", "Diamonds", "Clubs"};
            this.suit = suits[(id - 1) / 13];
            this.rank = (id - 1) % 13 + 1;
        }

        @Override
        public String toString() {
            String rankStr = switch (rank) {
                case 1 -> "Ace";
                case 11 -> "Jack";
                case 12 -> "Queen";
                case 13 -> "King";
                default -> String.valueOf(rank);
            };
            return rankStr + " of " + suit;
        }
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        List<Card> deck = new ArrayList<>();
        for (int i = 1; i <= 52; i++) deck.add(new Card(i));
        Collections.shuffle(deck);

        // 手札を26枚ずつ分配
        List<Card> playerHand = new ArrayList<>(deck.subList(0, 26));
        List<Card> cpuHand = new ArrayList<>(deck.subList(26, 52));

        int playerScore = 0;
        int cpuScore = 0;
        boolean isPlayerParent = true;

        System.out.println("=== ROYAL HIGH & LOW (Java Edition) ===");

        while (!playerHand.isEmpty()) {
            System.out.println("\n----------------------------------");
            System.out.println("残りのカード: " + playerHand.size());
            System.out.println("Score: YOU " + playerScore + " | CPU " + cpuScore);
            
            Card parentCard, childCard;
            if (isPlayerParent) {
                System.out.println("[ あなたが親です ]");
                parentCard = playerHand.remove(0);
                childCard = cpuHand.remove(0);
                System.out.println("あなたの出したカード (親): " + parentCard);
                System.out.println("CPUがカードを伏せました (子)");
                
                // CPUのAI（単純な期待値戦略）
                String cpuChoice = (parentCard.rank > 7) ? "LOW" : "HIGH";
                System.out.println("CPUの予想: " + cpuChoice);
                
                boolean win = checkWin(parentCard.rank, childCard.rank, cpuChoice);
                revealResult(childCard, win);
                if (win) cpuScore += 2;

            } else {
                System.out.println("[ CPUが親です ]");
                parentCard = cpuHand.remove(0);
                childCard = playerHand.remove(0);
                System.out.println("CPUの出したカード (親): " + parentCard);
                System.out.println("あなたはカードを伏せました (子)");
                
                System.out.print("予想してください (1: HIGH / 2: LOW) > ");
                String choice = scanner.next().equals("1") ? "HIGH" : "LOW";
                
                boolean win = checkWin(parentCard.rank, childCard.rank, choice);
                revealResult(childCard, win);
                if (win) playerScore += 2;
            }

            isPlayerParent = !isPlayerParent; // 親を交代
        }

        System.out.println("\n=== FINAL RESULT ===");
        System.out.println("YOU: " + playerScore + " pts");
        System.out.println("CPU: " + cpuScore + " pts");
        if (playerScore > cpuScore) System.out.println("あなたの勝利！");
        else if (playerScore < cpuScore) System.out.println("あなたの負け...");
        else System.out.println("引き分け！");
    }

    private static boolean checkWin(int parentRank, int childRank, String choice) {
        if (choice.equals("HIGH")) return childRank > parentRank;
        if (choice.equals("LOW")) return childRank < parentRank;
        return false;
    }

    private static void revealResult(Card childCard, boolean win) {
        System.out.println("子のカードをオープン: " + childCard);
        if (win) System.out.println(">>> 当たり！ (+2 pts)");
        else System.out.println(">>> はずれ...");
    }
}
