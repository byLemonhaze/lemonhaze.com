
const PROVENANCE_URL = "https://cdn.lemonhaze.com/assets/assets/provenance.json";

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
  Lemonhaze's singular and offbeat journey as an artist, without the constraints of traditional art education or industry expectations - exudes a raw individuality, with each piece serving as a modest reflection of his evolving perspective and soul.
</p>
`;

export const CAREER_HIGHLIGHTS_ITEMS = [
    { text: "·Solo highlight 'Montreal by Lemonhaze' curated by Gamma at Suburbs Gallery in Montreal (August 2025)", link: "https://blog.gamma.io/ordinals-spotlight-montreal-by-lemonhaze/" },
    { text: "·Sotheby's Contemporary Discoveries Auction in New York - Curated by Gamma (February 2025)", link: "https://www.sothebys.com/en/buy/auction/2025/contemporary-discoveries-2/chamber-of-reflection-sin-city" },
    { text: "·Bitcoin Village at NFT Paris in Paris (February 2025)" },
    { text: "·The Parthenon in Nashville (July 2024)" },
    { text: "·Ordinals LATAM in Mexico City/Monterrey/San Cristobal (June 2024)" },
    { text: "·Cinco de Monero in San Francisco (May 2024)" },
    { text: "·Ordinals Asia in Hong Kong (May 2024)" },
    { text: "·Cypherpunk Lab in San Francisco (February 2024)" },
    { text: "·Art Basel in Miami (December 2023)" },
    { text: "·Inscribing Atlantis in Amsterdam (October 2023)" },
    { text: "·Ordinal Summit in Singapore (September 2023)" },
    { text: "·Gamma Partner Artist on Bitcoin (September 2023)" }
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
};
