import {
  AssignmentShell,
  Toc,
  Section,
  Code,
  IO,
  Note,
  Sources,
} from "@/components/assignment";

export default function Zadanie1() {
  return (
    <AssignmentShell
      id={1}
      title="Jednotkové testovanie a pokrytie kódu"
      subtitle="Napíšte jednotkové testy pre daný modul a doložte pokrytie kódu."
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
          Osvojiť si písanie <strong>jednotkových testov</strong> a meranie{" "}
          <strong>pokrytia kódu</strong>. Po dokončení budete vedieť navrhnúť
          testovacie prípady tak, aby odhalili chyby v hraničných aj chybových
          situáciách, a interpretovať report pokrytia.
        </p>
      </Section>

      <Section id="uloha" icon="bi-list-check" title="Úloha">
        <p>
          Je daný modul <code>BankAccount</code> (vklad, výber, zostatok). Vašou
          úlohou je:
        </p>
        <ol>
          <li>Napísať jednotkové testy v JUnit 5 vzorom Arrange–Act–Assert.</li>
          <li>
            Pokryť hraničné stavy (vklad/výber 0, presne na hranicu zostatku) aj
            chybové stavy (záporná suma, výber nad rámec zostatku).
          </li>
          <li>
            Dosiahnuť <strong>vetvové pokrytie ≥ 90 %</strong> a doložiť report
            z JaCoCo.
          </li>
        </ol>

        <Code filename="BankAccount.java">{`public class BankAccount {
    private long balance;

    public void deposit(long amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount must be > 0");
        balance += amount;
    }

    public void withdraw(long amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount must be > 0");
        if (amount > balance) throw new IllegalStateException("insufficient funds");
        balance -= amount;
    }

    public long getBalance() { return balance; }
}`}</Code>
      </Section>

      <Section id="jadro" icon="bi-gear" title="Jadro — ako na to">
        <p>
          <strong>Jednotkový test</strong> overuje najmenšiu testovateľnú časť
          (jednu metódu) izolovane. Osvedčený vzor je{" "}
          <strong>Arrange–Act–Assert</strong>: priprav stav → vykonaj akciu →
          over výsledok.
        </p>

        <Code filename="BankAccountTest.java">{`import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class BankAccountTest {

    @Test
    void deposit_increasesBalance() {
        BankAccount acc = new BankAccount();   // Arrange
        acc.deposit(100);                      // Act
        assertEquals(100, acc.getBalance());   // Assert
    }

    @Test
    void withdraw_overBalance_throws() {
        BankAccount acc = new BankAccount();
        acc.deposit(50);
        assertThrows(IllegalStateException.class, () -> acc.withdraw(80));
    }
}`}</Code>

        <p>
          <strong>Pokrytie kódu</strong> hovorí, koľko kódu testy reálne
          vykonali. Rozlišujeme najmä:
        </p>
        <ul>
          <li>
            <strong>riadkové</strong> — koľko riadkov sa vykonalo,
          </li>
          <li>
            <strong>vetvové</strong> — koľko vetiev podmienok (if/else) sa
            vyskúšalo. Toto je pre kvalitu dôležitejšie.
          </li>
        </ul>

        <Note title="Pozor">
          100 % pokrytie nie je cieľom — vysoké pokrytie so slabými asserciami
          klame. Lepšie je premyslene pokryť hranice a chyby než naháňať
          posledné percentá.
        </Note>
      </Section>

      <Section id="vstup-vystup" icon="bi-arrow-left-right" title="Vstup a výstup">
        <p>
          Vstupom je zdrojový modul, výstupom zelené testy a report pokrytia.
          Testy spustíte cez Maven/Gradle:
        </p>

        <IO kind="in">{`mvn test jacoco:report`}</IO>

        <IO kind="out">{`[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
[INFO] JaCoCo coverage:
       BankAccount.java   lines 100%   branches 92%`}</IO>
      </Section>

      <Section id="hodnotenie" icon="bi-trophy" title="Hodnotenie">
        <ul>
          <li>Funkčné a zmysluplné testy (Arrange–Act–Assert) — 5 b.</li>
          <li>Pokrytie hraničných a chybových stavov — 3 b.</li>
          <li>Vetvové pokrytie ≥ 90 % doložené reportom — 2 b.</li>
        </ul>
      </Section>

      <Section id="zdroje" icon="bi-journal-bookmark" title="Zdroje">
        <Sources
          items={[
            { href: "https://junit.org/junit5/docs/current/user-guide/", label: "JUnit 5 — User Guide" },
            { href: "https://www.jacoco.org/jacoco/trunk/doc/", label: "JaCoCo — dokumentácia" },
            { href: "https://martinfowler.com/bliki/UnitTest.html", label: "Martin Fowler — UnitTest" },
          ]}
        />
      </Section>
    </AssignmentShell>
  );
}
