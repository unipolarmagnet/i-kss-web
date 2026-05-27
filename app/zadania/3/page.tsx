import {
  AssignmentShell,
  Toc,
  Section,
  Code,
  IO,
  Note,
  Sources,
} from "@/components/assignment";

export default function Zadanie3() {
  return (
    <AssignmentShell
      id={3}
      title="Automatizované testovanie a CI kvalitatívne brány"
      subtitle="Postavte CI pipeline, ktorá pri každom commite spustí testy a stráži kvalitu."
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
          Pochopiť <strong>continuous integration</strong> a vedieť nastaviť{" "}
          <strong>kvalitatívnu bránu</strong> (quality gate), ktorá automaticky
          zablokuje zmenu, ak klesne kvalita (napr. pokrytie pod prah).
        </p>
      </Section>

      <Section id="uloha" icon="bi-list-check" title="Úloha">
        <ol>
          <li>
            Vytvorte GitHub Actions workflow, ktorý pri každom <code>push</code>{" "}
            a <code>pull_request</code> skompiluje projekt a spustí testy.
          </li>
          <li>
            Pridajte krok merania pokrytia a <strong>bránu</strong>: ak je
            vetvové pokrytie pod <strong>80 %</strong>, build zlyhá.
          </li>
          <li>Doložte jeden zelený a jeden zámerne zlyhaný beh.</li>
        </ol>

        <Code filename=".github/workflows/ci.yml">{`name: CI
on: [push, pull_request]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"
      - name: Build & test
        run: mvn -B verify
      - name: Coverage gate (>= 80% branches)
        run: mvn jacoco:check -Djacoco.haltOnFailure=true`}</Code>
      </Section>

      <Section id="jadro" icon="bi-gear" title="Jadro — ako na to">
        <p>
          <strong>CI</strong> znamená, že každá zmena sa automaticky integruje a
          overí — žiadne „u mňa to funguje". Pipeline typicky beží: <em>build →
          testy → analýza → brána</em>.
        </p>
        <ul>
          <li>
            <strong>Regresné testy</strong> chránia pred znovuzavedením už
            opravených chýb.
          </li>
          <li>
            <strong>Quality gate</strong> je automatická podmienka (pokrytie,
            počet nálezov), ktorá musí prejsť, inak sa zmena nezlúči.
          </li>
        </ul>

        <Note title="Prečo brána">
          Bez automatickej brány kvalita ticho klesá — každý sa „len rýchlo
          niečo dotkne". Brána robí kvalitu nepreskočiteľnou súčasťou procesu.
        </Note>
      </Section>

      <Section id="vstup-vystup" icon="bi-arrow-left-right" title="Vstup a výstup">
        <IO kind="in">{`git push origin feature/login`}</IO>

        <IO kind="out">{`CI · build-test
  ✓ Checkout
  ✓ Build & test        (Tests run: 24, Failures: 0)
  ✗ Coverage gate       branches 73% < 80%  ->  BUILD FAILED
Pull request blokovaný kvalitatívnou bránou.`}</IO>
      </Section>

      <Section id="hodnotenie" icon="bi-trophy" title="Hodnotenie">
        <ul>
          <li>Funkčný workflow (build + testy pri push/PR) — 4 b.</li>
          <li>Nastavená kvalitatívna brána na pokrytie — 4 b.</li>
          <li>Doložený zelený aj zlyhaný beh — 2 b.</li>
        </ul>
      </Section>

      <Section id="zdroje" icon="bi-journal-bookmark" title="Zdroje">
        <Sources
          items={[
            { href: "https://docs.github.com/en/actions", label: "GitHub Actions — dokumentácia" },
            { href: "https://www.jacoco.org/jacoco/trunk/doc/check-mojo.html", label: "JaCoCo — coverage check" },
            { href: "https://martinfowler.com/articles/continuousIntegration.html", label: "Martin Fowler — Continuous Integration" },
          ]}
        />
      </Section>
    </AssignmentShell>
  );
}
