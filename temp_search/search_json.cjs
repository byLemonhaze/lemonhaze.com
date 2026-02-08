const fs = require('fs');

const dataVal = JSON.parse(fs.readFileSync('/Users/lemonhaze/Desktop/COMBU/provenance.json', 'utf8'));

const keywords = [
    "Grossier",
    "Wild Patch",
    "Under Construction",
    "Paint Engine"
];

const bbNumbers = ["303", "233", "292", "290", "281", "223", "139", "94", "86", "79", "77", "32"];

console.log("--- SEARCH RESULTS ---");

// Helper to check Best Before
const isBestBefore = (item) => {
    return item.name && item.name.toUpperCase().includes("BEST BEFORE");
};

dataVal.forEach(item => {
    // 1. Keyword Check
    const str = JSON.stringify(item).toLowerCase();
    keywords.forEach(k => {
        if (str.includes(k.toLowerCase())) {
            console.log(`MATCH [${k}]: Name: "${item.name}", Col: "${item.collection}", ID: "${item.id}"`);
        }
    });

    // 2. Best Before Numbers
    if (isBestBefore(item)) {
        bbNumbers.forEach(num => {
            // Check for "Nº" + num
            if (item.name.includes(`Nº${num}`)) {
                console.log(`MATCH [BEST BEFORE ${num}]: Name: "${item.name}", ID: "${item.id}"`);
            }
        });
    }
});
