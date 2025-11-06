/**
 * Privacy Policy Page
 * GDPR-compliant privacy policy for Tetrasan WebApp
 */
export default function DatenschutzPage() {
  return (
    <section className="font-sans leading-relaxed text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Datenschutzerklärung Tetrasan WebApp</h1>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Verantwortlich für die Datenverarbeitung</h2>

      <p className="mb-6">
        <strong>Tetrasan GmbH</strong><br />
        z. Hd. Daniela Papadopoulos-Marotta<br />
        Sebenseestr. 10a<br />
        81377 München<br />
        <a href="mailto:info@musikakademie-muenchen.de" className="text-blue-600 hover:underline">
          info@musikakademie-muenchen.de
        </a>
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Allgemeine Hinweise</h2>
      <p className="mb-6">
        Diese Webanwendung dient der internen Mitarbeiterverwaltung der Tetrasan GmbH.
        Der Zugang ist ausschließlich für zuvor manuell angelegte Benutzer:innen vorgesehen.
        Eine öffentliche Registrierung ist nicht möglich.
        Die Anwendung wurde gemäß den Anforderungen der Datenschutz-Grundverordnung (DSGVO) entwickelt.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. Verantwortlicher und Hosting</h2>
      <p className="mb-6">
        Die WebApp wird bei <strong>Vercel Inc. (USA)</strong> gehostet, die Datenbankdienste werden von
        <strong>Supabase Inc. (Irland/USA)</strong> bereitgestellt.
        Mit beiden Anbietern bestehen Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO
        einschließlich Standardvertragsklauseln (SCCs) zur Absicherung von Datentransfers in Drittländer.
        Daten werden – soweit technisch möglich – auf Servern innerhalb der EU gespeichert.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Drittlandstransfer</h3>
      <p className="mb-6">
        Soweit eine Verarbeitung in den USA erfolgt, geschieht dies auf Grundlage des
        <strong>EU-US Data Privacy Frameworks (DPF)</strong> oder der
        <strong>Standardvertragsklauseln (SCC 2021/914)</strong> einschließlich zusätzlicher technischer
        und organisatorischer Maßnahmen.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. Zwecke der Datenverarbeitung</h2>
      <ul className="list-disc list-inside mb-6 space-y-2 ml-4">
        <li>Erfassung und Verwaltung von Arbeitszeiten, Pausen und Tätigkeitsberichten</li>
        <li>Verwaltung und Bearbeitung von Urlaubsanträgen, Krankmeldungen und Tagesbefreiungen</li>
        <li>Erstellung von Monatsübersichten und PDF-Dokumenten</li>
        <li>Interne Kommunikation über das App-Postfach (keine E-Mail-Kommunikation)</li>
        <li>Rollenbasiertes Zugriffssystem (Mitarbeiter:in / Administrator:in)</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Rechtsgrundlage</h2>
      <ul className="list-disc list-inside mb-6 space-y-2 ml-4">
        <li>Art. 6 Abs. 1 lit. b DSGVO – Vertragserfüllung / Beschäftigungsverhältnis</li>
        <li>Art. 6 Abs. 1 lit. c DSGVO – Rechtliche Verpflichtung (§ 147 AO, § 257 HGB)</li>
        <li>Art. 6 Abs. 1 lit. f DSGVO – Berechtigtes Interesse an sicherer interner Verwaltung</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">5. Art der verarbeiteten Daten</h2>

      <h3 className="text-xl font-semibold mt-6 mb-3">a) Benutzerkonten</h3>
      <ul className="list-disc list-inside mb-6 space-y-2 ml-4">
        <li>Personalnummer, Name, E-Mail oder Login-ID</li>
        <li>Telefonnummer (optional)</li>
        <li>Passwort (verschlüsselt)</li>
        <li>Rolle (Admin / Mitarbeiter:in)</li>
        <li>Session- und Login-Metadaten</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-3">b) Arbeitszeiterfassung</h3>
      <ul className="list-disc list-inside mb-6 space-y-2 ml-4">
        <li>Datum, Start- und Endzeit, Pausendauer, berechnete Stunden</li>
        <li>Tätigkeitsbericht / Kommentar</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-3">c) Urlaubsanträge / Tagesbefreiungen / Krankmeldungen</h3>
      <ul className="list-disc list-inside mb-6 space-y-2 ml-4">
        <li>Zeitraum, Grund oder Kommentar, Status (Eingereicht, Genehmigt, Abgelehnt)</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">6. Cookies / Protokolldaten</h2>
      <p className="mb-6">
        Es werden ausschließlich technisch notwendige Session-Cookies verwendet (z. B. für Supabase-Auth).
        Keine Tracking- oder Marketing-Cookies.
        Vercel speichert IP-Adressen in Server-Logs für max. 90 Tage zur Gewährleistung von Sicherheit und Betrieb.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">7. Speicherdauer</h2>
      <ul className="list-disc list-inside mb-6 space-y-2 ml-4">
        <li>Mitarbeiter- und Zeitdaten: Löschung oder Anonymisierung spätestens 12 Monate nach Austritt.</li>
        <li>Logdaten: Speicherung durch Vercel bis zu 90 Tage.</li>
        <li>Session-Cookies: automatisch gelöscht nach Abmeldung oder Sitzungsende.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">8. Datensparsamkeit</h2>
      <p className="mb-6">
        Es werden nur solche Daten erhoben, die für den Betrieb der App notwendig sind.
        Es werden keine sensiblen Daten im Sinne von Art. 9 DSGVO (z. B. Gesundheitsdaten) verarbeitet.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">9. Weitergabe an Dritte</h2>
      <p className="mb-6">
        Eine Weitergabe erfolgt ausschließlich an die beauftragten Dienstleister:
        <strong>Vercel Inc.</strong> (Hosting) und <strong>Supabase Inc.</strong> (Datenbank / Auth).
        Beide agieren als Auftragsverarbeiter gemäß Art. 28 DSGVO.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">10. Datensicherheit</h2>
      <ul className="list-disc list-inside mb-6 space-y-2 ml-4">
        <li>Passwortgeschützte Konten mit rollenbasierter Zugriffskontrolle (RBAC, RLS)</li>
        <li>Verschlüsselung bei Übertragung (TLS) und Speicherung (AES-256)</li>
        <li>Passwörter gehasht (bcrypt / Argon2)</li>
        <li>Protokollierung von Admin-Zugriffen</li>
        <li>PDF-Dokumente nur temporär oder clientseitig erzeugt</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">11. Rechte der Betroffenen</h2>
      <ul className="list-disc list-inside mb-6 space-y-2 ml-4">
        <li>Auskunft (Art. 15 DSGVO)</li>
        <li>Berichtigung (Art. 16 DSGVO)</li>
        <li>Löschung (Art. 17 DSGVO)</li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Widerspruch (Art. 21 DSGVO)</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
      </ul>
      <p className="mb-6">Anfragen sind an die oben genannte verantwortliche Stelle zu richten.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">12. Beschwerderecht</h2>
      <p className="mb-6">
        Betroffene Personen haben das Recht, sich bei einer Datenschutzaufsichtsbehörde
        über die Verarbeitung ihrer personenbezogenen Daten zu beschweren (Art. 77 DSGVO).
      </p>

      <p className="mt-8 italic text-gray-600">Stand: 06.11.2025 Version: 1.0</p>
    </section>
  );
}
