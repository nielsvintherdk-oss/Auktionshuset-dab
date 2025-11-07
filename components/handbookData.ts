export interface HandbookArticle {
  id: string;
  title: string;
  content: string;
}

export const handbookData: HandbookArticle[] = [
  {
    id: 'saadan_saelger_du',
    title: 'Sådan Sælger du hos Auktionshuset',
    content: `Så nemt er det at sælge dine varer med Auktionshuset dab:

Step 1: Samtale
Vores sælger tager en snak med dig om, hvad din virksomhed gerne vil sælge. Enten via et personligt møde eller ved, at du fremsender billedmateriale af de aktiver, du ønsker skal på auktion.

Step 2: Sælgerkontrakt
Sælgerkontrakten bliver fastlagt, og der afholdes online auktion i ca. 2-3 uger.

Step 3: Eftersyn
2-3 dage før auktionens udløb afholdes der eftersyn, hvor interesserede bydere kan besigtige de aktiver, som din virksomhed har sat til salg.

Step 4: Auktion afsluttes
Auktionen afsluttes, og der kommer hammerslag på aktiverne.

Step 5: Udlevering og betaling
Ca. 3 dage efter auktionens afslutning er der 1-2 dages udlevering på de solgte aktiver og lots. I mellemtiden har dine købere tid til at foretage betaling.

Step 6: Beløb udbetales
Maks 28 dage efter sidste udleveringsdag modtager du pengene for salget af din virksomheds aktiver. Hvor privatkøbere skal have 14 dages fortrydelsesret, gælder der ingen fortrydelsesret for erhvervskøbere.`,
  },
  {
    id: 'generelle_betingelser',
    title: 'Generelle Auktionsbetingelser',
    content: `Disse betingelser er gældende for alle køb og salg foretaget gennem Auktionshuset dab A/S. Ved at oprette en brugerprofil og afgive bud på auktioner, accepterer du nærværende vilkår.
Auktionerne er offentlige, og alle er velkomne til at byde, forudsat de er myndige og har oprettet en gyldig brugerkonto.
Alle varer sælges for tredjepart (sælger), hvor Auktionshuset dab A/S alene fungerer som formidler.`,
  },
  {
    id: 'oprettelse_budgivning',
    title: 'Oprettelse som Bruger og Budgivning',
    content: `For at byde på auktioner skal du oprette en brugerkonto. Oprettelsen kræver angivelse af personlige oplysninger som navn, adresse, e-mail og telefonnummer.
Alle afgivne bud er juridisk bindende. Budgiveren med det højeste bud ved auktionens afslutning (hammerslag) er forpligtet til at gennemføre handlen.
Det er ikke tilladt at byde på egne varer (budopsving).
Auktioner kan være underlagt en mindstepris. Opnås mindsteprisen ikke, sælges varen ikke.`,
  },
  {
    id: 'salaer_moms_gebyrer',
    title: 'Salær, Moms og Gebyrer',
    content: `Til det opnåede hammerslag tillægges et købersalær. Standardsatsen er 20% af hammerslaget + moms (i alt 25%).
Derudover tillægges et hammerslagsgebyr pr. varekatalog.

Moms:
- Brugtmoms: For de fleste brugte varer betales der kun moms af salæret. Virksomheder kan ikke fradrage moms.
- Fuld moms: For visse varer (f.eks. fra konkursboer) tillægges moms (25%) til både hammerslag og salær. Dette fremgår tydeligt af varebeskrivelsen.`,
  },
  {
    id: 'betaling',
    title: 'Betaling',
    content: `Betaling skal ske senest 2 hverdage efter modtagelse af faktura.
Betaling kan foretages via bankoverførsel eller med betalingskort.
Ved forsinket betaling kan Auktionshuset dab A/S vælge at annullere handlen og/eller sælge varen for købers regning.`,
  },
  {
    id: 'fragt_afhentning',
    title: 'Fragt og Afhentning',
    content: `Vi tilbyder som udgangspunkt IKKE fragt, forsendelse eller pakning af købte effekter.
Køber er selv ansvarlig for al nedtagning, demontage, emballering og læsning af varen. Det er vigtigt at medbringe nødvendigt værktøj, emballage og mandskab.
Købte varer skal afhentes på den adresse og inden for det tidsrum, der er angivet i varebeskrivelsen.
Hvis en vare ikke afhentes inden for fristen, pålægges et opbevaringsgebyr. Auktionshuset kan efter 14 dage vælge at bortsælge varen for købers regning.`,
  },
  {
    id: 'fortrydelsesret',
    title: 'Fortrydelsesret for Private Forbrugere',
    content: `Private forbrugere har 14 dages fortrydelsesret ved onlineauktioner. Fristen regnes fra den dag, du får varen i fysisk besiddelse.
For at benytte fortrydelsesretten skal du utvetydigt meddele os dette skriftligt.
Ved fortrydelse skal varen returneres senest 14 dage efter, du har meddelt din fortrydelse. Du afholder selv omkostningerne ved returnering.
Hele det fakturerede beløb refunderes, når vi har modtaget varen retur.
Bemærk: Fortrydelsesretten gælder ikke for erhvervsdrivende.`,
  },
  {
    id: 'reklamation_stand',
    title: 'Reklamationsret og Varens Stand',
    content: `Alle varer sælges som beset og uden garanti. Varerne er ofte brugte og kan have fejl og mangler.
Det er købers eget ansvar at besigtige og vurdere varens stand på de angivne eftersynsdage før budgivning. Varebeskrivelser er vejledende og Auktionshuset tager forbehold for fejl.
Ved at byde på en vare anerkender du at have haft mulighed for at undersøge den.`,
  },
  {
    id: 'faq',
    title: 'Ofte Stillede Spørgsmål (FAQ)',
    content: `Hvad er et lot?
Et lot er en vare eller en samling af varer, der sælges under ét katalognummer.

Hvad er hammerslag?
Det er det højeste bud, der er afgivet, når auktionen slutter.

Hvad er salær?
Det er et gebyr, som køberen betaler udover hammerslaget.

Kan jeg byde, hvis jeg ikke har et CVR-nummer?
Ja, alle kan byde, både private og virksomheder.

Hvad er en mindstepris?
Det er den hemmelige minimumspris, som sælgeren har fastsat. Varen sælges kun, hvis buddet når over dette beløb.`,
  },
];
