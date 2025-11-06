/**
 * Imprint Page
 * Legal imprint (German legal requirement - Impressumspflicht)
 */
export default function ImpressumPage() {
  return (
    <section className="font-sans leading-relaxed text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Impressum</h1>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Verantwortlich</h2>
      <p className="mb-6">
        <strong>TETRASAN GmbH</strong><br />
        vertreten durch: Daniela Papadopoulos-Marotta
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Kontakt</h2>
      <p className="mb-6">
        <strong>Tetrasan GmbH</strong><br />
        Seebenseestr. 10a<br />
        81377 München<br />
        <br />
        Fon: <a href="tel:+49892021333" className="text-blue-600 hover:underline">+49 89 / 2021333</a><br />
        Fax: +49 89 / 2021323
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Registereintrag</h2>
      <p className="mb-6">
        HRB München 10 74 46
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Umsatzsteuer-ID</h2>
      <p className="mb-6">
        UST. ID-Nr. DE 129478026
      </p>
    </section>
  );
}
