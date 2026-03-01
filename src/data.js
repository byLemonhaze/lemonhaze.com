
const PROVENANCE_URL = "https://cdn.lemonhaze.com/assets/assets/provenance.json";
const BB_COLLECTION_URL = "https://bestbefore.space/magic_eden_collection.json";

export async function fetchProvenance() {
  try {
    const response = await fetch(PROVENANCE_URL);
    if (!response.ok) throw new Error("Failed to fetch provenance");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching provenance:", error);
    return [];
  }
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
  Lemonhaze is a Montreal born and Puerto Escondido based self-taught artist who merges his background in music, entrepreneurship, and expressive writing into an explorative digital art journey.
</p>
<p class="mb-4 text-white/90 font-light leading-relaxed">
  Continually experimenting with the tools of his time, such as - laptop, JavaScript, AI, and various digital drawing software - Lemonhaze craft moments with pixels.
</p>
<p class="mb-4 text-white/90 font-light leading-relaxed">
  His practice is iterative, spontaneous, and modular, touching a wide range of interests from journaling to physical mediums, while remaining anchored in the development of his personal code-based paint engine.
</p>
<p class="mb-4 text-white/90 font-light leading-relaxed">
  His art acts both as a means of escape and as a tangible memento, often deeply personal - capturing fragments of lived experience, emotion, and time.
  With a deep appreciation for the lasting nature of the Bitcoin blockchain, he has chosen it as the foundation for his poetic and visual expressions.
</p>
<p class="mb-0 text-white/90 font-light leading-relaxed">
  Lemonhaze’s singular and offbeat journey as an artist, without the constraints of traditional art education or industry expectations - exudes a raw individuality, with each piece serving as a modest reflection of his evolving perspective and soul.
</p>
`;

export const CAREER_HIGHLIGHTS_ITEMS = [
  { text: "·Solo highlight 'Montreal by Lemonhaze' curated by Gamma at Suburbs Gallery in Montreal (August 2025)", link: "https://blog.gamma.io/ordinals-spotlight-montreal-by-lemonhaze/" },
  { text: "·Sotheby's Contemporary Discoveries Auction in New York - Curated by Gamma (February 2025)", link: "https://www.sothebys.com/en/buy/auction/2025/contemporary-discoveries-2/chamber-of-reflection-sin-city" },
  "·Bitcoin Village at NFT Paris in Paris (February 2025)",
  "·The Parthenon in Nashville (July 2024)",
  "·Ordinals LATAM in Mexico City/Monterrey/San Cristobal (June 2024)",
  "·Cinco de Monero in San Francisco (May 2024)",
  "·Ordinals Asia in Hong Kong (May 2024)",
  "·Cypherpunk Lab in San Francisco (February 2024)",
  "·Art Basel in Miami (December 2023)",
  "·Inscribing Atlantis in Amsterdam (October 2023)",
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
  { name: '1 of 1s (2026)', year: 2026, inscribed: 7, circulating: 7 },
];

export const ETH_SUPPLY_DATA = [
  { name: 'Boulogne Editions', platform: 'Rarible', year: 2020, count: 80 },
  { name: 'Rich Bean Editions', platform: 'Rarible', year: 2020, count: 8 },
  { name: 'Bell Street Style', platform: 'Rarible', year: 2020, count: 1 },
  { name: "Murky by John D'Oeufs", platform: 'Rarible', year: 2020, count: 1 },
  { name: 'Marilyn Monero', platform: 'OpenSea', year: 2021, count: 1 },
];

export const MARKET_LINKS = {
  'BEST BEFORE': {
    me: 'https://magiceden.io/ordinals/marketplace/best-before-by-lemonhaze-x-ordinally',
    gamma: 'https://gamma.io/ordinals/collections/best-before/items'
  },
  'Manufactured': {
    me: 'https://magiceden.io/ordinals/marketplace/manufactured-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/manufactured/items'
  },
  'Satoshi CC Edition': {
    me: 'https://magiceden.io/ordinals/marketplace/counterfeit-cards?selectedAttributes=%7B%22Artist%22%3A%5B%7B%22traitType%22%3A%22Artist%22%2C%22value%22%3A%22Lemonhaze%22%2C%22label%22%3A%22Lemonhaze%22%2C%22count%22%3A111%2C%22floor%22%3A%220.0069%22%2C%22image%22%3A%22https%3A%2F%2Fimg-cdn.magiceden.dev%2Frs%3Afill%3A400%3A0%3A0%2Fplain%2Fhttps%253A%252F%252Ford-mirror.magiceden.dev%252Fcontent%252Fff15d59bd8080f441b44833cddb63178514e203a1b6470e9403ef2ccc24042c8i0%22%2C%22total%22%3A111%2C%22listedPercentage%22%3A%22%22%7D%5D%7D',
    gamma: 'https://gamma.io/ordinals/collections/counterfeit-cards/items?a.Artist=Lemonhaze'
  },
  'Portrait 2490': {
    me: 'https://magiceden.io/ordinals/marketplace/portrait-2490',
    gamma: 'https://gamma.io/ordinals/collections/portrait-2490-by-lemonhaze/items'
  },
  '1/1s (2024)': {
    me: 'https://magiceden.io/ordinals/marketplace/1on1-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/1-1-2024-by-lemonhaze/items'
  },
  'Deprivation prints': {
    me: 'https://magiceden.io/ordinals/marketplace/deprivation-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/prints/cllo44w190001jr0fajdfe7cc/details'
  },
  'Mirage prints': {
    me: 'https://magiceden.io/ordinals/marketplace/mirage-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/prints/clr14i0q90003l60fw2205qjr/details'
  },
  'Trilogy prints': {
    me: 'https://magiceden.io/ordinals/marketplace/prints-trilogy-by-lemonhaze',
    gamma: 'https://gamma.io/explore/prints?creator=clkrid54y0000l50fs5qmsbpp'
  },
  '1/1s (2025)': {
    me: 'https://magiceden.io/ordinals/marketplace/1on1-2025-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/1-1-2025-by-lemonhaze/items'
  },
  'Gentlemen': {
    me: 'https://magiceden.io/ordinals/marketplace/gentlemen-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/gentlemen-by-lemonhaze/items'
  },
  'Miscellaneous': {
    me: 'https://magiceden.io/ordinals/marketplace/miscelleneous-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/miscellaneous-by-lemonhaze/items'
  },
  'Games': {
    me: 'https://magiceden.io/ordinals/marketplace/games-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/games-manufactured/items'
  },
  'Minute, papillon! Edition': {
    me: 'https://magiceden.io/ordinals/marketplace/minute-papillon-editions-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/minute-papillon/items'
  },
  'The Artifacts': {
    me: 'https://magiceden.io/ordinals/marketplace/artifacts-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/theartifacts/items'
  },
  'Cypherville': {
    me: 'https://magiceden.io/ordinals/marketplace/cypherville',
    gamma: 'https://gamma.io/ordinals/collections/cypherville-by-lemonhaze/items'
  },
  'Old Fashioned': {
    me: 'https://magiceden.io/ordinals/marketplace/old-fashioned-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/old-fashioned-by-lemonhaze/items'
  },
  'Volatility': {
    me: 'https://magiceden.io/ordinals/marketplace/volatility-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/volatility-by-lemonhaze/items'
  },
  'Provenance': {
    me: 'https://magiceden.io/ordinals/marketplace/provenance-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/provenance/items'
  },
  'La Tentation': {
    me: 'https://magiceden.io/ordinals/marketplace/tentation-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/la-tentation-by-lemonhaze/items'
  },
  'Deville': {
    me: 'https://magiceden.io/ordinals/marketplace/deville-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/deville-by-lemonhaze/items'
  },
  'Text & Unclassified': {
    me: 'https://magiceden.io/ordinals/item-details/b8acd0a45be8663deea56e28ab831f067ceec54ef68c416b812e17266acf1eddi0',
    gamma: 'https://gamma.io/ordinals/inscriptions/b8acd0a45be8663deea56e28ab831f067ceec54ef68c416b812e17266acf1eddi0'
  },
  'Generative Composition': {
    me: 'https://magiceden.io/ordinals/marketplace/generative-composition-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/generative-composition-by-lemonhaze/items'
  },
  'Lotus': {
    me: 'https://magiceden.io/ordinals/marketplace/lotus-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/lotus-by-lemonhaze/items'
  },
  'Split collectible': {
    me: 'https://magiceden.io/ordinals/marketplace/cypherville-split-collectibles-by-lemonhaze'
  },
  'Untitled': {
    me: 'https://magiceden.io/ordinals/marketplace/untitled-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/untitled/items'
  },
  'Mending Fragments': {
    me: 'https://magiceden.io/ordinals/marketplace/mending-fragments-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/mending-fragments-by-lemonhaze/items'
  },
  'Berlin': {
    me: 'https://magiceden.io/ordinals/marketplace/berlin-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/berlin-by-lemonhaze/items'
  },
  'Oaxaca': {
    me: 'https://magiceden.io/ordinals/marketplace/oaxaca-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/oaxaca-by-lemonhaze/items'
  },
  'Polaroid': {
    me: 'https://magiceden.io/ordinals/marketplace/polaroid-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/polaroid-by-lemonhaze/items'
  },
  'Montreal': {
    me: 'https://magiceden.io/ordinals/marketplace/montreal-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/montreal/items'
  },
  'Candidly Yours': {
    me: 'https://magiceden.io/ordinals/marketplace/candidly-yours-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/candidly-yours/items'
  },
  'Discography': {
    me: 'https://magiceden.io/ordinals/marketplace/discography-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/discography-by-lemonhaze/items'
  },
  'L’Orphelinat': {
    me: 'https://magiceden.io/ordinals/marketplace/orphelinat-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/LOrphelinat/items'
  },
  'Unregulated Minds': {
    me: 'https://magiceden.io/ordinals/marketplace/unregulated-minds-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/unregulated-minds/items'
  },
  'Framed': {
    me: 'https://magiceden.io/ordinals/marketplace/framed',
    gamma: 'https://gamma.io/ordinals/collections/framed-ny-lemonhaze/items'
  },
  'Le Bar a Tapas': {
    me: 'https://magiceden.io/ordinals/marketplace/bar-tapas-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/le-bar-a-tapas-by-lemonhaze/items'
  },
  'World Tour': {
    me: 'https://magiceden.io/ordinals/marketplace/world-tour-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/world-tour-by-lemonhaze/items'
  },
  'Ma ville en quatre temps': {
    me: 'https://magiceden.io/ordinals/marketplace/ma-ville-en-quatre-temps-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/ma-ville-en-quatre-temps%20/items'
  },
  'Tori no Roji': {
    me: 'https://magiceden.io/ordinals/marketplace/tori_no_roji_by_lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/tori-no-roji/items'
  },
  'Little Get Away': {
    me: 'https://magiceden.io/ordinals/marketplace/little-get-away-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/little-get-away/items'
  },
  'Ordinals Summer': {
    me: 'https://magiceden.io/ordinals/marketplace/ordinals-summer-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/ordinals-summer-by-lemonhaze/items'
  },
  'Colors': {
    gamma: 'https://gamma.io/ordinals/collections/colours-by-lemonhaze/items'
  },
  'Cypherville Comics': {
    me: 'https://magiceden.io/ordinals/marketplace/cypherville-comics-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/cypherville-comics-by-lemonhaze/items'
  },
  'Jardin Secret': {
    me: 'https://magiceden.io/ordinals/marketplace/jardin-secret-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/jardin-secret-by-lemonhaze/items'
  },
  'Tad Small': {
    me: 'https://magiceden.io/ordinals/marketplace/tad-small-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/tad-small-by-lemonhaze/items'
  },
  'Fading': {
    me: 'https://magiceden.io/ordinals/marketplace/fading-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/fading-by-lemonhaze/items'
  },
  'Dark Days': {
    me: 'https://magiceden.io/ordinals/marketplace/dark-days-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/dark-days-by-lemonhaze/items'
  },
  'Bento Box': {
    me: 'https://magiceden.io/ordinals/marketplace/bento-box-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/bento-box-by-lemonhaze/items'
  },
  'Downtown': {
    me: 'https://magiceden.io/ordinals/marketplace/downtown-by-lemonhaze',
    gamma: 'https://gamma.io/ordinals/collections/downtown-by-lemonhaze/items'
  },
  'Eclosion 1/1 - Amsterdam Blooms': {
    me: 'https://magiceden.io/ordinals/item-details/aaf0e314aab67783d7e92b0987b0c34ae610b41f64aa1ff7cae8c4fbeebf9029i0',
    gamma: 'https://gamma.io/ordinals/inscriptions/aaf0e314aab67783d7e92b0987b0c34ae610b41f64aa1ff7cae8c4fbeebf9029i0'
  }
};

export const LINK_OVERRIDES = {
  'BEST BEFORE': 'https://BESTBEFORE.SPACE',
  'Satoshi CC Edition': 'https://magiceden.io/ordinals/marketplace/counterfeit-cards',
  'Satoshi 1/1 - Counterfeit Cards S00 - C08': 'https://magiceden.io/ordinals/marketplace/counterfeit-cards',
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
    title: "Early Ordinals Artwork Showcase",
    platform: "X",
    caption: "Highlighting early contributions to the Bitcoin Ordinals art movement.",
    link: "https://x.com/Ordinals10K/status/1687632640290238476?s=20"
  },
  {
    title: "Collection Feature",
    platform: "X",
    caption: "Showcasing recent collection releases and artistic developments.",
    link: "https://x.com/Ordinals10K/status/1960606032675434976?s=20"
  },
  {
    title: "Artist Spotlight",
    platform: "X",
    caption: "Community spotlight on Lemonhaze's contributions to Bitcoin art.",
    link: "https://x.com/Ordinals10K/status/1954488374007599218?s=20"
  },
  {
    title: "Artwork Announcement",
    platform: "X",
    caption: "New artwork release and collection update.",
    link: "https://x.com/Ordinals10K/status/1843648515911888935?s=20"
  },
  {
    title: "Latest Collection Update",
    platform: "X",
    caption: "Recent announcement and community engagement.",
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
  }
];
