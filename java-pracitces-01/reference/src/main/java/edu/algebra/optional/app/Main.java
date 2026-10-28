package edu.algebra.optional.app;
public final class Main {
    public static void main(String[] args) {
        if (args.length != 1) { System.err.println("Usage: java -jar target/optional-lab.jar hello|--list|caseNN"); System.exit(2); return; }
        switch (args[0]) {
            case "hello" -> {
                System.out.println("The manifest selected app.Main; the executable project is ready.");
                System.out.println("RESULT hello=Optional lab is ready.");
            }
            case "--list" -> System.out.println("case01\ncase02\ncase03\ncase04\ncase05\ncase06\ncase07\ncase08\ncase09\ncase10");
            case "case01" -> edu.algebra.optional.case01creation.Main.main(new String[0]);
            case "case02" -> edu.algebra.optional.case02lookup.Main.main(new String[0]);
            case "case03" -> edu.algebra.optional.case03mapping.Main.main(new String[0]);
            case "case04" -> edu.algebra.optional.case04filtering.Main.main(new String[0]);
            case "case05" -> edu.algebra.optional.case05flatmapping.Main.main(new String[0]);
            case "case06" -> edu.algebra.optional.case06fallback.Main.main(new String[0]);
            case "case07" -> edu.algebra.optional.case07required.Main.main(new String[0]);
            case "case08" -> edu.algebra.optional.case08alternatives.Main.main(new String[0]);
            case "case09" -> edu.algebra.optional.case09streams.Main.main(new String[0]);
            case "case10" -> edu.algebra.optional.case10primitive.Main.main(new String[0]);
            default -> { System.err.println("Unknown case: " + args[0]); System.exit(2); }
        }
    }
}
