// Presentation policy only: these inscriptions remain HTML in metadata and notes.
// Use the same still image as the pre-November collection grid in split/solo view.
// Do not infer this from text/html: motion, 3D and evolving works stay live.
const STATIC_PREVIEW_IDS = new Set([
    '3ab2302560a09b30e35b9311bff5554e4d0f055a2ca3eb7dd969f868281b29f9i0', // On Paper
    '5ae16faba93684887efc960f26d865265b2669e389fd6552e3399f74fa61042bi0', // Mostly Art
    '0fc76657166d0dfab82ff8d5f97a3c785d817055c3a989b8b8b4fcdb0effbee7i0', // Smooth Sailor
    '0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0', // Paint Engine v0
    'f93a9e3655a0d9531871248b9a3e6b78c1aaee24c76265247a3172b16bdbc15di0', // Paint Engine v0.1 [Grossier]
    '054eb44d57f5bd34a9153c5a605e32710fbc36912945db0fc91693526e7c9201i0', // Paint Engine v0.2 [O-Swirl]
    'c850f4853a469ed0758309006b861e3f6bac830126d25695b744d019fcb903b6i0', // Debt Sentence
    '27d6da8779b0cbc1ca5fb565ec57a4168c137a99fde572f1f22cf6673f6fc524i0', // Smoke Break
    '0b1c283e4fe2637a881639a2a715348c56759840f06f7e1142652da60a4a2d4ei0', // Paint Engine v0.3 [Jackie's Sample]
    '723f548d5a05ff53075cfc3be76587040bef3cc129e95b423f01611c21d8122di0', // Paint Engine v0.3.1 [Max Colors]
    '0109e594769bd8c50e1f8fc15e80db0b93188d881bf2a258c7a88dcbe609b391i0', // Paint Engine v0.6 [Wild Patch]
    '36e74fdb856a69281982f9340739aa10863bbd19da8d7e8fb183b9b9284323f8i0', // Paint Engine v0.8 [Under Construction]
    '795a40ea70f17c9de70035395df51dce9510999f0c412bf5068c11115456f1c1i0', // Paint Engine v0.9 [Chasing The Dragon]
    '7a6d380af9adc2b7b70ac0cea5d054ab8c69a0d7d0f612e66870213276dd4349i0', // Paint Engine v1.03 [Faux-Chat]
    '99132e479d4c64dcb8267e5a04b959396e90f8f6628c8741eb39f379e6e40840i0', // Paint Engine v1.04 [Mon Enfant]
    '2cbef7662c4e6c84457e57c9fd9f04fc585956cf66302ba01862c73e53e1e75di0', // Paint Engine v1.05 [Hidden Gems & Blank Pages]
    'c8d790c42ce1a43c02acf15114d4053c1c9f086dc2856ebd3031ce268f5d58dbi0', // Paint Engine v1.07 [Passe-Partout]
    '773bcd4be1b8a4a9f3e9c427fb4264066e2043b56a9ecb22c8ebcf2192fda561i0', // Paint Engine v1.08 [Bam]
]);

export const prefersStaticArtworkPreview = work => STATIC_PREVIEW_IDS.has(work?.id)
    || /^Paint Engine\b/i.test(work?.name || '');

// Bam is encrypted and has no public CDN PNG. Retain the saved preview instead
// of requesting a missing image or starting its unlock interface in the viewer.
export const staticArtworkPreviewOverride = work => work?.id === '773bcd4be1b8a4a9f3e9c427fb4264066e2043b56a9ecb22c8ebcf2192fda561i0'
    ? `/previews/immersive/${work.id}.webp` : null;
