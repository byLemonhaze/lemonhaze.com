
const PROVENANCE_URLS = [
  "https://cdn.lemonhaze.com/assets/assets/provenance.json",
  "https://cdn.lemonhaze.com/assets/provenance.json",
  "/data/provenance.json",
];
const BB_COLLECTION_URL = "https://bestbefore.space/magic_eden_collection.json";

export async function fetchProvenance() {
  for (const url of PROVENANCE_URLS) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data?.data)) return data.data;
    } catch {
      // Try next source.
    }
  }
  console.error("Error fetching provenance: all sources failed");
  return [];
}

export async function fetchBBCollection() {
  try {
    const res = await fetch(BB_COLLECTION_URL);
    if (!res.ok) throw new Error("Failed to fetch BB collection");
    const data = await res.json();
    return data.map(item => ({
      id: item.id,
      name: item.meta?.name || 'BEST BEFORE',
      collection: 'BEST BEFORE',
      content_type: 'text/html',
      _imgSrc: item.meta?.high_res_img_url || null,
    }));
  } catch (error) {
    console.error("Error fetching BB collection:", error);
    return [];
  }
}

// EXACT CHRONOLOGY AS REQUESTED
export const CHRONOLOGY_BY_YEAR = {
  "2026": [
    "1 of 1s (2026)"
  ],
  "2025": [
    "BEST BEFORE",
    "Ma ville en quatre temps",
    "Tori no Roji",
    "1 of 1s (2025)",
  ],
  "2024": [
    "Games",
    "Manufactured",
    "Little Get Away",
    "Montreal",
    "La Tentation",
    "DeVille",
    "Unregulated Minds",
    "1 of 1s (2024)"
  ],
  "2023": [
    "Bento Box",
    "Candidly Yours",
    "Untitled",
    "Downtown",
    "Oaxaca",
    "Old-Fashioned",
    "Orphelinat",
    "Volatility",
    "Generative Composition",
    "Discography",
    "World Tour",
    "Jardin Secret",
    "Lotus",
    "Berlin",
    "Fading",
    "Mending Fragments",
    "Dark Days",
    "Polaroid",
    "Ordinals Summer",
    "Framed",
    "The Artifacts",
    "Le Bar a Tapas",
    "Tad Small",
    "Gentlemen",
    "Miscellaneous",
    "Portrait 2490",
    "Cypherville"
  ]
};

export const ABOUT_LEMONHAZE_TEXT = `
<p class="mb-4 text-white/90 font-light leading-relaxed">
  Lemonhaze (b. 1990) is the artistic practice of Frédérick Nathaniel St-Louis (FNST), a self-taught Canadian artist who divides his time between Montreal and Puerto Escondido. Drawing from a background in music, expressive writing, and independent experimentation, he develops an evolving digital art practice rooted in exploration and personal reflection.
</p>
<p class="mb-4 text-white/90 font-light leading-relaxed">
  Continually experimenting with the tools of his time — laptops, JavaScript, AI, and digital drawing software — Lemonhaze uses code, algorithms, and digital tools to translate lived experience into evolving visual systems.
</p>
<p class="mb-4 text-white/90 font-light leading-relaxed">
  His practice is iterative, spontaneous, and modular, touching a wide range of interests from journaling to physical mediums, while remaining anchored in the development of his personal code-based paint engine.
</p>
<p class="mb-4 text-white/90 font-light leading-relaxed">
  His art acts both as a means of escape and as a tangible memento, often deeply personal — capturing fragments of lived experience, emotion, and time.
  With a deep appreciation for the lasting nature of the Bitcoin blockchain, he has chosen it as the foundation for his poetic and visual expressions.
</p>
<p class="mb-0 text-white/90 font-light leading-relaxed">
  Lemonhaze’s singular and offbeat journey as an artist, shaped outside the constraints of traditional art education or industry expectations, reflects a raw individuality. His work is collected by more than 100 individual collectors and has been showcased internationally, including at the Sotheby’s Contemporary Discoveries auction in New York (2025).
</p>
`;

export const CAREER_HIGHLIGHTS_ITEMS = [
  { text: "·Solo exhibition 'Montreal by Lemonhaze' curated by Gamma at Suburbs Gallery in Montreal (August 2025)", link: "https://blog.gamma.io/ordinals-spotlight-montreal-by-lemonhaze/", tier: 1 },
  { text: "·Sotheby's Contemporary Discoveries Auction in New York - (February 2025)", link: "https://www.sothebys.com/en/buy/auction/2025/contemporary-discoveries-2/chamber-of-reflection-sin-city", tier: 1 },
  { text: "·Bitcoin Village at NFT Paris in Paris (February 2025)", tier: 1 },
  "·The Parthenon in Nashville (July 2024)",
  "·Ordinals LATAM in Mexico City/Monterrey/San Cristobal (June 2024)",
  "·Cinco de Monero in San Francisco (May 2024)",
  "·Ordinals Asia in Hong Kong (May 2024)",
  "·Cypherpunk Lab in San Francisco (February 2024)",
  { text: "·Art Basel in Miami (December 2023)", tier: 1 },
  { text: "·Inscribing Atlantis in Amsterdam (October 2023)", tier: 1 },
  "·Ordinal Summit in Singapore (September 2023)",
  "·Gamma Partner Artist on Bitcoin (September 2023)"
];

export const COL_DESCRIPTIONS = {
  "1/1s (2026)": `1/1s of 2026 with grand-parent-child provenance - more details about these works can be found in the HTML header of each inscriptions`,
  "1 of 1s (2026)": `1/1s of 2026 with grand-parent-child provenance - more details about these works can be found in the HTML header of each inscriptions`,
  "BEST BEFORE": `Art with a best-before date: born sealed at inscription, unsealed by its collector, and aging on block time. Many live short lives, some endure, and the rare outlier may never expire.`,
  "Manufactured": `"When gravity becomes manufactured, you remember the scent of a lemon."`,
  "Satoshi CC Edition": "Counterfeit Cards Series 00 - Card 08",
  "Portrait 2490": `Portrait2490 is a collection of 90 futuristic portrait of robots and/or human living in the year 2490.

Asking one not so simple question:

What are we gonna look like down the road?

Released in March 2023 - all pieces were minted/inscribed sub-300k - these works were precursor to Gentlemen by Lemonhaze and part of my earliest AI exploration at the time. Exploring. Evolving. Learning.`,

  // 1/1s (2024) aliases
  "1/1s (2024)": `1/1s of 2024 with grand-parent-child provenance - more details about these works can be found in the HTML header of each inscriptions`,
  "1 of 1s (2024)": `1/1s of 2024 with grand-parent-child provenance - more details about these works can be found in the HTML header of each inscriptions`,
  "1/1s 2024": `1/1s of 2024 with grand-parent-child provenance - more details about these works can be found in the HTML header of each inscriptions`,
  "1 of 1s 2024": `1/1s of 2024 with grand-parent-child provenance - more details about these works can be found in the HTML header of each inscriptions`,

  // 1/1s (2025) aliases
  "1/1s (2025)": `1/1s of 2025 with grand-parent-child provenance - more details about these works can be found in the HTML header of each inscriptions`,
  "1 of 1s (2025)": `1/1s of 2025 with grand-parent-child provenance - more details about these works can be found in the HTML header of each inscriptions`,
  "1/1s 2025": `1/1s of 2025 with grand-parent-child provenance - more details about these works can be found in the HTML header of each inscriptions`,
  "1 of 1s 2025": `1/1s of 2025 with grand-parent-child provenance - more details about these works can be found in the HTML header of each inscriptions`,

  "Deprivation prints": "Between passion and obsession lies deprivation, the duality of a soul longing for light amidst the enveloping darkness of sleepless nights.",
  "Mirage prints": "A vivid interplay between true happiness and misleading hope, where real fulfillment is found in harmonizing dreams with reality.",
  "Trilogy prints": `Trilogy of Gamma prints (2025).

Off-Kilter: Away from the usual - tilted by instinct, curiosity, and dissonance. But even in imbalance, there's movement. Lean into the tilt until motion finds you where logic won't.

Glass Breaker: The pulse scatters, the mind fractures and for a moment, everything feels like truth. But it's taking over, turning rhythm into hollow.

Mending Out: When denial dissolves and clarity takes form, what remains is not hope but choice - the will to exist despite the shivers, mending out the fracture.`,
  "Gentlemen": `Gentlemen is a work in progress.The Gentlemen represent the person I want to become for the love of my life.

Becoming a gentleman is a lifelong process, a journey that only ends with my death.

The Gentlemen are meant to inspire loyalty, integrity, love, and chivalrous behavior.

I inscribe them as I see fit, as my soul asks for it. Money alone can't buy it.`,
  "Miscellaneous": `An amalgam of 1/1 portraits`,
  "Games": `"Qui ne risque rien, n'a rien" - This is where I dare to explore the relationship between scarcity, collector experience and artistic integrity. And there's only one way to play: you must burn 3 'Manufactured' to get 1 'Game'. Games are custom 1/1s (personally signed and dedicated to your name and more) that use extended 'Manufactured' features with a heavier set of brushes & textures. Max supply: up to 101. On-Demand Only.`,
  "Minute, papillon! Edition": "ART BY LEMONHAZE",
  "The Artifacts": `1 of 1s Digital Artifacts`,
  "Cypherville": `Welcome to the mysterious world of Cypherville Ordinals. Visit https://cypherville.xyz for more info.`,
  "Old Fashioned": `"Old-Fashioned" is a blend of tradition and a grand vision. Inscribed on vintage sats from block 78, this collection pushes the boundaries of on-chain art by presenting ultra-high resolution (20K) artworks on Bitcoin. Each pieces use a combination of randomness in layout and texture design, coupled with a probability-based color selection that adds a layer of intrigue into the creation process. Additionally, viewers can find intriguing notes embedded within the HTML header of each artwork, offering a deeper glimpse into the narrative behind the tradition.`,
  "Old-Fashioned": `"Old-Fashioned" is a blend of tradition and a grand vision. Inscribed on vintage sats from block 78, this collection pushes the boundaries of on-chain art by presenting ultra-high resolution (20K) artworks on Bitcoin. Each pieces use a combination of randomness in layout and texture design, coupled with a probability-based color selection that adds a layer of intrigue into the creation process. Additionally, viewers can find intriguing notes embedded within the HTML header of each artwork, offering a deeper glimpse into the narrative behind the tradition.`,
  "Volatility": `A generative reflection of life's inherent ups and downs, of the oscillations in mood and spirit that we all endure. Just as markets surge and plummet, so do our emotions, hopes, and dreams. Volatility is a representation of the peaks of euphoria and the troughs of despair. It's personal, yet universal - a testimony to the wild ride that is life and the quest for balance in the midst of chaos. Note: Go to the official ordinals content link and press 'S' to download the high resolution PNG.`,
  "Provenance": "ART BY LEMONHAZE",
  "La Tentation": `A seductive paradox, where the allure of temptation meets the purity of restraint. In this curated generative series, I work with a simple extended grid composition and a set of vivid color palettes, exploring the fine line between indulgence and control. This is a continuation of my work with code, where I put a lot of emphasis on textures and mixing colors.`,
  "Deville": `Descendants of Cypherville.`,
  "DeVille": `Descendants of Cypherville.`,
  "Generative Composition": `An amalgam of mini-series and 1/1s where I'm learning to make art with code. Each of the works presented in this heterogeneous series was personally curated from my early days of experimentation with generative art where I explored various themes, textures, and compositions. Additional note: Visit the official ordinals content link of the inscription and press 'S' on your keyboard to download the high resolution PNG. - Some of the artwork in this series might not render or display properly across all marketplace therefore it's good to keep in mind that the original artwork is always the high resolution PNG located in the HTML file of the inscription.`,
  "Lotus": `Emerging from the depths of murky waters with pristine petals, Lotus is inspired by my other half, who remains pure in spite of it all.
The Lotus embodies beauty, strength, and resilience—a symbol of the women's experience.
My reason to become a gentleman.`,
  "Split collectible": "ART BY LEMONHAZE",
  "Untitled": `My first collection with grand-parent-child provenance.`,
  "Mending Fragments": `A visual journey where fragmented pieces unite, portraying the profound process of healing, resilience, and discovering beauty within imperfection.`,
  "Berlin": `Capturing a tumultuous journey through Berlin's grayish days and pulsating nights. This series is a tribute to rain-soaked revelries, intoxicating encounters, and the liberation found in this—a raw, unfiltered snapshot of life and self-discovery amidst Berlin's nightlife.`,
  "Oaxaca": `In this generative series, I aim to depict a simple life of surf and sun, capturing the essence of Puerto Escondido, Oaxaca. Through geometric micro-textures, I pay homage to a place where nature, culture, and simplicity coexist, representing my home of the past few years.`,
  "Polaroid": `Capturing the moment in its simplest form.`,
  "Montreal": `A generative abstraction of the past. In this series I'm blending physical and digital textures while playing with color palettes that reminds me of my younger days in Montreal. Each pieces contains a personal anecdote that can be found in the HTML header of each inscriptions.`,
  "Candidly Yours": `Digitally hand drawn and processed with p5js texture filters, this series invites you to take a candid glimpse into the artist's inner thoughts. Each piece serves as a unique snapshot, capturing moments of introspection, inspiration, and personal reflection.`,
  "Discography": `The soundtrack of my life (unfinished).`,
  "L'Orphelinat": `Born without parents, these unique and distinct misfits, each a one-on-one piece, were fortunate to find friendship with each other at the orphanage.`,
  "Orphelinat": `Born without parents, these unique and distinct misfits, each a one-on-one piece, were fortunate to find friendship with each other at the orphanage.`,
  "Unregulated Minds": `A Collection of thoughts and outputs for sovereign individuals, free thinkers, and world builders.`,
  "Framed": `Being at the wrong place at the wrong time.`,
  "Le Bar a Tapas": `From minimalist to ordinalist: A glimpse into my days in Tenerife. This series was born during a time of high fees, which led me to explore new ways of creating and adapting to my new canvas, namely Bitcoin. These handcrafted pieces are meant to capture simple moments of my time in Spain and serve as immutable mementos of my life.`,
  "World Tour": `An homage to the countries I've traveled (unfinished).`,
  "Ma ville en quatre temps": `This series is part of 'Continuum, The Forever Calendar' presented by Gamma at Inscribing Vegas 2025 - more details about these works can be found in the HTML header of each inscriptions`,
  "Tori no Roji": `Tōri no Roji - 通りの路地 - "The Alleys of the Streets":
This is where I'm trying to capture the contrast and transition
between Osaka's bustling streets and its quiet, hidden, and charming alleys.`,
  "Little Get Away": `Sometimes I need to take a step back and get away from the things that obsess me. And this time, I'm planning a little get away with my love.`,
  "Ordinals Summer": `It's all about having fun.`,
  "Colors": "ART BY LEMONHAZE",
  "Cypherville Comics": "ART BY LEMONHAZE",
  "Jardin Secret": `Things I can't talk about right now.`,
  "Tad Small": `Tad Small is a micro-series of 3 pixel artwork to satisfy my urge to inscribe.`,
  "Fading": `Delicate threads of decay intertwine, revealing faded echoes of a distant past.`,
  "Dark Days": `Is it losing control?`,
  "Bento Box": `Digital delicacies crafted with code. Each 'Bento Box' is meticulously curated to capture simplicity and artful elegance. Pure aesthetic love, no words.`,
  "Downtown": `Downtown is a pair of generative artworks, melding retro-wave nostalgia with the chaos of urban life on a large 16:9 digital canvas. Crafted with p5js, these two pieces mark a continuation of Lemonhaze's journey in creating art with code. The artworks presented here were crafted with an emphasis on exploring minimalistic textures, coupled with the goal of recreating glimpses of the artist's past metropolitan life. Additional note: Visit the official ordinals content link of the inscription and press 'S' on your keyboard to download the 6400x3600 high resolution PNG.`,
  "Satoshi 1/1 - Counterfeit Cards S00 - C08": "A unique piece from the Counterfeit Cards series.",
  "Eclosion 1/1 - Amsterdam Blooms": "A collaboration celebrating Amsterdam's artistic heritage.",
  "Skull 506 [Remix] 1/1 - Skullx": "A remix contribution to the Skullx project.",
  "Text & Unclassified": "Experimental text-based works and uncategorized pieces."
};;
export const ORDINALS_SUPPLY_DATA = [
  { name: 'BEST BEFORE', year: 2025, inscribed: 420, circulating: 420 },
  { name: 'Manufactured', year: 2024, inscribed: 420, circulating: 239 },
  { name: 'Satoshi CC Edition', year: 2023, inscribed: 110, circulating: 109 },
  { name: 'Portrait 2490', year: 2023, inscribed: 90, circulating: 87 },
  { name: '1/1s (2024)', year: 2024, inscribed: 49, circulating: 10 },
  { name: '1/1s (2025)', year: 2025, inscribed: 35, circulating: 19 },
  { name: 'Deprivation prints', year: 2023, inscribed: 33, circulating: 33 },
  { name: 'Mirage prints', year: 2024, inscribed: 33, circulating: 33 },
  { name: 'Trilogy prints', year: 2025, inscribed: 33, circulating: 33 },
  { name: 'Gentlemen', year: 2023, inscribed: 25, circulating: 24 },
  { name: 'Miscellaneous', year: 2023, inscribed: 25, circulating: 9 },
  { name: 'Games', year: 2024, inscribed: 26, circulating: 26 },
  { name: 'Minute, papillon! Edition', year: 2025, inscribed: 21, circulating: 21 },
  { name: 'The Artifacts', year: 2023, inscribed: 18, circulating: 17 },
  { name: 'Cypherville', year: 2023, inscribed: 16, circulating: 16 },
  { name: 'Old Fashioned', year: 2023, inscribed: 16, circulating: 14 },
  { name: 'Volatility', year: 2023, inscribed: 16, circulating: 16 },
  { name: 'Provenance', year: 2023, inscribed: 17, circulating: 3 },
  { name: 'La Tentation', year: 2024, inscribed: 15, circulating: 14 },
  { name: 'Deville', year: 2024, inscribed: 15, circulating: 15 },
  { name: 'Text & Unclassified', year: 2023, inscribed: 11, circulating: 1 },
  { name: 'Generative Composition', year: 2023, inscribed: 9, circulating: 8 },
  { name: 'Lotus', year: 2023, inscribed: 9, circulating: 8 },
  { name: 'Split collectible', year: 2023, inscribed: 9, circulating: 8 },
  { name: 'Untitled', year: 2023, inscribed: 8, circulating: 2 },
  { name: 'Mending Fragments', year: 2023, inscribed: 8, circulating: 7 },
  { name: 'Berlin', year: 2023, inscribed: 8, circulating: 8 },
  { name: 'Oaxaca', year: 2023, inscribed: 8, circulating: 8 },
  { name: 'Polaroid', year: 2023, inscribed: 8, circulating: 7 },
  { name: 'Montreal', year: 2024, inscribed: 7, circulating: 7 },
  { name: 'Candidly Yours', year: 2023, inscribed: 7, circulating: 7 },
  { name: 'Discography', year: 2023, inscribed: 7, circulating: 0 },
  { name: 'L’Orphelinat', year: 2023, inscribed: 6, circulating: 3 },
  { name: 'Unregulated Minds', year: 2024, inscribed: 6, circulating: 6 },
  { name: 'Framed', year: 2023, inscribed: 5, circulating: 5 },
  { name: 'Le Bar a Tapas', year: 2023, inscribed: 5, circulating: 5 },
  { name: 'World Tour', year: 2023, inscribed: 5, circulating: 0 },
  { name: 'Ma ville en quatre temps', year: 2025, inscribed: 4, circulating: 4 },
  { name: 'Tori no Roji', year: 2025, inscribed: 4, circulating: 4 },
  { name: 'Little Get Away', year: 2024, inscribed: 4, circulating: 4 },
  { name: 'Ordinals Summer', year: 2023, inscribed: 4, circulating: 4 },
  { name: 'Colors', year: 2023, inscribed: 4, circulating: 0 },
  { name: 'Cypherville Comics', year: 2023, inscribed: 3, circulating: 0 },
  { name: 'Jardin Secret', year: 2023, inscribed: 3, circulating: 1 },
  { name: 'Tad Small', year: 2023, inscribed: 3, circulating: 1 },
  { name: 'Fading', year: 2023, inscribed: 3, circulating: 3 },
  { name: 'Dark Days', year: 2023, inscribed: 3, circulating: 3 },
  { name: 'Bento Box', year: 2023, inscribed: 2, circulating: 1 },
  { name: 'Downtown', year: 2023, inscribed: 2, circulating: 2 },
  { name: 'Eclosion 1/1 - Amsterdam Blooms', year: 2023, inscribed: 1, circulating: 1 },
  { name: 'Satoshi 1/1 - Counterfeit Cards S00 - C08', year: 2023, inscribed: 1, circulating: 1 },
  { name: 'Skull 506 [Remix] 1/1 - Skullx', year: 2025, inscribed: 1, circulating: 1 },
  { name: '1 of 1s (2026)', year: 2026, inscribed: 9, circulating: 9 },
];

export const ETH_SUPPLY_DATA = [
  { name: 'Boulogne Editions', platform: 'Rarible', year: 2020, count: 80 },
  { name: 'Rich Bean Editions', platform: 'Rarible', year: 2020, count: 8 },
  { name: 'Bell Street Style', platform: 'Rarible', year: 2020, count: 1 },
  { name: "Murky by John D'Oeufs", platform: 'Rarible', year: 2020, count: 1 },
  { name: 'Marilyn Monero', platform: 'OpenSea', year: 2021, count: 1 },
];

export const PHYSICAL_WORKS_ITEMS = [
  '16 Signed Prints on SCR 310 gsm and Hemp 290gsm (2025)',
  '19 Signed Marker on Jeans (2023, 2024, 2025)',
  '1 E-Paper code-base "Sex, Scotch & Soda" (2025)',
  '1 Gold-flecked Xuan paper "Leftover Trophy" (2024)',
  '1 Acrylic frame "Satoshi CC Card" (2025)',
];

const SATFLOW_LINKS = {
  'Manufactured': 'https://www.satflow.com/ordinals/manufactured-by-lemonhaze',
  'Satoshi CC Edition': 'https://www.satflow.com/ordinals/counterfeit-cards-series-00?attributes=%7B%22CREATOR%22%3A%5B%22LEMONHAZE%22%5D%7D',
  'Portrait 2490': 'https://www.satflow.com/ordinals/portrait-2490',
  '1/1s (2024)': 'https://www.satflow.com/ordinals/1on1-by-lemonhaze',
  'Deprivation prints': 'https://www.satflow.com/ordinals/deprivation-by-lemonhaze',
  'Mirage prints': 'https://www.satflow.com/ordinals/mirage-by-lemonhaze',
  'Trilogy prints': 'https://www.satflow.com/ordinals/prints-trilogy-by-lemonhaze',
  '1/1s (2025)': 'https://www.satflow.com/ordinals/1on1-2025-by-lemonhaze',
  'Gentlemen': 'https://www.satflow.com/ordinals/gentlemen-by-lemonhaze',
  'Miscellaneous': 'https://www.satflow.com/ordinals/miscelleneous-by-lemonhaze',
  'Games': 'https://www.satflow.com/ordinals/games-by-lemonhaze',
  'Minute, papillon! Edition': 'https://www.satflow.com/ordinals/minute-papillon-editions-by-lemonhaze',
  'The Artifacts': 'https://www.satflow.com/ordinals/artifacts-by-lemonhaze',
  'Cypherville': 'https://www.satflow.com/ordinals/cypherville-ordinals',
  'Old Fashioned': 'https://www.satflow.com/ordinals/old-fashioned-by-lemonhaze',
  'Volatility': 'https://www.satflow.com/ordinals/volatility-by-lemonhaze',
  'La Tentation': 'https://www.satflow.com/ordinals/tentation-by-lemonhaze',
  'Deville': 'https://www.satflow.com/ordinals/deville-by-lemonhaze',
  'Generative Composition': 'https://www.satflow.com/ordinals/generative-composition-by-lemonhaze',
  'Lotus': 'https://www.satflow.com/ordinals/lotus-by-lemonhaze',
  'Split collectible': 'https://www.satflow.com/ordinals/cypherville-split-collectibles-by-lemonhaze',
  'Untitled': 'https://www.satflow.com/ordinals/untitled-by-lemonhaze',
  'Mending Fragments': 'https://www.satflow.com/ordinals/mending-fragments-by-lemonhaze',
  'Berlin': 'https://www.satflow.com/ordinals/berlin-by-lemonhaze',
  'Oaxaca': 'https://www.satflow.com/ordinals/oaxaca-by-lemonhaze',
  'Polaroid': 'https://www.satflow.com/ordinals/polaroid-by-lemonhaze',
  'Montreal': 'https://www.satflow.com/ordinals/montreal-by-lemonhaze',
  'Candidly Yours': 'https://www.satflow.com/ordinals/candidly-yours-by-lemonhaze',
  'Discography': 'https://www.satflow.com/ordinals/discography-by-lemonhaze',
  'L’Orphelinat': 'https://www.satflow.com/ordinals/orphelinat-by-lemonhaze',
  'Unregulated Minds': 'https://www.satflow.com/ordinals/unregulated-minds-by-lemonhaze',
  'Framed': 'https://www.satflow.com/ordinals/framed',
  'Le Bar a Tapas': 'https://www.satflow.com/ordinals/bar-tapas-by-lemonhaze',
  'World Tour': 'https://www.satflow.com/ordinals/world-tour-by-lemonhaze',
  'Ma ville en quatre temps': 'https://www.satflow.com/ordinals/ma-ville-en-quatre-temps-by-lemonhaze',
  'Tori no Roji': 'https://www.satflow.com/ordinals/tori_no_roji_by_lemonhaze',
  'Little Get Away': 'https://www.satflow.com/ordinals/little-get-away-by-lemonhaze',
  'Ordinals Summer': 'https://www.satflow.com/ordinals/ordinals-summer-by-lemonhaze',
  'Jardin Secret': 'https://www.satflow.com/ordinals/jardin-secret-by-lemonhaze',
  'Tad Small': 'https://www.satflow.com/ordinals/tad-small-by-lemonhaze',
  'Fading': 'https://www.satflow.com/ordinals/fading-by-lemonhaze',
  'Dark Days': 'https://www.satflow.com/ordinals/dark-days-by-lemonhaze',
  'Bento Box': 'https://www.satflow.com/ordinals/bento-box-by-lemonhaze',
  'Downtown': 'https://www.satflow.com/ordinals/downtown-by-lemonhaze',
};

function normalizeMarketLinks(linksByCollection) {
  return Object.fromEntries(
    Object.entries(linksByCollection).map(([name, links]) => {
      const { me: _me, ...rest } = links;
      const satflow = SATFLOW_LINKS[name];
      return [name, satflow ? { ...rest, satflow } : rest];
    })
  );
}

const RAW_MARKET_LINKS = {
  'BEST BEFORE': {
    gamma: 'https://gamma.io/ordinals/collections/best-before/items'
  },
  'Manufactured': {
    gamma: 'https://gamma.io/ordinals/collections/manufactured/items'
  },
  'Satoshi CC Edition': {
    gamma: 'https://gamma.io/ordinals/collections/counterfeit-cards/items?a.Artist=Lemonhaze'
  },
  'Portrait 2490': {
    gamma: 'https://gamma.io/ordinals/collections/portrait-2490-by-lemonhaze/items'
  },
  '1/1s (2024)': {
    gamma: 'https://gamma.io/ordinals/collections/1-1-2024-by-lemonhaze/items'
  },
  'Deprivation prints': {
    gamma: 'https://gamma.io/ordinals/prints/cllo44w190001jr0fajdfe7cc/details'
  },
  'Mirage prints': {
    gamma: 'https://gamma.io/ordinals/prints/clr14i0q90003l60fw2205qjr/details'
  },
  'Trilogy prints': {
    gamma: 'https://gamma.io/explore/prints?creator=clkrid54y0000l50fs5qmsbpp'
  },
  '1/1s (2025)': {
    gamma: 'https://gamma.io/ordinals/collections/1-1-2025-by-lemonhaze/items'
  },
  'Gentlemen': {
    gamma: 'https://gamma.io/ordinals/collections/gentlemen-by-lemonhaze/items'
  },
  'Miscellaneous': {
    gamma: 'https://gamma.io/ordinals/collections/miscellaneous-by-lemonhaze/items'
  },
  'Games': {
    gamma: 'https://gamma.io/ordinals/collections/games-manufactured/items'
  },
  'Minute, papillon! Edition': {
    gamma: 'https://gamma.io/ordinals/collections/minute-papillon/items'
  },
  'The Artifacts': {
    gamma: 'https://gamma.io/ordinals/collections/theartifacts/items'
  },
  'Cypherville': {
    gamma: 'https://gamma.io/ordinals/collections/cypherville-by-lemonhaze/items'
  },
  'Old Fashioned': {
    gamma: 'https://gamma.io/ordinals/collections/old-fashioned-by-lemonhaze/items'
  },
  'Volatility': {
    gamma: 'https://gamma.io/ordinals/collections/volatility-by-lemonhaze/items'
  },
  'Provenance': {
    gamma: 'https://gamma.io/ordinals/collections/provenance/items'
  },
  'La Tentation': {
    gamma: 'https://gamma.io/ordinals/collections/la-tentation-by-lemonhaze/items'
  },
  'Deville': {
    gamma: 'https://gamma.io/ordinals/collections/deville-by-lemonhaze/items'
  },
  'Text & Unclassified': {
    gamma: 'https://gamma.io/ordinals/inscriptions/b8acd0a45be8663deea56e28ab831f067ceec54ef68c416b812e17266acf1eddi0'
  },
  'Generative Composition': {
    gamma: 'https://gamma.io/ordinals/collections/generative-composition-by-lemonhaze/items'
  },
  'Lotus': {
    gamma: 'https://gamma.io/ordinals/collections/lotus-by-lemonhaze/items'
  },
  'Split collectible': {
  },
  'Untitled': {
    gamma: 'https://gamma.io/ordinals/collections/untitled/items'
  },
  'Mending Fragments': {
    gamma: 'https://gamma.io/ordinals/collections/mending-fragments-by-lemonhaze/items'
  },
  'Berlin': {
    gamma: 'https://gamma.io/ordinals/collections/berlin-by-lemonhaze/items'
  },
  'Oaxaca': {
    gamma: 'https://gamma.io/ordinals/collections/oaxaca-by-lemonhaze/items'
  },
  'Polaroid': {
    gamma: 'https://gamma.io/ordinals/collections/polaroid-by-lemonhaze/items'
  },
  'Montreal': {
    gamma: 'https://gamma.io/ordinals/collections/montreal/items'
  },
  'Candidly Yours': {
    gamma: 'https://gamma.io/ordinals/collections/candidly-yours/items'
  },
  'Discography': {
    gamma: 'https://gamma.io/ordinals/collections/discography-by-lemonhaze/items'
  },
  'L’Orphelinat': {
    gamma: 'https://gamma.io/ordinals/collections/LOrphelinat/items'
  },
  'Unregulated Minds': {
    gamma: 'https://gamma.io/ordinals/collections/unregulated-minds/items'
  },
  'Framed': {
    gamma: 'https://gamma.io/ordinals/collections/framed-ny-lemonhaze/items'
  },
  'Le Bar a Tapas': {
    gamma: 'https://gamma.io/ordinals/collections/le-bar-a-tapas-by-lemonhaze/items'
  },
  'World Tour': {
    gamma: 'https://gamma.io/ordinals/collections/world-tour-by-lemonhaze/items'
  },
  'Ma ville en quatre temps': {
    gamma: 'https://gamma.io/ordinals/collections/ma-ville-en-quatre-temps%20/items'
  },
  'Tori no Roji': {
    gamma: 'https://gamma.io/ordinals/collections/tori-no-roji/items'
  },
  'Little Get Away': {
    gamma: 'https://gamma.io/ordinals/collections/little-get-away/items'
  },
  'Ordinals Summer': {
    gamma: 'https://gamma.io/ordinals/collections/ordinals-summer-by-lemonhaze/items'
  },
  'Colors': {
    gamma: 'https://gamma.io/ordinals/collections/colours-by-lemonhaze/items'
  },
  'Cypherville Comics': {
    gamma: 'https://gamma.io/ordinals/collections/cypherville-comics-by-lemonhaze/items'
  },
  'Jardin Secret': {
    gamma: 'https://gamma.io/ordinals/collections/jardin-secret-by-lemonhaze/items'
  },
  'Tad Small': {
    gamma: 'https://gamma.io/ordinals/collections/tad-small-by-lemonhaze/items'
  },
  'Fading': {
    gamma: 'https://gamma.io/ordinals/collections/fading-by-lemonhaze/items'
  },
  'Dark Days': {
    gamma: 'https://gamma.io/ordinals/collections/dark-days-by-lemonhaze/items'
  },
  'Bento Box': {
    gamma: 'https://gamma.io/ordinals/collections/bento-box-by-lemonhaze/items'
  },
  'Downtown': {
    gamma: 'https://gamma.io/ordinals/collections/downtown-by-lemonhaze/items'
  },
  'Eclosion 1/1 - Amsterdam Blooms': {
    gamma: 'https://gamma.io/ordinals/collections/amsterdam-blooms/items'
  },
  'Satoshi 1/1 - Counterfeit Cards S00 - C08': {
    gamma: 'https://gamma.io/ordinals/collections/counterfeit-cards/items?a.Artist=Lemonhaze'
  },
  'Skull 506 [Remix] 1/1 - Skullx': {
    gamma: 'https://gamma.io/ordinals/collections/skullx-the-artist-series/items'
  }
};

export const MARKET_LINKS = normalizeMarketLinks(RAW_MARKET_LINKS);

export const LINK_OVERRIDES = {
  'BEST BEFORE': 'https://bestbefore.gallery',
  'Satoshi CC Edition': 'https://gamma.io/ordinals/collections/counterfeit-cards/items?a.Artist=Lemonhaze',
  'Satoshi 1/1 - Counterfeit Cards S00 - C08': 'https://gamma.io/ordinals/collections/counterfeit-cards/items?a.Artist=Lemonhaze',
  'Deprivation prints': 'https://lemonhaze.com/collection?name=Orphelinat',
  'Mirage prints': 'https://lemonhaze.com/collection?name=1%20of%201s%20(2024)',
  'Trilogy prints': 'https://lemonhaze.com/collection?name=1%20of%201s%20(2025)',
  '1/1s (2024)': 'https://lemonhaze.com/collection?name=1%20of%201s%20(2024)',
  '1/1s (2025)': 'https://lemonhaze.com/collection?name=1%20of%201s%20(2025)',
  'Provenance': 'https://lemonhaze.com/',
  'Text & Unclassified': 'https://lemonhaze.com/',
  'Eclosion 1/1 - Amsterdam Blooms': 'https://gamma.io/ordinals/collections/amsterdam-blooms/items',
  'Skull 506 [Remix] 1/1 - Skullx': 'https://gamma.io/ordinals/collections/skullx-the-artist-series/items',
  'L’Orphelinat': 'https://lemonhaze.com/collection?name=Orphelinat',
  'Minute, papillon! Edition': 'https://lemonhaze.com/collection?name=1%20of%201s%20(2025)',
  'Old Fashioned': 'https://lemonhaze.com/collection?name=Old-Fashioned',
  'Deville': 'https://lemonhaze.com/collection?name=DeVille',
  'Split collectible': 'https://cypherville.xyz',
  'Cypherville Comics': 'https://cypherville.xyz',
  'Tad Small': 'https://lemonhaze.com/collection?name=Tad%20Small',
  'Dark Days': 'https://lemonhaze.com/collection?name=Dark%20Days',
};

export const MEDIA_ITEMS = [
  {
    title: "Chamber of Reflection (Sin City) at Sotheby's",
    platform: "Sotheby's",
    caption: "Featured in the Contemporary Discoveries auction, showcasing Bitcoin art at a premier auction house.",
    link: "https://www.sothebys.com/en/buy/auction/2025/contemporary-discoveries-2/chamber-of-reflection-sin-city"
  },
  {
    title: "Ordinals Spotlight: Montreal by Lemonhaze",
    platform: "Gamma",
    caption: "Feature article highlighting the Montreal collection and its significance in the Ordinals ecosystem.",
    link: "https://blog.gamma.io/ordinals-spotlight-montreal-by-lemonhaze"
  },
  {
    title: "Best Before - Launching with Signals",
    platform: "Spotify",
    caption: "Beyond the Canvas podcast episode exploring the Best Before project and its unique concept of art with a lifespan.",
    link: "https://open.spotify.com/episode/4HJQmRVRv1WocxTqbn9x2p?si=d540691ee192446a"
  },
  {
    title: "Gamma Partner Artist Interview: Lemonhaze",
    platform: "Spotify",
    caption: "Beyond the Canvas podcast episode featuring Lemonhaze as a Gamma Partner Artist discussing the artistic journey and Bitcoin Ordinals.",
    link: "https://open.spotify.com/episode/3DXMP94HgloXOylpkVHpA1?si=tRgxw0AUS9yUFuK6KnPLJg"
  },
  {
    title: "Best Before on Signals",
    platform: "Signals.art",
    caption: "Art with a best-before date: born sealed at inscription, unsealed by its collector, and aging on block time.",
    link: "https://signals.art/project/best-before"
  },
  {
    title: "The Weekly Stack: Another Sotheby's Curation by Gamma",
    platform: "Gamma",
    caption: "Gamma's weekly newsletter featuring Lemonhaze's work curated into Sotheby's Contemporary Discoveries auction.",
    link: "https://newsletter.gamma.io/p/the-weekly-stack-another-sothebys"
  },
  {
    title: "Signed Prints Session — ft. Hosoi",
    platform: "X",
    caption: "Footage of Lemonhaze's Hosoi 1/1s Signed Prints session in Saigon, Vietnam. (May 2025)",
    link: "https://x.com/Ordinals10K/status/1925926852297699741?s=20"
  },
  {
    title: "Art on Bitcoin: Using Ordinals Interview",
    platform: "YouTube",
    caption: "Video interview exploring the technical and creative aspects of creating art on Bitcoin.",
    link: "https://www.youtube.com/watch?v=xq1CI67l5sw"
  },
  {
    title: "Sotheby's Auction Announcement",
    platform: "X",
    caption: "Official announcement of Lemonhaze's work featured in Sotheby's Contemporary Discoveries auction.",
    link: "https://x.com/Ordinals10K/status/1944434474667978923?s=20"
  },
  {
    title: "Good Night Signed Prints Session",
    platform: "X",
    caption: "Footage from Lemonhaze's Good Night signed print session in Saigon, Vietnam (August 2025).",
    link: "https://x.com/Ordinals10K/status/1960606032675434976?s=20"
  },
  {
    title: "Solo Exhibition Highlight",
    platform: "X",
    caption: "Solo exhibition highlight at Suburbs Gallery in Montreal, curated by Gamma.",
    link: "https://x.com/Ordinals10K/status/1954488374007599218?s=20"
  },
  {
    title: "Interview with Sophie from Fabled",
    platform: "X",
    caption: "Interview with Sophie from Fabled about Lemonhaze's art practice.",
    link: "https://x.com/Ordinals10K/status/1843648515911888935?s=20"
  },
  {
    title: "Latest Collection Update",
    platform: "X",
    caption: "Best Before thread update covering key moments from Lemonhaze x ORDINALLY's collection lifecycle.",
    link: "https://x.com/Ordinals10K/status/2007162702469230886?s=20"
  },
  {
    title: "Bitcoin Artist Interview: Lemonhaze",
    platform: "Apple Podcasts",
    caption: "In-depth conversation about the artistic process and vision behind Bitcoin Ordinals art.",
    link: "https://podcasts.apple.com/us/podcast/bitcoin-artist-interview-lemonhaze/id1529530113?i=1000626605209"
  },
  {
    title: "Best Before Collection Data",
    platform: "CoinGecko",
    caption: "Market data and analytics for the Best Before collection.",
    link: "https://www.coingecko.com/en/nft/best-before-by-lemonhaze-x-ordinally"
  },
  {
    title: "Manufactured Collection",
    platform: "Forbes",
    caption: "Featured in Forbes Digital Assets NFT coverage.",
    link: "https://www.forbes.com/digital-assets/nfts/manufactured-by-lemonhaze-manufactured-by-lemonhaze/"
  },
  {
    title: "Blood, Lemon & Tango (Collector Display)",
    platform: "X",
    caption: "Collector footage of Blood, Lemon & Tango framed with a SATCHIP.",
    link: "https://x.com/Ordinals10K/status/1687632640290238476?s=20"
  }
];
