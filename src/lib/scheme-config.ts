// Per-scheme questions and document requirements

export interface SchemeQuestion {
  id: string;
  label: Record<string, string>;
  type: "checkbox" | "radio" | "select";
  options?: { value: string; label: Record<string, string> }[];
}

export interface SchemeConfig {
  code: string;
  questions: SchemeQuestion[];
  documents: { key: string; label: Record<string, string> }[];
}

const L = (en: string, hi: string, mr: string) => ({ en, hi, mr });

export const SCHEME_CONFIGS: Record<string, SchemeConfig> = {
  "PM-KISAN": {
    code: "PM-KISAN",
    questions: [
      { id: "own_land", label: L("Do you own agricultural land?", "क्या आपके पास कृषि भूमि है?", "तुमच्याकडे शेतजमीन आहे का?"), type: "checkbox" },
      { id: "land_lt_2ha", label: L("Is your land less than 2 hectares?", "क्या आपकी भूमि 2 हेक्टेयर से कम है?", "तुमची जमीन 2 हेक्टरपेक्षा कमी आहे का?"), type: "checkbox" },
      { id: "land_in_name", label: L("Is the land registered in your name?", "क्या भूमि आपके नाम पर पंजीकृत है?", "जमीन तुमच्या नावावर नोंदणीकृत आहे का?"), type: "checkbox" },
      { id: "bank_linked", label: L("Is your bank account linked with Aadhaar?", "क्या आपका बैंक खाता आधार से जुड़ा है?", "तुमचे बँक खाते आधारशी जोडलेले आहे का?"), type: "checkbox" },
      { id: "no_govt_job", label: L("No family member holds a government job?", "कोई परिवार सदस्य सरकारी नौकरी नहीं करता?", "कोणताही कुटुंब सदस्य सरकारी नोकरी करत नाही?"), type: "checkbox" },
      { id: "no_income_tax", label: L("No family member is an income tax payer?", "कोई परिवार सदस्य आयकर दाता नहीं है?", "कोणताही कुटुंब सदस्य आयकरदाता नाही?"), type: "checkbox" },
      { id: "first_time", label: L("Is this your first PM-KISAN application?", "क्या यह आपका पहला PM-KISAN आवेदन है?", "हा तुमचा पहिला PM-KISAN अर्ज आहे का?"), type: "checkbox" },
      { id: "cultivator", label: L("Are you actively cultivating the land?", "क्या आप सक्रिय रूप से भूमि की खेती कर रहे हैं?", "तुम्ही सक्रियपणे जमिनीची शेती करत आहात का?"), type: "checkbox" },
    ],
    documents: [
      { key: "aadhaar", label: L("Aadhaar Card", "आधार कार्ड", "आधार कार्ड") },
      { key: "land_record", label: L("Land Record (7/12 Extract)", "भूमि रिकॉर्ड (7/12)", "जमीन नोंद (7/12 उतारा)") },
      { key: "bank_passbook", label: L("Bank Passbook (first page)", "बैंक पासबुक (पहला पेज)", "बँक पासबुक (पहिले पान)") },
    ],
  },
  "PMFBY": {
    code: "PMFBY",
    questions: [
      { id: "crop_insured", label: L("Is the crop you want to insure notified?", "क्या आप जिस फसल का बीमा चाहते हैं वह अधिसूचित है?", "तुम्हाला विमा हवा असलेले पीक अधिसूचित आहे का?"), type: "checkbox" },
      { id: "sowing_done", label: L("Have you completed sowing for this season?", "क्या आपने इस मौसम की बुवाई पूरी कर ली है?", "या हंगामासाठी पेरणी पूर्ण केली आहे का?"), type: "checkbox" },
      { id: "prior_claims", label: L("Have you made any prior insurance claims?", "क्या आपने पहले कोई बीमा दावा किया है?", "तुम्ही यापूर्वी कोणतेही विमा दावे केले आहेत का?"), type: "checkbox" },
      { id: "kcc_holder", label: L("Do you hold a Kisan Credit Card?", "क्या आपके पास किसान क्रेडिट कार्ड है?", "तुमच्याकडे किसान क्रेडिट कार्ड आहे का?"), type: "checkbox" },
      { id: "season_select", label: L("Select crop season", "फसल का मौसम चुनें", "पीक हंगाम निवडा"), type: "select", options: [
        { value: "kharif", label: L("Kharif", "खरीफ", "खरीप") },
        { value: "rabi", label: L("Rabi", "रबी", "रब्बी") },
        { value: "zaid", label: L("Zaid", "जायद", "उन्हाळी") },
      ]},
      { id: "natural_calamity", label: L("Has your area faced natural calamity recently?", "क्या आपके क्षेत्र में हाल ही में प्राकृतिक आपदा आई है?", "तुमच्या भागात नुकतीच नैसर्गिक आपत्ती आली आहे का?"), type: "checkbox" },
      { id: "premium_aware", label: L("Are you aware of the premium amount?", "क्या आप प्रीमियम राशि से अवगत हैं?", "तुम्हाला प्रीमियम रकमेची माहिती आहे का?"), type: "checkbox" },
      { id: "consent_data", label: L("I consent to share crop data for verification", "मैं सत्यापन के लिए फसल डेटा साझा करने की सहमति देता हूँ", "मी पडताळणीसाठी पीक डेटा सामायिक करण्यास संमती देतो"), type: "checkbox" },
    ],
    documents: [
      { key: "aadhaar", label: L("Aadhaar Card", "आधार कार्ड", "आधार कार्ड") },
      { key: "land_record", label: L("Land Record (7/12 Extract)", "भूमि रिकॉर्ड (7/12)", "जमीन नोंद (7/12 उतारा)") },
      { key: "sowing_cert", label: L("Sowing Certificate", "बुवाई प्रमाण पत्र", "पेरणी प्रमाणपत्र") },
      { key: "bank_account", label: L("Bank Account Details", "बैंक खाता विवरण", "बँक खाते तपशील") },
    ],
  },
  "PMKSY": {
    code: "PMKSY",
    questions: [
      { id: "irrigation_type", label: L("What type of irrigation do you need?", "आपको किस प्रकार की सिंचाई चाहिए?", "तुम्हाला कोणत्या प्रकारची सिंचाई हवी आहे?"), type: "select", options: [
        { value: "drip", label: L("Drip Irrigation", "ड्रिप सिंचाई", "ठिबक सिंचन") },
        { value: "sprinkler", label: L("Sprinkler", "स्प्रिंकलर", "तुषार सिंचन") },
        { value: "micro", label: L("Micro Irrigation", "सूक्ष्म सिंचाई", "सूक्ष्म सिंचन") },
      ]},
      { id: "water_source", label: L("Do you have an existing water source?", "क्या आपके पास मौजूदा जल स्रोत है?", "तुमच्याकडे विद्यमान पाण्याचा स्रोत आहे का?"), type: "checkbox" },
      { id: "power_available", label: L("Is electricity available at your farm?", "क्या आपके खेत में बिजली उपलब्ध है?", "तुमच्या शेतात वीज उपलब्ध आहे का?"), type: "checkbox" },
      { id: "first_subsidy", label: L("Is this your first irrigation subsidy?", "क्या यह आपकी पहली सिंचाई सब्सिडी है?", "ही तुमची पहिली सिंचन सबसिडी आहे का?"), type: "checkbox" },
      { id: "training", label: L("Have you attended any irrigation training?", "क्या आपने कोई सिंचाई प्रशिक्षण लिया है?", "तुम्ही कोणतेही सिंचन प्रशिक्षण घेतले आहे का?"), type: "checkbox" },
      { id: "land_prepared", label: L("Is your land prepared for the system?", "क्या आपकी भूमि सिस्टम के लिए तैयार है?", "तुमची जमीन प्रणालीसाठी तयार आहे का?"), type: "checkbox" },
    ],
    documents: [
      { key: "aadhaar", label: L("Aadhaar Card", "आधार कार्ड", "आधार कार्ड") },
      { key: "land_record", label: L("Land Record (7/12 Extract)", "भूमि रिकॉर्ड (7/12)", "जमीन नोंद (7/12 उतारा)") },
      { key: "quotation", label: L("Equipment Quotation", "उपकरण कोटेशन", "उपकरण कोटेशन") },
    ],
  },
  "SHC": {
    code: "SHC",
    questions: [
      { id: "last_test", label: L("When was your last soil test?", "आपका अंतिम मृदा परीक्षण कब हुआ था?", "तुमची शेवटची माती चाचणी कधी झाली?"), type: "select", options: [
        { value: "never", label: L("Never tested", "कभी नहीं", "कधीच नाही") },
        { value: "1year", label: L("Within 1 year", "1 वर्ष के भीतर", "1 वर्षात") },
        { value: "2year", label: L("1-2 years ago", "1-2 वर्ष पहले", "1-2 वर्षांपूर्वी") },
        { value: "3plus", label: L("More than 2 years", "2 वर्ष से अधिक", "2 वर्षांपेक्षा जास्त") },
      ]},
      { id: "gps_known", label: L("Do you know the GPS coordinates of your field?", "क्या आपको अपने खेत के GPS निर्देशांक पता हैं?", "तुम्हाला तुमच्या शेताचे GPS निर्देशांक माहित आहेत का?"), type: "checkbox" },
      { id: "organic", label: L("Do you practice organic farming?", "क्या आप जैविक खेती करते हैं?", "तुम्ही सेंद्रिय शेती करता का?"), type: "checkbox" },
      { id: "fertilizer_use", label: L("Do you use chemical fertilizers?", "क्या आप रासायनिक उर्वरक उपयोग करते हैं?", "तुम्ही रासायनिक खते वापरता का?"), type: "checkbox" },
      { id: "crop_rotation", label: L("Do you practice crop rotation?", "क्या आप फसल चक्रण करते हैं?", "तुम्ही पीक फेरपालट करता का?"), type: "checkbox" },
      { id: "water_issue", label: L("Any water logging issues in your field?", "क्या आपके खेत में जल भराव की समस्या है?", "तुमच्या शेतात पाणी साचण्याची समस्या आहे का?"), type: "checkbox" },
    ],
    documents: [
      { key: "aadhaar", label: L("Aadhaar Card", "आधार कार्ड", "आधार कार्ड") },
      { key: "land_record", label: L("Land Record (7/12 Extract)", "भूमि रिकॉर्ड (7/12)", "जमीन नोंद (7/12 उतारा)") },
      { key: "prev_shc", label: L("Previous Soil Health Card (if any)", "पिछला मृदा स्वास्थ्य कार्ड (यदि कोई हो)", "मागील माती आरोग्य पत्रिका (असल्यास)") },
    ],
  },
  "KCC": {
    code: "KCC",
    questions: [
      { id: "existing_loans", label: L("Do you have any existing agricultural loans?", "क्या आपके पास कोई मौजूदा कृषि ऋण है?", "तुमच्याकडे कोणतेही विद्यमान कृषी कर्ज आहे का?"), type: "checkbox" },
      { id: "repayment_hist", label: L("Have you defaulted on any previous loans?", "क्या आपने किसी पिछले ऋण पर चूक की है?", "तुम्ही कोणत्याही मागील कर्जावर थकबाकी केली आहे का?"), type: "checkbox" },
      { id: "purpose", label: L("Purpose of credit", "ऋण का उद्देश्य", "कर्जाचा उद्देश"), type: "select", options: [
        { value: "cultivation", label: L("Crop Cultivation", "फसल उत्पादन", "पीक लागवड") },
        { value: "equipment", label: L("Farm Equipment", "कृषि उपकरण", "शेती उपकरणे") },
        { value: "allied", label: L("Allied Activities", "सहयोगी गतिविधियाँ", "संलग्न उपक्रम") },
      ]},
      { id: "bank_preference", label: L("Do you have a preferred bank?", "क्या आपका कोई पसंदीदा बैंक है?", "तुमची कोणतीही पसंतीची बँक आहे का?"), type: "checkbox" },
      { id: "crop_insurance", label: L("Will you opt for crop insurance with KCC?", "क्या आप KCC के साथ फसल बीमा लेंगे?", "तुम्ही KCC सोबत पीक विमा घ्याल का?"), type: "checkbox" },
      { id: "consent_cibil", label: L("I consent to CIBIL/credit score check", "मैं CIBIL/क्रेडिट स्कोर जांच की सहमति देता हूँ", "मी CIBIL/क्रेडिट स्कोअर तपासणीस संमती देतो"), type: "checkbox" },
    ],
    documents: [
      { key: "aadhaar", label: L("Aadhaar Card", "आधार कार्ड", "आधार कार्ड") },
      { key: "land_record", label: L("Land Record (7/12 Extract)", "भूमि रिकॉर्ड (7/12)", "जमीन नोंद (7/12 उतारा)") },
      { key: "bank_statement", label: L("Bank Statement (6 months)", "बैंक स्टेटमेंट (6 महीने)", "बँक स्टेटमेंट (6 महिने)") },
      { key: "photo", label: L("Passport Size Photo", "पासपोर्ट आकार फोटो", "पासपोर्ट आकार फोटो") },
    ],
  },
  "RKVY": {
    code: "RKVY",
    questions: [
      { id: "project_type", label: L("Type of project", "परियोजना का प्रकार", "प्रकल्पाचा प्रकार"), type: "select", options: [
        { value: "infrastructure", label: L("Farm Infrastructure", "कृषि बुनियादी ढांचा", "शेती पायाभूत सुविधा") },
        { value: "equipment", label: L("Equipment/Machinery", "उपकरण/मशीनरी", "उपकरणे/यंत्रसामग्री") },
        { value: "processing", label: L("Post-harvest Processing", "कटाई उपरांत प्रसंस्करण", "काढणीपश्चात प्रक्रिया") },
      ]},
      { id: "budget_ready", label: L("Have you prepared a budget estimate?", "क्या आपने बजट अनुमान तैयार किया है?", "तुम्ही बजेट अंदाज तयार केला आहे का?"), type: "checkbox" },
      { id: "land_available", label: L("Is land available for the project?", "क्या परियोजना के लिए भूमि उपलब्ध है?", "प्रकल्पासाठी जमीन उपलब्ध आहे का?"), type: "checkbox" },
      { id: "prior_grants", label: L("Have you received any prior government grants?", "क्या आपको पहले कोई सरकारी अनुदान मिला है?", "तुम्हाला यापूर्वी कोणतेही शासकीय अनुदान मिळाले आहे का?"), type: "checkbox" },
      { id: "timeline", label: L("Can you complete the project within 12 months?", "क्या आप 12 महीने में परियोजना पूरी कर सकते हैं?", "तुम्ही 12 महिन्यांत प्रकल्प पूर्ण करू शकता का?"), type: "checkbox" },
      { id: "employment", label: L("Will this project generate local employment?", "क्या यह परियोजना स्थानीय रोजगार उत्पन्न करेगी?", "हा प्रकल्प स्थानिक रोजगार निर्माण करेल का?"), type: "checkbox" },
    ],
    documents: [
      { key: "aadhaar", label: L("Aadhaar Card", "आधार कार्ड", "आधार कार्ड") },
      { key: "land_record", label: L("Land Record (7/12 Extract)", "भूमि रिकॉर्ड (7/12)", "जमीन नोंद (7/12 उतारा)") },
      { key: "project_proposal", label: L("Project Proposal", "परियोजना प्रस्ताव", "प्रकल्प प्रस्ताव") },
      { key: "quotations", label: L("Quotations / Estimates", "कोटेशन / अनुमान", "कोटेशन / अंदाज") },
    ],
  },
};

export function getSchemeConfig(code: string): SchemeConfig | undefined {
  return SCHEME_CONFIGS[code];
}
