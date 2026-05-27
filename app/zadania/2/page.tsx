import {
  AssignmentShell,
  Toc,
  Section,
  Code,
  IO,
  Note,
  Sources,
} from "@/components/assignment";

export default function Zadanie2() {
  return (
    <AssignmentShell
      id={2}
      title="Statická analýza a kontrola kvality kódu"
      subtitle="Odhaľte defekty bez spustenia programu a odstráňte code smells."
    >
      <Toc
        items={[
          { id: "ciel", label: "Cieľ" },
          { id: "uloha", label: "Úloha" },
          { id: "jadro", label: "Jadro — ako na to" },
          { id: "vstup-vystup", label: "Vstup a výstup" },
          { id: "hodnotenie", label: "Hodnotenie" },
          { id: "zdroje", label: "Zdroje" },
        ]}
      />

      <Section id="ciel" icon="bi-bullseye" title="Cieľ">
        <p>
          Naučiť sa používať nástroje <strong>statickej analýzy</strong> na
          odhalenie defektov, ktoré nie sú viditeľné na prvý pohľad, a chápať
          metriky kvality ako cyklomatická zložitosť.
        </p>
      </Section>

      <Section id="uloha" icon="bi-list-check" title="Úloha">
        <ol>
          <li>
            Na svojom projekte spustite analyzátor (napr. SpotBugs, PMD alebo
            Checkstyle).
          </li>
          <li>
            Odstráňte všetky nálezy závažnosti <em>high</em> a aspoň polovicu
            nálezov <em>medium</em>.
          </li>
          <li>
            Doložte stav <strong>pred</strong> a <strong>po</strong> oprave
            (počet nálezov + ukážka opravy).
          </li>
        </ol>

        <p>Príklad konfigurácie pravidiel:</p>
        <Code filename="checkstyle.xml">{`<module name="Checker">
  <module name="TreeWalker">
    <module name="CyclomaticComplexity">
      <property name="max" value="10"/>
    </module>
    <module name="UnusedImports"/>
    <module name="EmptyBlock"/>
  </module>
</module>`}</Code>
      </Section>

      <Section id="jadro" icon="bi-gear" title="Jadro — ako na to">
        <p>
          <strong>Statická analýza</strong> skúma zdrojový kód bez jeho
          spustenia — hľadá vzory typické pre chyby (null dereferencie,
          neuzavreté zdroje, mŕtvy kód). Dopĺňa dynamické testovanie, nenahrádza
          ho.
        </p>
        <p>
          <strong>Code smell</strong> je príznak možného problému v návrhu.
          Príklad — príliš zložitá metóda s viacerými zodpovednosťami:
        </p>

        <Code filename="pred-opravou.java">{`// Cyklomatická zložitosť 12 — robí priveľa naraz
double price(Order o) {
    double p = 0;
    if (o.type == VIP) { if (o.items > 10) p = base * 0.7; else p = base * 0.8; }
    else if (o.type == REGULAR) { if (o.items > 10) p = base * 0.9; else p = base; }
    // ... ďalšie vetvenie ...
    return p;
}`}</Code>

        <Code filename="po-oprave.java">{`// Rozdelené, čitateľné, ľahko testovateľné
double price(Order o) {
    return base * discountFor(o);
}

double discountFor(Order o) {
    return DISCOUNTS.getOrDefault(o.tier(), 1.0);
}`}</Code>

        <Note title="Tip">
          Cyklomatická zložitosť ≈ počet nezávislých ciest kódom. Vyššia
          zložitosť = viac testovacích prípadov a väčšia šanca na chybu. Cieľte
          na ≤ 10 na metódu.
        </Note>
      </Section>

      <Section id="vstup-vystup" icon="bi-arrow-left-right" title="Vstup a výstup">
        <IO kind="in">{`mvn checkstyle:check spotbugs:check`}</IO>

        <IO kind="out">{`[WARN]  BankAccount.java:14  CyclomaticComplexity: 12 (max 10)
[WARN]  OrderService.java:33  DLS_DEAD_LOCAL_STORE: mŕtve priradenie
[INFO]  Nálezy: 2 high, 5 medium  ->  po oprave: 0 high, 2 medium`}</IO>
      </Section>

      <Section id="hodnotenie" icon="bi-trophy" title="Hodnotenie">
        <ul>
          <li>Korektne spustená analýza + konfigurácia pravidiel — 3 b.</li>
          <li>Odstránené všetky high a ≥ 50 % medium nálezov — 4 b.</li>
          <li>Doložené pred/po + krátky komentár k opravám — 3 b.</li>
        </ul>
      </Section>

      <Section id="zdroje" icon="bi-journal-bookmark" title="Zdroje">
        <Sources
          items={[
            { href: "https://spotbugs.github.io/", label: "SpotBugs" },
            { href: "https://pmd.github.io/", label: "PMD" },
            { href: "https://checkstyle.org/", label: "Checkstyle" },
            { href: "https://refactoring.guru/refactoring/smells", label: "Refactoring Guru — Code Smells" },
          ]}
        />
      </Section>
    </AssignmentShell>
  );
}
