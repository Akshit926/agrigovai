import type { Lang } from "./i18n";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SCHEME_KB: Record<string, Record<string, string>> = {
  "PM-KISAN": {
    en: "PM Kisan Samman Nidhi provides ₹6,000/year to small & marginal farmers in 3 installments. Eligibility: Own less than 2 hectares, no government job in family, not an income tax payer. Documents needed: Aadhaar, Land Record (7/12), Bank Passbook.",
    hi: "PM किसान सम्मान निधि छोटे और सीमांत किसानों को 3 किस्तों में ₹6,000/वर्ष प्रदान करती है। पात्रता: 2 हेक्टेयर से कम भूमि, परिवार में कोई सरकारी नौकरी नहीं। दस्तावेज़: आधार, भूमि रिकॉर्ड (7/12), बैंक पासबुक।",
    mr: "PM किसान सन्मान निधी लहान व अल्पभूधारक शेतकऱ्यांना 3 हप्त्यांमध्ये ₹6,000/वर्ष देते. पात्रता: 2 हेक्टरपेक्षा कमी जमीन, कुटुंबात सरकारी नोकरी नाही. कागदपत्रे: आधार, जमीन नोंद (7/12), बँक पासबुक.",
  },
  "PMFBY": {
    en: "Pradhan Mantri Fasal Bima Yojana provides crop insurance against natural calamities, pests and disease. Premium: 2% for Kharif, 1.5% for Rabi. Documents: Aadhaar, Land Record, Sowing Certificate, Bank Details.",
    hi: "PMFBY प्राकृतिक आपदाओं, कीटों और रोगों के खिलाफ फसल बीमा प्रदान करती है। प्रीमियम: खरीफ 2%, रबी 1.5%। दस्तावेज़: आधार, भूमि रिकॉर्ड, बुवाई प्रमाणपत्र, बैंक विवरण।",
    mr: "PMFBY नैसर्गिक आपत्ती, कीटक आणि रोगांपासून पीक विमा प्रदान करते. प्रीमियम: खरीप 2%, रब्बी 1.5%. कागदपत्रे: आधार, जमीन नोंद, पेरणी प्रमाणपत्र, बँक तपशील.",
  },
  "PMKSY": {
    en: "PM Krishi Sinchayee Yojana provides subsidies for drip and sprinkler irrigation systems to improve water use efficiency. Subsidy: up to 55% for small farmers. Documents: Aadhaar, Land Record, Equipment Quotation.",
    hi: "PMKSY ड्रिप और स्प्रिंकलर सिंचाई प्रणालियों के लिए सब्सिडी प्रदान करती है। सब्सिडी: छोटे किसानों के लिए 55% तक। दस्तावेज़: आधार, भूमि रिकॉर्ड, उपकरण कोटेशन।",
    mr: "PMKSY ठिबक आणि तुषार सिंचन प्रणालींसाठी सबसिडी प्रदान करते. सबसिडी: लहान शेतकऱ्यांसाठी 55% पर्यंत. कागदपत्रे: आधार, जमीन नोंद, उपकरण कोटेशन.",
  },
  "SHC": {
    en: "Soil Health Card Scheme provides free soil testing and nutrient recommendations every 2 years. It helps farmers optimize fertilizer use. Documents: Aadhaar, Land Record, Previous Soil Health Card (if any).",
    hi: "SHC हर 2 वर्ष में मुफ्त मृदा परीक्षण और पोषक तत्व सिफारिशें प्रदान करती है। दस्तावेज़: आधार, भूमि रिकॉर्ड, पिछला मृदा स्वास्थ्य कार्ड।",
    mr: "SHC दर 2 वर्षांनी मोफत माती चाचणी आणि पोषक तत्व शिफारसी प्रदान करते. कागदपत्रे: आधार, जमीन नोंद, मागील माती आरोग्य पत्रिका.",
  },
  "KCC": {
    en: "Kisan Credit Card provides short-term credit for crop cultivation at concessional interest rate of 4% (with timely repayment). Credit limit based on land and crop. Documents: Aadhaar, Land Record, Bank Statement, Photo.",
    hi: "KCC 4% ब्याज दर पर फसल उत्पादन के लिए अल्पकालिक ऋण प्रदान करता है। दस्तावेज़: आधार, भूमि रिकॉर्ड, बैंक स्टेटमेंट, फोटो।",
    mr: "KCC 4% व्याज दराने पीक लागवडीसाठी अल्पमुदत कर्ज प्रदान करते. कागदपत्रे: आधार, जमीन नोंद, बँक स्टेटमेंट, फोटो.",
  },
  "RKVY": {
    en: "Rashtriya Krishi Vikas Yojana provides grants for farm infrastructure, equipment and post-harvest processing. Subsidy varies by project type. Documents: Aadhaar, Land Record, Project Proposal, Quotations.",
    hi: "RKVY कृषि बुनियादी ढांचे, उपकरण और कटाई उपरांत प्रसंस्करण के लिए अनुदान प्रदान करती है। दस्तावेज़: आधार, भूमि रिकॉर्ड, परियोजना प्रस्ताव, कोटेशन।",
    mr: "RKVY शेती पायाभूत सुविधा, उपकरणे आणि काढणीपश्चात प्रक्रियेसाठी अनुदान प्रदान करते. कागदपत्रे: आधार, जमीन नोंद, प्रकल्प प्रस्ताव, कोटेशन.",
  },
};

const FAQ: { patterns: string[]; answer: Record<string, string> }[] = [
  {
    patterns: ["how to apply", "apply scheme", "application process", "kaise apply", "अर्ज कसा"],
    answer: {
      en: "To apply: 1) Go to 'Apply for Scheme' 2) Select a scheme 3) Fill in land & crop details 4) Answer eligibility questions 5) Upload required documents 6) Submit. Our AI will review your application instantly!",
      hi: "आवेदन करने के लिए: 1) 'योजना के लिए आवेदन' पर जाएं 2) योजना चुनें 3) भूमि और फसल विवरण भरें 4) पात्रता प्रश्नों का उत्तर दें 5) दस्तावेज़ अपलोड करें 6) सबमिट करें।",
      mr: "अर्ज करण्यासाठी: 1) 'योजनेसाठी अर्ज करा' वर जा 2) योजना निवडा 3) जमीन आणि पीक तपशील भरा 4) पात्रता प्रश्नांची उत्तरे द्या 5) कागदपत्रे अपलोड करा 6) सबमिट करा.",
    },
  },
  {
    patterns: ["document", "documents required", "kya chahiye", "कागदपत्रे"],
    answer: {
      en: "Common documents needed: Aadhaar Card, Land Record (7/12 Extract), Bank Passbook. Some schemes need additional documents like Sowing Certificate (PMFBY) or Equipment Quotation (PMKSY). Check each scheme's requirements in the application form.",
      hi: "सामान्य दस्तावेज़: आधार कार्ड, भूमि रिकॉर्ड (7/12 उतारा), बैंक पासबुक। कुछ योजनाओं को अतिरिक्त दस्तावेज़ चाहिए। आवेदन फॉर्म में प्रत्येक योजना की आवश्यकताएं देखें।",
      mr: "सामान्य कागदपत्रे: आधार कार्ड, जमीन नोंद (7/12 उतारा), बँक पासबुक. काही योजनांना अतिरिक्त कागदपत्रे लागतात. अर्ज फॉर्ममध्ये प्रत्येक योजनेच्या आवश्यकता तपासा.",
    },
  },
  {
    patterns: ["status", "track", "check application", "kahan tak", "स्थिती"],
    answer: {
      en: "Track your applications: Go to 'My Applications' to see the status of each application. Statuses include: Submitted, Under Review, Field Verified, Approved, or Rejected. You'll also get notifications for updates.",
      hi: "अपने आवेदन ट्रैक करें: प्रत्येक आवेदन की स्थिति देखने के लिए 'मेरे आवेदन' पर जाएं। स्थिति: सबमिट, समीक्षा में, फील्ड सत्यापित, स्वीकृत या अस्वीकृत।",
      mr: "तुमचे अर्ज ट्रॅक करा: प्रत्येक अर्जाची स्थिती पाहण्यासाठी 'माझे अर्ज' वर जा. स्थिती: सबमिट, पुनरावलोकनात, फील्ड सत्यापित, मंजूर किंवा नाकारलेले.",
    },
  },
  {
    patterns: ["grievance", "complaint", "problem", "shikayat", "तक्रार"],
    answer: {
      en: "To file a grievance: Go to 'File Grievance', select a category, answer follow-up questions, and describe your issue. Our AI will classify and prioritize it for the right officer.",
      hi: "शिकायत दर्ज करने के लिए: 'शिकायत दर्ज करें' पर जाएं, श्रेणी चुनें, प्रश्नों का उत्तर दें और अपनी समस्या बताएं।",
      mr: "तक्रार नोंदवण्यासाठी: 'तक्रार नोंदवा' वर जा, श्रेणी निवडा, प्रश्नांची उत्तरे द्या आणि तुमची समस्या सांगा.",
    },
  },
  {
    patterns: ["eligible", "suitable", "which scheme", "konsi yojana", "कोणती योजना"],
    answer: {
      en: "To find suitable schemes: Tell me about your land size, crop, and location. Generally:\n• Land < 2 hectares → PM-KISAN\n• Need crop insurance → PMFBY\n• Need irrigation → PMKSY\n• Need soil testing → SHC\n• Need credit → KCC\n• Farm infrastructure → RKVY",
      hi: "उपयुक्त योजनाएँ खोजने के लिए मुझे अपनी भूमि, फसल और स्थान बताएं:\n• भूमि < 2 हेक्टेयर → PM-KISAN\n• फसल बीमा → PMFBY\n• सिंचाई → PMKSY\n• मृदा परीक्षण → SHC\n• ऋण → KCC\n• बुनियादी ढांचा → RKVY",
      mr: "योग्य योजना शोधण्यासाठी मला तुमची जमीन, पीक आणि स्थान सांगा:\n• जमीन < 2 हेक्टर → PM-KISAN\n• पीक विमा → PMFBY\n• सिंचन → PMKSY\n• माती चाचणी → SHC\n• कर्ज → KCC\n• पायाभूत सुविधा → RKVY",
    },
  },
  {
    patterns: ["hello", "hi", "hey", "namaste", "namaskar", "नमस्ते", "नमस्कार"],
    answer: {
      en: "Hello! I'm KrishiMitra AI, your agriculture assistant. How can I help you today? You can ask about schemes, documents, application status, or any farming-related query!",
      hi: "नमस्ते! मैं कृषिमित्र AI हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ? योजनाओं, दस्तावेज़ों, या आवेदन स्थिति के बारे में पूछें!",
      mr: "नमस्कार! मी कृषिमित्र AI आहे. आज मी तुम्हाला कशी मदत करू शकतो? योजना, कागदपत्रे किंवा अर्जाच्या स्थितीबद्दल विचारा!",
    },
  },
];

export function getChatResponse(message: string, lang: Lang): string {
  const lower = message.toLowerCase();

  // Check scheme-specific queries
  for (const [code, info] of Object.entries(SCHEME_KB)) {
    if (lower.includes(code.toLowerCase()) || lower.includes(code.replace("-", " ").toLowerCase())) {
      return info[lang] || info.en;
    }
  }

  // Check FAQ patterns
  for (const faq of FAQ) {
    if (faq.patterns.some((p) => lower.includes(p))) {
      return faq.answer[lang] || faq.answer.en;
    }
  }

  // Scheme recommendation based on keywords
  if (lower.includes("small") || lower.includes("marginal") || lower.includes("छोटा") || lower.includes("लहान")) {
    return SCHEME_KB["PM-KISAN"][lang] || SCHEME_KB["PM-KISAN"].en;
  }
  if (lower.includes("insurance") || lower.includes("bima") || lower.includes("विमा")) {
    return SCHEME_KB["PMFBY"][lang] || SCHEME_KB["PMFBY"].en;
  }
  if (lower.includes("water") || lower.includes("irrigation") || lower.includes("pani") || lower.includes("पाणी") || lower.includes("सिंचन")) {
    return SCHEME_KB["PMKSY"][lang] || SCHEME_KB["PMKSY"].en;
  }
  if (lower.includes("soil") || lower.includes("mitti") || lower.includes("माती")) {
    return SCHEME_KB["SHC"][lang] || SCHEME_KB["SHC"].en;
  }
  if (lower.includes("credit") || lower.includes("loan") || lower.includes("कर्ज")) {
    return SCHEME_KB["KCC"][lang] || SCHEME_KB["KCC"].en;
  }

  // Default response
  const defaults: Record<string, string> = {
    en: "I can help you with:\n\n• **Scheme info** — Ask about PM-KISAN, PMFBY, PMKSY, SHC, KCC, or RKVY\n• **Eligibility** — Tell me your land size and crop to find suitable schemes\n• **Application help** — How to apply, documents needed, track status\n• **Grievances** — How to file complaints\n\nTry asking: \"Which scheme is best for me?\" or \"What documents do I need for PM-KISAN?\"",
    hi: "मैं मदद कर सकता हूँ:\n\n• **योजना जानकारी** — PM-KISAN, PMFBY, PMKSY, SHC, KCC, या RKVY के बारे में पूछें\n• **पात्रता** — अपनी भूमि और फसल बताएं\n• **आवेदन सहायता** — कैसे आवेदन करें, दस्तावेज़, स्थिति\n• **शिकायतें** — कैसे दर्ज करें\n\nपूछें: \"मेरे लिए कौन सी योजना सही है?\"",
    mr: "मी मदत करू शकतो:\n\n• **योजना माहिती** — PM-KISAN, PMFBY, PMKSY, SHC, KCC, किंवा RKVY बद्दल विचारा\n• **पात्रता** — तुमची जमीन आणि पीक सांगा\n• **अर्ज मदत** — कसा अर्ज करावा, कागदपत्रे, स्थिती\n• **तक्रारी** — कशा नोंदवाव्या\n\nविचारा: \"माझ्यासाठी कोणती योजना योग्य आहे?\"",
  };
  return defaults[lang] || defaults.en;
}

export function getAIImprovedText(text: string, lang: Lang): string {
  if (!text.trim()) return text;
  // Rule-based text improvement
  let improved = text.trim();
  improved = improved.charAt(0).toUpperCase() + improved.slice(1);
  if (!/[.!?।]$/.test(improved)) improved += ".";
  improved = improved.replace(/\s{2,}/g, " ");
  improved = improved.replace(/\bi\b/g, "I");
  improved = improved.replace(/dont/gi, "don't");
  improved = improved.replace(/cant/gi, "can't");
  improved = improved.replace(/wont/gi, "won't");
  improved = improved.replace(/didnt/gi, "didn't");
  improved = improved.replace(/hasnt/gi, "hasn't");
  improved = improved.replace(/havent/gi, "haven't");
  improved = improved.replace(/isnt/gi, "isn't");
  improved = improved.replace(/wasnt/gi, "wasn't");
  improved = improved.replace(/recieved/gi, "received");
  improved = improved.replace(/goverment/gi, "government");
  improved = improved.replace(/subsidy/gi, "subsidy");
  improved = improved.replace(/agricultur\b/gi, "agriculture");
  improved = improved.replace(/pament/gi, "payment");
  return improved;
}
