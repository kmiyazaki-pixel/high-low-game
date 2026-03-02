import java.io.*;
import java.net.*;
import java.util.Scanner;

public class HighLowClient {
    public static void main(String[] args) throws IOException {
        Socket socket = new Socket("localhost", 12345);
        BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
        PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
        Scanner sc = new Scanner(System.in);

        String line;
        while ((line = in.readLine()) != null) {
            String[] data = line.split("\\|");
            String cmd = data[0];

            switch (cmd) {
                case "WELCOME":
                    System.out.println("Connected: " + data[1]);
                    break;

                case "TURN":
                    System.out.println("\n--- SCORE YOU:" + data[3] + " CPU:" + data[4] + " ---");
                    System.out.println("親のカード: " + getCardName(Integer.parseInt(data[2])));
                    if (data[1].equals("PARENT")) {
                        System.out.println("あなたは親です。相手の予想を待っています...");
                    } else {
                        System.out.println("あなたは子です！自分のカードは親より...");
                        System.out.print("1: HIGH / 2: LOW > ");
                        out.println(sc.next().equals("1") ? "HIGH" : "LOW");
                    }
                    break;

                case "RESULT":
                    System.out.println("子のカードは: " + getCardName(Integer.parseInt(data[1])));
                    System.out.println("結果: " + data[2]);
                    break;

                case "END":
                    System.out.println("\n=== GAME OVER ===");
                    System.out.println("RESULT: " + data[1] + " vs " + data[2]);
                    return;
            }
        }
    }

    private static String getCardName(int n) {
        String[] suits = {"Hearts", "Spades", "Diamonds", "Clubs"};
        String suit = suits[(n - 1) / 13];
        int rank = (n - 1) % 13 + 1;
        return rank + " of " + suit;
    }
}
