export type Link = {
  name: string;
  url: string;
};

export type TreatmentOption = {
  description: string;
  contraIndications: string[] | null;
  documentation: string;
  info?: string;
  additionalTest?: string;
  testAfterTreatment?: string;
};

export type Treatment = {
  treatment: TreatmentOption[];
  generalInfo?: string;
  explainer?: string;
  sources: Link[] | null;
};

export const uti: {
  [scope: string]: {
    [subgroup: string]: Treatment;
  };
} = {
  local: {
    healthy: {
      treatment: [
        {
          description: 'Afwachtend beleid (eventueel met pijnstilling)',
          contraIndications: null,
          testAfterTreatment:
            'Indien na 1 week geen verbetering urineonderzoek herhalen en bij positieve test behandelen met antiobiotica',
          documentation:
            'Afwachtend beleid (eventueel met pijnstilling) afgesproken. Indien na 1 week geen verbetering urineonderzoek herhalen en bij positieve test behandelen met antiobiotica. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
        {
          description:
            'Nitrofurantoïne, 5 dagen, 2 dd 100 mg mga of 4 dd 50 mg',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          documentation:
            'Nitrofurantoïne, 5 dagen, 2 dd 100 mg mga of 4 dd 50 mg. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
        {
          description: 'Fosfomycine, eenmalig, 3 g, bij voorkeur voor de nacht',
          contraIndications: [
            'Geef vrouwen die borstvoeding geven bij voorkeur geen fosfomycine',
          ],
          documentation:
            'Fosfomycine, eenmalig, 3 g, bij voorkeur voor de nacht. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
        {
          description: 'Trimethoprim, 3 dagen, 1 dd 300 mg voor de nacht',
          contraIndications: [
            'ernstige leverfunctiestoornissen',
            'ernstige afwijkingen in het bloedbeeld',
            'acute porfyrie',
            'methotrexaatgebruik',
          ],
          documentation:
            'Trimethoprim, 3 dagen, 1 dd 300 mg voor de nacht. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
          info: 'Bij een eGFR 10-30 ml/min: eerste 3 dagen normale dosering. Daarna 50% van de normale dosering. Bij combinatie met spirinolacton kan hyperkaliëmie optreden, de kaliumconcentratie moet worden gecontroleerd na 2-4 dagen gebruik',
        },
      ],
      explainer:
        'Leg uit dat een cystitis veel voorkomt, niet besmettelijk is, maar kan terugkomen. Het betreft een hinderlijke, in principe onschuldige aandoening, die spontaan binnen 1 week kan genezen (bij 55% van gezonde vrouwen). Met antibiotische behandeling zijn de klachten doorgaans eerder verdwenen. Klachten kunnen tot enkele dagen na afloop van de behandeling blijven bestaan. Antibioticagebruik kan echter leiden tot bijwerkingen en antibioticaresistentie.',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
        {
          name: 'Thuisarts',
          url: 'https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
      ],
    },
    vulnerable: {
      treatment: [
        {
          description:
            'Nitrofurantoïne, 7 dagen, 2 dd 100 mg mga of 4 dd 50 mg',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          documentation:
            'Nitrofurantoïne, 7 dagen, 2 dd 100 mg mga of 4 dd 50 mg. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking',
        },
        {
          description: 'Fosfomycine, eenmalig, 3 g, bij voorkeur voor de nacht',
          contraIndications: [
            'Geef vrouwen die borstvoeding geven bij voorkeur geen fosfomycine',
          ],
          documentation:
            'Fosfomycine, eenmalig, 3 g, bij voorkeur voor de nacht. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking',
        },
        {
          description: 'Trimethoprim, 7 dagen, 1 dd 300 mg voor de nacht',
          contraIndications: [
            'ernstige leverfunctiestoornissen',
            'ernstige afwijkingen in het bloedbeeld',
            'acute porfyrie',
            'methotrexaatgebruik',
          ],
          documentation:
            'Trimethoprim, 7 dagen, 1 dd 300 mg voor de nacht. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking',
          info: 'Bij een eGFR 10-30 ml/min: eerste 3 dagen normale dosering. Daarna 50% van de normale dosering. Bij combinatie met spirinolacton kan hyperkaliëmie optreden, de kaliumconcentratie moet worden gecontroleerd na 2-4 dagen gebruik',
        },
      ],
      explainer:
        'Leg uit dat een urineweginfectie ernstig kan verlopen en een antibioticum noodzakelijk is. Adviseer ruime vochtinname. Laat de patiënt bij verergering van de klachten (koorts, algemeen ziek-zijn) direct contact opnemen met de (dienstdoende) huisarts',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
        {
          name: 'Thuisarts',
          url: 'https://www.thuisarts.nl/blaasontsteking',
        },
      ],
    },
    pregnant: {
      treatment: [
        {
          description:
            'Nitrofurantoïne, 7 dagen, 2 dd 100 mg mga of 4 dd 50 mg',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          additionalTest: 'Urinekweek',
          documentation:
            'Nitrofurantoïne, 7 dagen, 2 dd 100 mg mga of 4 dd 50 mg. Urine op kweek (ook om groep-B-streptokokken (GBS) uit te sluiten), graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-ben-zwanger-en-heb-blaasontsteking',
        },
        {
          description: 'Amoxicilline/clavulaanzuur, 5 dagen, 3 dd 500/125 mg',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          info: 'Bij een eGFR < 30 ml/min: pas de dosering aan naar amoxicilline/clavulaanzuur 875/125 mg 2 dd',
          additionalTest: 'Urinekweek',
          documentation:
            'Amoxicilline/clavulaanzuur, 5 dagen, 3 dd 500/125 mg. Urine op kweek (ook om groep-B-streptokokken (GBS) uit te sluiten), graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-ben-zwanger-en-heb-blaasontsteking',
        },
      ],
      explainer:
        'Leg uit dat een urineweginfectie ernstig kan verlopen en een antibioticum noodzakelijk is. Adviseer ruime vochtinname. Laat de patiënt bij verergering van de klachten (koorts, algemeen ziek-zijn) direct contact opnemen met de (dienstdoende) huisarts. Vraag zwangeren contact op te nemen over de uitslag van de kweek vanwege de mogelijke consequenties van de uitslag voor de bevalling.',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
        {
          name: 'Thuisarts',
          url: 'https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
      ],
    },
    cadWoman: {
      treatment: [
        {
          description: 'Behandeling is niet nodig.',
          contraIndications: [''],
          documentation:
            'Behandeling is niet nodig in afwezigheid van tekenen van weefselinvasie (koorts, algehele malaise, (koude) rillingen, flank- of perineumpijn, een delier)',
        },
      ],
      explainer:
        'Behandeling van asymptomatische bacteriurie wordt in alle patiëntgroepen, met uitzondering van zwangeren, afgeraden',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
      ],
    },
    men: {
      treatment: [
        {
          description:
            'Nitrofurantoïne, 7 dagen, 2 dd 100 mg mga of 4 dd 50 mg (off-label)',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          documentation:
            'Nitrofurantoïne, 7 dagen, 2 dd 100 mg mga of 4 dd 50 mg. Contact bij klachten zoals beschreven op https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-man',
        },
        {
          description:
            'Trimethoprim, 7 dagen, 1 dd 300 mg voor de nacht (off-label)',
          contraIndications: [
            'ernstige leverfunctiestoornissen',
            'ernstige afwijkingen in het bloedbeeld',
            'acute porfyrie',
            'methotrexaatgebruik',
          ],
          documentation:
            'Trimethoprim, 7 dagen, 1 dd 300 mg voor de nacht. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-man',
          info: 'Bij een eGFR 10-30 ml/min: eerste 3 dagen normale dosering. Daarna 50% van de normale dosering. Bij combinatie met spirinolacton kan hyperkaliëmie optreden, de kaliumconcentratie moet worden gecontroleerd na 2-4 dagen gebruik',
        },
      ],
      explainer:
        'Mannen lopen een groter risico op complicaties. Leg uit dat een urineweginfectie ernstig kan verlopen en een antibioticum noodzakelijk is. Adviseer ruime vochtinname. Laat de patiënt bij verergering van de klachten (koorts, algemeen ziek-zijn) direct contact opnemen met de (dienstdoende) huisarts.',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
        {
          name: 'Thuisarts',
          url: 'https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-man',
        },
      ],
    },
    cadMen: {
      treatment: [
        {
          description: 'Behandeling is niet nodig.',
          contraIndications: [''],
          documentation:
            'Behandeling is niet nodig in afwezigheid van tekenen van weefselinvasie (koorts, algehele malaise, (koude) rillingen, flank- of perineumpijn, een delier)',
        },
      ],
      explainer:
        'Behandeling van asymptomatische bacteriurie wordt in alle patiëntgroepen, met uitzondering van zwangeren, afgeraden',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
      ],
    },
    children: {
      treatment: [
        {
          description:
            'Nitrofurantoïne, 5 dagen, 5 tot 6 mg/kg lichaamsgewicht in 4 giften, maximaal 200 mg/dag',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          additionalTest: 'Urinekweek indien < 12 jaar',
          documentation:
            'Nitrofurantoïne, 5 dagen, 5 tot 6 mg/kg lichaamsgewicht in 4 giften, maximaal 200 mg/dag. Indien urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/mijn-kind-heeft-blaasontsteking. Indien binnen 48 uur geen verbetering overweeg verwijzing naar kinderarts.',
        },
        {
          description:
            'Amoxicilline/clavulaanzuur, 3 dagen, 50/12,5 mg/kg lichaamsgewicht in 3 giften, maximaal 1500/375 mg/dag in 3 doses',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          additionalTest: 'Urinekweek indien < 12 jaar',
          documentation:
            'Amoxicilline/clavulaanzuur, 3 dagen, 50/12,5 mg/kg lichaamsgewicht in 3 giften, maximaal 1500/375 mg/dag in 3 doses. Indien urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/mijn-kind-heeft-blaasontsteking. Indien binnen 48 uur geen verbetering overweeg verwijzing naar kinderarts.',
        },
      ],
      explainer:
        'Leg uit dat een urineweginfectie ernstig kan verlopen en een antibioticum noodzakelijk is. Adviseer ruime vochtinname. Laat de patiënt bij verergering van de klachten (koorts, algemeen ziek-zijn) direct contact opnemen met de (dienstdoende) huisarts. Geef ouders van kinderen met een urineweginfectie die zindelijk zijn of > 5 jaar uitleg over de werking van de bekkenbodem en vertel dat ontspanning nodig is voor volledige lediging van blaas en darmen.',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
        {
          name: 'Thuisarts',
          url: 'https://www.thuisarts.nl/blaasontsteking/mijn-kind-heeft-blaasontsteking',
        },
      ],
    },
  },
  tissueInvasion: {
    healthy: {
      treatment: [
        {
          description: 'Ciprofloxacine, 7 dagen, 2 dd 500 mg',
          contraIndications: [
            'het geven van borstvoeding',
            'gecombineerde lever- en nierfunctiestoornissen',
            'neuropathie',
            'peesaandoeningen gerelateerd aan het eerdere gebruik van fluorochinolonen (de groep van antibiotica waartoe ciprofloxacine behoort)',
          ],
          info: 'Overweeg een alternatief bij patiënten met een verhoogd risico op een aorta-aneurysma of -dissectie. Bij een eGFR 10-30 ml/min: geef de normale keerdosis met een interval van 24 uur tussen 2 doses. Neem niet gelijktijdig in met metaalverbindingen, zoals calcium, magnesium- en ijzerpreparaten.',
          additionalTest: 'Urinekweek',
          documentation:
            'Ciprofloxacine, 7 dagen, 2 dd 500 mg. Urine op kweek, graag contact over uitslag. Als uit de kweek blijkt dat de verwekker gevoelig is voor een ander antibioticum (en de kuur nog niet voltooid is), maak dan de kuur af met een ander antibioticum (op volgorde amoxicilline, amoxicilline/clavulaanzuur of cotrimoxazol). Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
        {
          description: 'Amoxicilline/clavulaanzuur, 10 dagen, 3 dd 500/125 mg',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          info: 'Bij een eGFR < 30 ml/min: pas de dosering aan naar amoxicilline/clavulaanzuur 875/125 mg 2 dd',
          additionalTest: 'Urinekweek',
          documentation:
            'Amoxicilline/clavulaanzuur, 10 dagen, 3 dd 500/125 mg. Urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
        {
          description: 'Cotrimoxazol, 10 dagen, 2 dd 960 mg (off-label)',
          contraIndications: [
            'gebruik van cumarine of methotrexaat',
            'ernstige lever- en nierfunctiestoornissen',
            'ernstige afwijkingen in het bloedbeeld',
            'acute porfyrie',
          ],
          info: 'Bij een eGFR 10-30 ml/min: geef 50% van de normale keerdosis OF verdubbel het doseerinterval',
          additionalTest: 'Urinekweek',
          documentation:
            'Cotrimoxazol, 10 dagen, 2 dd 960 mg. Urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
      ],
      explainer:
        'Leg uit dat een urineweginfectie ernstig kan verlopen en een antibioticum noodzakelijk is. Adviseer ruime vochtinname. Instrueer de patiënt contact op te nemen indien < 48 uur geen verbetering optreedt, of eerder bij verergering van het ziektebeeld of zich ontwikkelende verwardheid.',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
        {
          name: 'Thuisarts',
          url: 'https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
      ],
    },
    vulnerable: {
      treatment: [
        {
          description: 'Ciprofloxacine, 7 dagen, 2 dd 500 mg',
          contraIndications: [
            'het geven van borstvoeding',
            'gecombineerde lever- en nierfunctiestoornissen',
            'neuropathie',
            'peesaandoeningen gerelateerd aan het eerdere gebruik van fluorochinolonen (de groep van antibiotica waartoe ciprofloxacine behoort)',
          ],
          info: 'Overweeg een alternatief bij patiënten met een verhoogd risico op een aorta-aneurysma of -dissectie. Bij een eGFR 10-30 ml/min: geef de normale keerdosis met een interval van 24 uur tussen 2 doses. Neem niet gelijktijdig in met metaalverbindingen, zoals calcium, magnesium- en ijzerpreparaten.',
          additionalTest: 'Urinekweek',
          documentation:
            'Ciprofloxacine, 7 dagen, 2 dd 500 mg. Urine op kweek, graag contact over uitslag. Als uit de kweek blijkt dat de verwekker gevoelig is voor een ander antibioticum (en de kuur nog niet voltooid is), maak dan de kuur af met een ander antibioticum (op volgorde amoxicilline, amoxicilline/clavulaanzuur of cotrimoxazol). Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking',
        },
        {
          description: 'Amoxicilline/clavulaanzuur, 10 dagen, 3 dd 500/125 mg',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          info: 'Bij een eGFR < 30 ml/min: pas de dosering aan naar amoxicilline/clavulaanzuur 875/125 mg 2 dd',
          additionalTest: 'Urinekweek',
          documentation:
            'Amoxicilline/clavulaanzuur, 10 dagen, 3 dd 500/125 mg. Urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking',
        },
        {
          description: 'Cotrimoxazol, 10 dagen, 2 dd 960 mg (off-label)',
          contraIndications: [
            'gebruik van cumarine of methotrexaat',
            'ernstige lever- en nierfunctiestoornissen',
            'ernstige afwijkingen in het bloedbeeld',
            'acute porfyrie',
          ],
          info: 'Bij een eGFR 10-30 ml/min: geef 50% van de normale keerdosis OF verdubbel het doseerinterval',
          additionalTest: 'Urinekweek',
          documentation:
            'Cotrimoxazol, 10 dagen, 2 dd 960 mg. Urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking',
        },
      ],
      explainer:
        'Leg uit dat een urineweginfectie ernstig kan verlopen en een antibioticum noodzakelijk is. Adviseer ruime vochtinname. Instrueer de patiënt contact op te nemen indien < 48 uur geen verbetering optreedt, of eerder bij verergering van het ziektebeeld of zich ontwikkelende verwardheid. Overweeg indien uit de kweek blijkt dat de verwekker gevoelig is voor amoxicilline, amoxicilline/clavulaanzuur of cotrimoxazol het eerder gestarte ciprofloxacine te stoppen. LET OP: bij mannen geniet dan cotrimoxazol de voorkeur, bij vrouwen liever amoxiciline.',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
        {
          name: 'Thuisarts',
          url: 'https://www.thuisarts.nl/blaasontsteking',
        },
      ],
    },
    pregnant: {
      treatment: [
        {
          description: 'Verwijs naar gynaecoloog',
          contraIndications: [''],
          documentation: 'Verwezen naar gynaecoloog',
        },
      ],
      explainer:
        'Een pyelonefritis in de zwangerschap gaat gepaard met een verhoogd risico op ernstige morbiditeit of mortaliteit. Het advies om zwangeren met een pyelonefritis voor behandeling te verwijzen naar de 2e lijn sluit aan bij de aanbeveling uit de richtlijn Urineweginfecties in de Zwangerschap van de NVOG.',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
        {
          name: 'Thuisarts',
          url: 'https://www.thuisarts.nl/blaasontsteking/ik-ben-zwanger-en-heb-blaasontsteking',
        },
      ],
    },
    cadWoman: {
      treatment: [
        {
          description: 'Ciprofloxacine, 7 dagen, 2 dd 500 mg',
          contraIndications: [
            'het geven van borstvoeding',
            'gecombineerde lever- en nierfunctiestoornissen',
            'neuropathie',
            'peesaandoeningen gerelateerd aan het eerdere gebruik van fluorochinolonen (de groep van antibiotica waartoe ciprofloxacine behoort)',
          ],
          info: 'Overweeg een alternatief bij patiënten met een verhoogd risico op een aorta-aneurysma of -dissectie. Bij een eGFR 10-30 ml/min: geef de normale keerdosis met een interval van 24 uur tussen 2 doses. Neem niet gelijktijdig in met metaalverbindingen, zoals calcium, magnesium- en ijzerpreparaten.',
          additionalTest: 'Urinekweek',
          documentation:
            'Ciprofloxacine, 7 dagen, 2 dd 500 mg. Urine op kweek, graag contact over uitslag. Als uit de kweek blijkt dat de verwekker gevoelig is voor een ander antibioticum (en de kuur nog niet voltooid is), maak dan de kuur af met een ander antibioticum (op volgorde amoxicilline, amoxicilline/clavulaanzuur of cotrimoxazol). Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
        {
          description: 'Amoxicilline/clavulaanzuur, 10 dagen, 3 dd 500/125 mg',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          info: 'Bij een eGFR < 30 ml/min: pas de dosering aan naar amoxicilline/clavulaanzuur 875/125 mg 2 dd',
          additionalTest: 'Urinekweek',
          documentation:
            'Amoxicilline/clavulaanzuur, 10 dagen, 3 dd 500/125 mg. Urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
        {
          description: 'Cotrimoxazol, 10 dagen, 2 dd 960 mg (off-label)',
          contraIndications: [
            'gebruik van cumarine of methotrexaat',
            'ernstige lever- en nierfunctiestoornissen',
            'ernstige afwijkingen in het bloedbeeld',
            'acute porfyrie',
          ],
          info: 'Bij een eGFR 10-30 ml/min: geef 50% van de normale keerdosis OF verdubbel het doseerinterval',
          additionalTest: 'Urinekweek',
          documentation:
            'Cotrimoxazol, 10 dagen, 2 dd 960 mg. Urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
      ],
      explainer:
        'Leg uit dat een urineweginfectie ernstig kan verlopen en een antibioticum noodzakelijk is. Adviseer ruime vochtinname. Instrueer de patiënt contact op te nemen indien < 48 uur geen verbetering optreedt, of eerder bij verergering van het ziektebeeld of zich ontwikkelende verwardheid.',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
        {
          name: 'Thuisarts',
          url: 'https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
      ],
    },
    men: {
      treatment: [
        {
          description: 'Ciprofloxacine, 14 dagen, 2 dd 500 mg',
          contraIndications: [
            'gecombineerde lever- en nierfunctiestoornissen',
            'neuropathie',
            'peesaandoeningen gerelateerd aan het eerdere gebruik van fluorochinolonen (de groep van antibiotica waartoe ciprofloxacine behoort)',
          ],
          info: 'Overweeg een alternatief bij patiënten met een verhoogd risico op een aorta-aneurysma of -dissectie. Bij een eGFR 10-30 ml/min: geef de normale keerdosis met een interval van 24 uur tussen 2 doses. Neem niet gelijktijdig in met metaalverbindingen, zoals calcium, magnesium- en ijzerpreparaten.',
          additionalTest: 'Urinekweek',
          documentation:
            'Ciprofloxacine, 14 dagen, 2 dd 500 mg. Urine op kweek, graag contact over uitslag. Als uit de kweek blijkt dat de verwekker gevoelig is voor een ander antibioticum (en de kuur nog niet voltooid is), maak dan de kuur af met een ander antibioticum (voorkeur cotrimoxazol). Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-man',
        },
        {
          description: 'Amoxicilline/clavulaanzuur, 14 dagen, 3 dd 500/125 mg',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          info: 'Bij een eGFR < 30 ml/min: pas de dosering aan naar amoxicilline/clavulaanzuur 875/125 mg 2 dd',
          additionalTest: 'Urinekweek',
          documentation:
            'Amoxicilline/clavulaanzuur, 14 dagen, 3 dd 500/125 mg. Urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-man',
        },
        {
          description: 'Cotrimoxazol, 14 dagen, 2 dd 960 mg (off-label)',
          contraIndications: [
            'gebruik van cumarine of methotrexaat',
            'ernstige lever- en nierfunctiestoornissen',
            'ernstige afwijkingen in het bloedbeeld',
            'acute porfyrie',
          ],
          info: 'Bij een eGFR 10-30 ml/min: geef 50% van de normale keerdosis OF verdubbel het doseerinterval',
          additionalTest: 'Urinekweek',
          documentation:
            'Cotrimoxazol, 14 dagen, 2 dd 960 mg. Urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-man',
        },
      ],
      explainer:
        'Leg uit dat een urineweginfectie ernstig kan verlopen en een antibioticum noodzakelijk is. Adviseer ruime vochtinname. Instrueer de patiënt contact op te nemen indien < 48 uur geen verbetering optreedt, of eerder bij verergering van het ziektebeeld of zich ontwikkelende verwardheid. Als uit de kweek blijkt dat de verwekker gevoelig is voor cotrimoxazol, te starten met cotrimoxazol 2 dd 960 mg voor de resterende dagen van de originele kuur. Cotrimoxazol is gecontra-indiceerd bij gebruik van cumarine of methotrexaat en bij ernstige lever- en nierfunctiestoornissen, ernstige afwijkingen in het bloedbeeld of acute porfyrie.',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
        {
          name: 'Thuisarts',
          url: 'https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-man',
        },
      ],
    },
    cadMen: {
      treatment: [
        {
          description: 'Ciprofloxacine, 14 dagen, 2 dd 500 mg',
          contraIndications: [
            'het geven van borstvoeding',
            'gecombineerde lever- en nierfunctiestoornissen',
            'neuropathie',
            'peesaandoeningen gerelateerd aan het eerdere gebruik van fluorochinolonen (de groep van antibiotica waartoe ciprofloxacine behoort)',
          ],
          info: 'Overweeg een alternatief bij patiënten met een verhoogd risico op een aorta-aneurysma of -dissectie. Bij een eGFR 10-30 ml/min: geef de normale keerdosis met een interval van 24 uur tussen 2 doses. Neem niet gelijktijdig in met metaalverbindingen, zoals calcium, magnesium- en ijzerpreparaten.',
          additionalTest: 'Urinekweek',
          documentation:
            'Ciprofloxacine, 14 dagen, 2 dd 500 mg. Urine op kweek, graag contact over uitslag. Als uit de kweek blijkt dat de verwekker gevoelig is voor een ander antibioticum (en de kuur nog niet voltooid is), maak dan de kuur af met een ander antibioticum (voorkeur cotrimoxazol). Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-man',
        },
        {
          description: 'Amoxicilline/clavulaanzuur, 14 dagen, 3 dd 500/125 mg',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          info: 'Bij een eGFR < 30 ml/min: pas de dosering aan naar amoxicilline/clavulaanzuur 875/125 mg 2 dd',
          additionalTest: 'Urinekweek',
          documentation:
            'Amoxicilline/clavulaanzuur, 14 dagen, 3 dd 500/125 mg. Urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-man',
        },
        {
          description: 'Cotrimoxazol, 14 dagen, 2 dd 960 mg (off-label)',
          contraIndications: [
            'gebruik van cumarine of methotrexaat',
            'ernstige lever- en nierfunctiestoornissen',
            'ernstige afwijkingen in het bloedbeeld',
            'acute porfyrie',
          ],
          info: 'Bij een eGFR 10-30 ml/min: geef 50% van de normale keerdosis OF verdubbel het doseerinterval',
          additionalTest: 'Urinekweek',
          documentation:
            'Cotrimoxazol, 14 dagen, 2 dd 960 mg. Urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-man',
        },
      ],
      explainer:
        'Leg uit dat een urineweginfectie ernstig kan verlopen en een antibioticum noodzakelijk is. Adviseer ruime vochtinname. Instrueer de patiënt contact op te nemen indien < 48 uur geen verbetering optreedt, of eerder bij verergering van het ziektebeeld of zich ontwikkelende verwardheid. Als uit de kweek blijkt dat de verwekker gevoelig is voor cotrimoxazol, te starten met cotrimoxazol 2 dd 960 mg voor de resterende dagen van de originele kuur. Cotrimoxazol is gecontra-indiceerd bij gebruik van cumarine of methotrexaat en bij ernstige lever- en nierfunctiestoornissen, ernstige afwijkingen in het bloedbeeld of acute porfyrie.',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
        {
          name: 'Thuisarts',
          url: 'https://www.thuisarts.nl/blaasontsteking/ik-heb-blaasontsteking-vrouw',
        },
      ],
    },
    children: {
      treatment: [
        {
          description:
            'Amoxicilline/clavulaanzuur, 10 dagen, < 40 kg: 50/12,5 mg/kg lichaamsgewicht in 3 giften; > 40 kg: 1500/375 mg/dag in 3 doses',
          contraIndications: ['eGFR < 30 ml/min', 'G6PD-deficiëntie'],
          additionalTest: 'Urinekweek',
          documentation:
            'Amoxicilline/clavulaanzuur, 10 dagen, < 40 kg: 50/12,5 mg/kg lichaamsgewicht in 3 giften; > 40 kg: 1500/375 mg/dag in 3 doses. Urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/mijn-kind-heeft-blaasontsteking. Indien binnen 48 uur geen verbetering overweeg verwijzing naar kinderarts.',
        },
        {
          description:
            'Cotrimoxazol, 10 dagen, 30/6 mg/kg/dag in 2 giften, max 1600/320 mg/dag (off-label)',
          contraIndications: [
            'gebruik van cumarine of methotrexaat',
            'ernstige lever- en nierfunctiestoornissen',
            'ernstige afwijkingen in het bloedbeeld',
            'acute porfyrie',
          ],
          info: 'Bij een eGFR 10-30 ml/min: geef 50% van de normale keerdosis OF verdubbel het doseerinterval',
          additionalTest: 'Urinekweek',
          documentation:
            'Cotrimoxazol, 10 dagen, 30/6 mg/kg/dag in 2 giften, max 1600/320 mg/dag. Urine op kweek, graag contact over uitslag. Contact bij klachten zoals beschreven in https://www.thuisarts.nl/blaasontsteking/mijn-kind-heeft-blaasontsteking. Indien binnen 48 uur geen verbetering overweeg verwijzing naar kinderarts.',
        },
      ],
      explainer:
        'Leg uit dat een urineweginfectie ernstig kan verlopen en een antibioticum noodzakelijk is. Adviseer ruime vochtinname. Instrueer de patiënt contact op te nemen indien < 48 uur geen verbetering optreedt, of eerder bij verergering van het ziektebeeld of zich ontwikkelende verwardheid. Leg uit aan ouders met een kind van > 1 maand en < 2 jaar dat het maken van een echo van de urinewegen nodig is om uit te sluiten dat er sprake is van een onderliggende oorzaak van de infectie. Geef ouders van kinderen die zindelijk zijn of > 5 jaar uitleg over de werking van de bekkenbodem en vertel dat ontspanning nodig is voor volledige lediging van blaas en darmen.',
      sources: [
        {
          name: 'NHG-Standaard Urineweginfecties',
          url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
        },
        {
          name: 'Thuisarts',
          url: 'https://www.thuisarts.nl/blaasontsteking/mijn-kind-heeft-blaasontsteking',
        },
      ],
    },
  },
};

export const leukocytes: {
  [group: string]: {
    treatment: {
      description: string;
      contraIndications: string[] | null;
      documentation: string;
      info?: string;
      additionalTest?: string;
      testAfterTreatment?: string;
    }[];
    generalInfo?: string;
    explainer: string;
    sources: {
      name: string;
      url: string;
    }[];
  };
} = {
  dipslide: {
    treatment: [
      {
        description: 'Verdere diagnostiek noodzakelijk.',
        contraIndications: null,
        documentation:
          'Vooralsnog geen urineweginfectie aan kunnen tonen, omdat er wel witte bloedcellen werden gevonden wordt aanvullend nog een dipslide gedaan. Mocht hierbij een bacterie gevonden worden dan kan behandeling nodig zijn.',
      },
    ],
    explainer:
      'Omdat een deel van urineweginfecties gemist wordt met alleen de nitriet test (iets meer dan 20%) wordt bij een positieve leukocytentest aanvullende diagnostiek geadviseerd.',
    sources: [
      {
        name: 'NHG-Standaard Urineweginfecties',
        url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
      },
    ],
  },
  urineSediment: {
    treatment: [
      {
        description: 'Verdere diagnostiek noodzakelijk.',
        contraIndications: null,
        documentation:
          'Vooralsnog geen urineweginfectie aan kunnen tonen, omdat er wel witte bloedcellen werden gevonden wordt aanvullend nog een urine sediment gedaan. Mocht hierbij een bacterie gevonden worden dan kan behandeling nodig zijn.',
      },
    ],
    explainer:
      'Omdat een deel van urineweginfecties gemist wordt met alleen de nitriet test (iets meer dan 20%) wordt bij een positieve leukocytentest aanvullende diagnostiek geadviseerd.',
    sources: [
      {
        name: 'NHG-Standaard Urineweginfecties',
        url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
      },
    ],
  },
  urineCulture: {
    treatment: [
      {
        description: 'Verdere diagnostiek noodzakelijk.',
        contraIndications: null,
        documentation:
          'Vooralsnog geen urineweginfectie aan kunnen tonen, omdat er wel witte bloedcellen werden gevonden wordt aanvullend nog een urine kweek gedaan. Mocht hierbij een bacterie gevonden worden dan kan behandeling nodig zijn.',
      },
    ],
    explainer:
      'Omdat een deel van urineweginfecties gemist wordt met alleen de nitriet test (iets meer dan 20%) wordt bij een positieve leukocytentest aanvullende diagnostiek geadviseerd.',
    sources: [
      {
        name: 'NHG-Standaard Urineweginfecties',
        url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
      },
    ],
  },
};

export const blood: {
  [group: string]: Treatment;
} = {
  visibleHematuria: {
    treatment: [
      {
        description: 'Verdere diagnostiek noodzakelijk.',
        contraIndications: null,
        documentation: 'Afspraak op spreekuur ingepland.',
      },
    ],
    explainer:
      'Plan een afspraak op het spreekuur in. Macroscopische hematurie die niet wordt verklaard door menstruatie, myoglobinurie na extreme inspanning, een urineweginfectie of nierstenen is een alarmsymptoom en verdiend aanvullend onderzoek naar onderliggende oorzaak.',
    sources: [
      {
        name: 'NHG-Standaard Urineweginfecties',
        url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
      },
      {
        name: 'H&W Microscopisch erytrocytenverlies in de urine',
        url: 'https://www.henw.org/artikelen/microscopisch-erytrocytenverlies-de-urine',
      },
      {
        name: 'NVU richtlijn Hematurie',
        url: 'https://www.nvu.nl/kwaliteitsbeleid/richtlijnen/actuele-richtlijnen/',
      },
      {
        name: 'NVKC richtlijn Eenduidige en accurate laboratoriumdiagnostiek bij hematurie',
        url: 'https://www.nvkc.nl/kwaliteit/richtlijnen/normen-en-richtlijnen',
      },
    ],
  },
  proteinuria: {
    treatment: [
      {
        description: 'Verdere diagnostiek noodzakelijk.',
        contraIndications: null,
        documentation:
          'Bloedonderzoek op kreatinine/eGFR, nuchter glucose\nUrine: sediment (vraagstelling: Erytrocyten? Percentage dysmorfe erytrocyten, (inclusief acanthocyten) en (indien aanwezig) percentage acanthocyten ten opzichte van het totaal aantal erytrocyten? Aanwezigheid en aard van cilinders?) en mate van proteïnurie (albumine, kreatinine en ACR)\nBloeddrukmeting\nNa onderzoeken op korte termijn afspraak op spreekuur',
      },
    ],
    explainer:
      'Urinescreening met urinestrip is veelal positief vanaf een eiwit(albumine)concentratie van ongeveer 100-300 mg/l. Een positieve urinestrip voor eiwit samen met hematurie rechtvaardigt dan ook een nefrologische analyse. Instrueer de patiënt dat een urinemonster zo snel mogelijk na verzamelen bij het laboratorium moet worden ingeleverd (liefst ter plaatse). Gebruik de tweede, midstraal, ochtendurine (een verzameling van twee tot vier uur na lozing van de eerste ochtendurine) voor onderzoek. Omdat dit monster geconcentreerd en zuur is, zijn de erytrocyten beter te behouden. Maar het langdurige overnachtverblijf in de blaas vergroot de kans op afbraak.',
    sources: [
      {
        name: 'NHG-Standaard Urineweginfecties',
        url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
      },
      {
        name: 'H&W Microscopisch erytrocytenverlies in de urine',
        url: 'https://www.henw.org/artikelen/microscopisch-erytrocytenverlies-de-urine',
      },
      {
        name: 'NVU richtlijn Hematurie',
        url: 'https://www.nvu.nl/kwaliteitsbeleid/richtlijnen/actuele-richtlijnen/',
      },
      {
        name: 'NVKC richtlijn Eenduidige en accurate laboratoriumdiagnostiek bij hematurie',
        url: 'https://www.nvkc.nl/kwaliteit/richtlijnen/normen-en-richtlijnen',
      },
    ],
  },
  invisiableHematuria: {
    treatment: [
      {
        description: 'Verdere diagnostiek noodzakelijk.',
        contraIndications: null,
        documentation: 'Over 1 week controle op bloed via een urineonderzoek.',
        info: 'Instructies: enkele dagen vóór het onderzoek niet intensief te sporten, de urine niet te verzamelen tijdens een menstruatie en een schoon verzamelpotje te gebruiken. Bij nieuwe symptomen contact. Indien bij controle geen bloed in de urine geen verdere controle.',
      },
      {
        description: 'Verdere diagnostiek noodzakelijk.',
        contraIndications: null,
        documentation: 'Over 1 week controle op bloed via een urineonderzoek.',
        info: 'Instructies: enkele dagen vóór het onderzoek niet intensief te sporten, de urine niet te verzamelen tijdens een menstruatie en een schoon verzamelpotje te gebruiken. Bij nieuwe symptomen contact. Indien bij controle geen bloed in de urine geen verdere controle.',
      },
      {
        description: 'Verdere diagnostiek noodzakelijk.',
        contraIndications: null,
        documentation:
          'Afspraak op het spreekuur ingepland voor verdere inventarisatie hematurie (glomerulair of urinewegen/blaas)',
      },
    ],
    explainer:
      'Het vinden van erytrocyten in de urine is niet altijd een teken van een onderliggend lijden (de sensitiviteit van de urinesticktest voor erytrocyten is 91,6%, de specificiteit is 56,9%. De lage specificiteit maakt dat een positieve urinesticktest geen garantie biedt op erytrocyten in de urine). Als de urinesticktest positief is bij een patiënt zonder klachten of met klachten zonder duidelijke oorzaak, luidt het advies om de test na 1 week te herhalen en dan nogmaals als de tweede test negatief is. Als 2 urinesticktests binnen enkele weken een positieve uitslag geven, mag men spreken van ‘persisterend erytrocytenverlies in de urine’. Foutpositieve testuitslagen ontstaan door myoglobinurie, forse bacteriurie, oxiderende schoonmaakmiddelen bij het reinigen van verzamelpotjes en contaminatie met bijvoorbeeld menstruatiebloed of bloed uit rectum of colon. Foutnegatieve resultaten ontstaan door hoge concentraties eiwit (> 5 g/l), vitamine C of nitriet (> 2,5 mmol/l), en conserveermiddelen (formaline).',
    sources: [
      {
        name: 'NHG-Standaard Urineweginfecties',
        url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
      },
      {
        name: 'H&W Microscopisch erytrocytenverlies in de urine',
        url: 'https://www.henw.org/artikelen/microscopisch-erytrocytenverlies-de-urine',
      },
      {
        name: 'NVU richtlijn Hematurie',
        url: 'https://www.nvu.nl/kwaliteitsbeleid/richtlijnen/actuele-richtlijnen/',
      },
      {
        name: 'NVKC richtlijn Eenduidige en accurate laboratoriumdiagnostiek bij hematurie',
        url: 'https://www.nvkc.nl/kwaliteit/richtlijnen/normen-en-richtlijnen',
      },
    ],
  },
};

export const other: {
  [group: string]: Treatment;
} = {
  clinicalSuspicion: {
    treatment: [
      {
        description: 'Verdere diagnostiek noodzakelijk.',
        contraIndications: null,
        documentation:
          'Vooralsnog geen urineweginfectie aan kunnen tonen, maar biij een aanhoudend klinisch vermoeden wordt een urine kweek gedaan. Mocht hierbij een bacterie gevonden worden dan kan behandeling nodig zijn.',
      },
    ],
    explainer:
      'Omdat er nog steeds een kans op vals negatieve testuitslag bestaat bij nitriettest, dipslide en urinesediment wordt bij aanhoudend klinisch vermoeden toch een kweek (gouden standaard) geadviseerd.',
    sources: [
      {
        name: 'NHG-Standaard Urineweginfecties',
        url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
      },
    ],
  },
  noConclusiveAbnormality: {
    treatment: [
      {
        description: 'Geen urineweginfectie gevonden.',
        contraIndications: null,
        documentation:
          'De kans op een urineweginfectie is verwaarloosbaar, bij aanhoudende klachten moeten andere oorzaken worden overwogen.',
      },
    ],
    explainer:
      'Geen met zekerheid pathologische afwijkingen gevonden. Afwijkende waarden kunnen in bepaalde gevallen weldegelijk van betekenis zijn (glucosurie bij een niet-diabeet) maar moeten op individuele basis afgewogen worden.',
    sources: [
      {
        name: 'NHG-Standaard Urineweginfecties',
        url: 'https://richtlijnen.nhg.org/standaarden/urineweginfecties#volledige-tekst-richtlijnen-beleid-bij-cystitis',
      },
    ],
  },
};
