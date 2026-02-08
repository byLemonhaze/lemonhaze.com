import { allArtworks } from './data.js';

const keywords = [
    "BEST BEFORE",
    "Chanchanok",
    "Chamber of Reflection",
    "Minute, papillon",
    "Ma ville en quatre temps",
    "Hosoi",
    "Lost in Bangkok",
    "Paysage",
    "Deprivation",
    "Berlin to Saigon",
    "Games #16"
];

// Helper to check for BEST BEFORE numbers
const bbNumbers = ["133", "169", "31", "64", "5", "92"];

console.log("--- SEARCH RESULTS ---");

allArtworks.forEach(item => {
    // Check keywords
    keywords.forEach(k => {
        if ((item.name && item.name.toLowerCase().includes(k.toLowerCase())) ||
            (item.collection && item.collection.toLowerCase().includes(k.toLowerCase()))) {
            console.log(`MATCH [${k}]: Name: "${item.name}", Col: "${item.collection}", ID: "${item.id}"`);
        }
    });

    // Special check for Best Before numbers
    if (item.collection === "BEST BEFORE" || item.name.includes("BEST BEFORE")) {
        bbNumbers.forEach(num => {
            // Check if name contains #133 or just 133 with boundaries
            if (item.name.includes(`#${num}`) || item.name.includes(` ${num} `) || item.name.endsWith(` ${num}`)) {
                console.log(`MATCH [BEST BEFORE ${num}]: Name: "${item.name}", ID: "${item.id}"`);
            }
        });
    }
});
