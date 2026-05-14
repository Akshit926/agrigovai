import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Lang = "en" | "hi" | "mr";
export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "mr", label: "मराठी", flag: "🇲🇭" },
];

/* ──────────────── translation dictionary ──────────────── */
const dict: Record<string, Record<Lang, string>> = {
  // Global
  "app.name": { en: "AgriGov AI", hi: "एग्रीगव AI", mr: "एग्रीगव AI" },
  "app.tagline": { en: "Dept. of Agriculture & Farmers Welfare", hi: "कृषि एवं किसान कल्याण विभाग", mr: "कृषी आणि शेतकरी कल्याण विभाग" },
  "app.farmer_portal": { en: "Farmer Portal", hi: "किसान पोर्टल", mr: "शेतकरी पोर्टल" },
  "app.sign_out": { en: "Sign out", hi: "साइन आउट", mr: "साइन आउट" },
  "app.sign_in": { en: "Sign in", hi: "साइन इन", mr: "साइन इन" },
  "app.register": { en: "Register as Farmer", hi: "किसान के रूप में पंजीकरण करें", mr: "शेतकरी म्हणून नोंदणी करा" },
  "app.footer": { en: "Built for Indian agriculture administration", hi: "भारतीय कृषि प्रशासन के लिए निर्मित", mr: "भारतीय कृषी प्रशासनासाठी निर्मित" },

  // Nav
  "nav.dashboard": { en: "Dashboard", hi: "डैशबोर्ड", mr: "डॅशबोर्ड" },
  "nav.apply": { en: "Apply for Scheme", hi: "योजना के लिए आवेदन", mr: "योजनेसाठी अर्ज करा" },
  "nav.applications": { en: "My Applications", hi: "मेरे आवेदन", mr: "माझे अर्ज" },
  "nav.grievance": { en: "File Grievance", hi: "शिकायत दर्ज करें", mr: "तक्रार नोंदवा" },
  "nav.profile": { en: "My Profile", hi: "मेरी प्रोफ़ाइल", mr: "माझी प्रोफाइल" },

  // Dashboard
  "dash.welcome": { en: "Welcome back", hi: "वापस स्वागत है", mr: "पुन्हा स्वागत" },
  "dash.namaste": { en: "Namaste", hi: "नमस्ते", mr: "नमस्कार" },
  "dash.apply_cta": { en: "Apply for a scheme", hi: "योजना के लिए आवेदन करें", mr: "योजनेसाठी अर्ज करा" },
  "dash.file_grievance": { en: "File a grievance", hi: "शिकायत दर्ज करें", mr: "तक्रार नोंदवा" },
  "dash.total_apps": { en: "Total Applications", hi: "कुल आवेदन", mr: "एकूण अर्ज" },
  "dash.approved": { en: "Approved", hi: "स्वीकृत", mr: "मंजूर" },
  "dash.in_review": { en: "In Review", hi: "समीक्षा में", mr: "पुनरावलोकनात" },
  "dash.open_grievances": { en: "Open Grievances", hi: "खुली शिकायतें", mr: "उघड्या तक्रारी" },
  "dash.recent_apps": { en: "Recent Applications", hi: "हाल के आवेदन", mr: "अलीकडील अर्ज" },
  "dash.recent_griev": { en: "Recent Grievances", hi: "हाल की शिकायतें", mr: "अलीकडील तक्रारी" },
  "dash.no_apps": { en: "No applications yet. Apply for a scheme to get started.", hi: "अभी तक कोई आवेदन नहीं। शुरू करने के लिए एक योजना के लिए आवेदन करें।", mr: "अद्याप अर्ज नाहीत. सुरुवात करण्यासाठी योजनेसाठी अर्ज करा." },
  "dash.no_griev": { en: "No grievances filed. We're here when you need us.", hi: "कोई शिकायत दर्ज नहीं। जब आपको जरूरत हो, हम यहाँ हैं।", mr: "कोणत्याही तक्रारी नोंदवलेल्या नाहीत. आम्ही तुमच्यासाठी इथे आहोत." },
  "dash.quick_actions": { en: "Quick Actions", hi: "त्वरित कार्य", mr: "जलद कृती" },
  "dash.view_profile": { en: "View Profile", hi: "प्रोफ़ाइल देखें", mr: "प्रोफाइल पहा" },
  "dash.notifications": { en: "Notifications", hi: "सूचनाएँ", mr: "सूचना" },

  // Apply
  "apply.title": { en: "Apply for a Scheme", hi: "योजना के लिए आवेदन करें", mr: "योजनेसाठी अर्ज करा" },
  "apply.subtitle": { en: "Complete the application step by step. Our AI will pre-check your documents and flag any issues instantly.", hi: "चरण दर चरण आवेदन पूरा करें। हमारी AI आपके दस्तावेज़ों की पूर्व-जांच करेगी।", mr: "चरणबद्ध अर्ज पूर्ण करा. आमची AI तुमच्या कागदपत्रांची पूर्व-तपासणी करेल." },
  "apply.step1": { en: "Select Scheme", hi: "योजना चुनें", mr: "योजना निवडा" },
  "apply.step2": { en: "Land & Crop Details", hi: "भूमि और फसल विवरण", mr: "जमीन आणि पीक तपशील" },
  "apply.step3": { en: "Eligibility Questions", hi: "पात्रता प्रश्न", mr: "पात्रता प्रश्न" },
  "apply.step4": { en: "Upload Documents", hi: "दस्तावेज़ अपलोड करें", mr: "कागदपत्रे अपलोड करा" },
  "apply.step5": { en: "Review & Submit", hi: "समीक्षा और सबमिट", mr: "पुनरावलोकन आणि सबमिट" },
  "apply.next": { en: "Next Step", hi: "अगला चरण", mr: "पुढील चरण" },
  "apply.prev": { en: "Previous", hi: "पिछला", mr: "मागील" },
  "apply.submit": { en: "Submit Application", hi: "आवेदन सबमिट करें", mr: "अर्ज सबमिट करा" },
  "apply.submitting": { en: "Submitting…", hi: "सबमिट हो रहा है…", mr: "सबमिट होत आहे…" },
  "apply.crop": { en: "Crop", hi: "फसल", mr: "पीक" },
  "apply.season": { en: "Season", hi: "मौसम", mr: "हंगाम" },
  "apply.land_id": { en: "Land ID / Survey No.", hi: "भूमि ID / सर्वे नंबर", mr: "जमीन ID / सर्वे क्रमांक" },
  "apply.area": { en: "Area (acres)", hi: "क्षेत्रफल (एकड़)", mr: "क्षेत्रफळ (एकर)" },
  "apply.select_scheme": { en: "Select a government scheme", hi: "सरकारी योजना चुनें", mr: "शासकीय योजना निवडा" },
  "apply.recommended": { en: "Recommended for you", hi: "आपके लिए अनुशंसित", mr: "तुमच्यासाठी शिफारस केलेले" },
  "apply.ai_precheck": { en: "AI Pre-Check", hi: "AI पूर्व-जांच", mr: "AI पूर्व-तपासणी" },
  "apply.doc_completeness": { en: "Document completeness", hi: "दस्तावेज़ पूर्णता", mr: "कागदपत्र पूर्णता" },
  "apply.all_docs_ok": { en: "All required documents provided.", hi: "सभी आवश्यक दस्तावेज़ उपलब्ध हैं।", mr: "सर्व आवश्यक कागदपत्रे उपलब्ध आहेत." },
  "apply.missing_docs": { en: "Missing documents", hi: "अनुपलब्ध दस्तावेज़", mr: "गहाळ कागदपत्रे" },
  "apply.success": { en: "Application submitted. AI review complete.", hi: "आवेदन सबमिट हो गया। AI समीक्षा पूर्ण।", mr: "अर्ज सबमिट झाला. AI पुनरावलोकन पूर्ण." },

  // Grievance
  "griev.title": { en: "File a Grievance", hi: "शिकायत दर्ज करें", mr: "तक्रार नोंदवा" },
  "griev.subtitle": { en: "Describe your issue. AI auto-classifies and prioritises it for the right officer.", hi: "अपनी समस्या बताएं। AI स्वचालित रूप से वर्गीकृत और प्राथमिकता देता है।", mr: "तुमची समस्या सांगा. AI स्वयंचलितपणे वर्गीकरण आणि प्राधान्य देते." },
  "griev.category": { en: "Select Category", hi: "श्रेणी चुनें", mr: "श्रेणी निवडा" },
  "griev.subject": { en: "Subject", hi: "विषय", mr: "विषय" },
  "griev.description": { en: "Describe your issue in detail", hi: "अपनी समस्या विस्तार से बताएं", mr: "तुमची समस्या तपशीलवार सांगा" },
  "griev.submit": { en: "Submit Grievance", hi: "शिकायत दर्ज करें", mr: "तक्रार सबमिट करा" },
  "griev.ai_class": { en: "AI Classification", hi: "AI वर्गीकरण", mr: "AI वर्गीकरण" },
  "griev.ai_improve": { en: "✨ AI Improve Statement", hi: "✨ AI कथन सुधारें", mr: "✨ AI विधान सुधारा" },
  "griev.my_grievances": { en: "My Grievances", hi: "मेरी शिकायतें", mr: "माझ्या तक्रारी" },
  "griev.no_grievances": { en: "You haven't filed any grievances yet.", hi: "आपने अभी तक कोई शिकायत दर्ज नहीं की है।", mr: "तुम्ही अद्याप कोणतीही तक्रार नोंदवलेली नाही." },
  "griev.success": { en: "Grievance filed. An officer will respond soon.", hi: "शिकायत दर्ज हो गई। एक अधिकारी जल्द जवाब देगा।", mr: "तक्रार नोंदवली. अधिकारी लवकरच प्रतिसाद देतील." },
  "griev.officer_response": { en: "Officer response", hi: "अधिकारी प्रतिक्रिया", mr: "अधिकारी प्रतिसाद" },

  // Profile
  "profile.title": { en: "My Profile", hi: "मेरी प्रोफ़ाइल", mr: "माझी प्रोफाइल" },
  "profile.personal": { en: "Personal Information", hi: "व्यक्तिगत जानकारी", mr: "वैयक्तिक माहिती" },
  "profile.full_name": { en: "Full Name", hi: "पूरा नाम", mr: "पूर्ण नाव" },
  "profile.father_name": { en: "Father's Name", hi: "पिता का नाम", mr: "वडिलांचे नाव" },
  "profile.phone": { en: "Phone Number", hi: "फ़ोन नंबर", mr: "फोन क्रमांक" },
  "profile.email": { en: "Email", hi: "ईमेल", mr: "ईमेल" },
  "profile.dob": { en: "Date of Birth", hi: "जन्म तिथि", mr: "जन्मतारीख" },
  "profile.gender": { en: "Gender", hi: "लिंग", mr: "लिंग" },
  "profile.aadhaar": { en: "Aadhaar Number", hi: "आधार नंबर", mr: "आधार क्रमांक" },
  "profile.address": { en: "Address Details", hi: "पता विवरण", mr: "पत्ता तपशील" },
  "profile.village": { en: "Village", hi: "गाँव", mr: "गाव" },
  "profile.taluka": { en: "Taluka", hi: "तहसील", mr: "तालुका" },
  "profile.district": { en: "District", hi: "जिला", mr: "जिल्हा" },
  "profile.state": { en: "State", hi: "राज्य", mr: "राज्य" },
  "profile.pin": { en: "PIN Code", hi: "पिन कोड", mr: "पिन कोड" },
  "profile.bank": { en: "Bank Details", hi: "बैंक विवरण", mr: "बँक तपशील" },
  "profile.account": { en: "Account Number", hi: "खाता नंबर", mr: "खाते क्रमांक" },
  "profile.ifsc": { en: "IFSC Code", hi: "IFSC कोड", mr: "IFSC कोड" },
  "profile.security": { en: "Security", hi: "सुरक्षा", mr: "सुरक्षा" },
  "profile.verified": { en: "Verified", hi: "सत्यापित", mr: "सत्यापित" },
  "profile.save": { en: "Save Profile", hi: "प्रोफ़ाइल सहेजें", mr: "प्रोफाइल जतन करा" },
  "profile.saving": { en: "Saving…", hi: "सहेजा जा रहा है…", mr: "जतन होत आहे…" },
  "profile.saved": { en: "Profile saved successfully.", hi: "प्रोफ़ाइल सफलतापूर्वक सहेजी गई।", mr: "प्रोफाइल यशस्वीरित्या जतन केली." },

  // Notifications
  "notif.title": { en: "Notifications", hi: "सूचनाएँ", mr: "सूचना" },
  "notif.mark_read": { en: "Mark all read", hi: "सभी पढ़ा हुआ", mr: "सर्व वाचलेले" },
  "notif.empty": { en: "No new notifications", hi: "कोई नई सूचना नहीं", mr: "नवीन सूचना नाहीत" },
  "notif.signed_in": { en: "Signed in successfully", hi: "सफलतापूर्वक साइन इन किया", mr: "यशस्वीरित्या साइन इन केले" },
  "notif.app_submitted": { en: "Application submitted for", hi: "आवेदन सबमिट किया गया -", mr: "अर्ज सबमिट केला -" },
  "notif.app_approved": { en: "Application approved for", hi: "आवेदन स्वीकृत -", mr: "अर्ज मंजूर -" },
  "notif.app_rejected": { en: "Application requires attention for", hi: "आवेदन पर ध्यान आवश्यक -", mr: "अर्जावर लक्ष आवश्यक -" },
  "notif.griev_filed": { en: "Grievance filed successfully", hi: "शिकायत सफलतापूर्वक दर्ज", mr: "तक्रार यशस्वीरित्या नोंदवली" },
  "notif.griev_resolved": { en: "Grievance resolved", hi: "शिकायत हल हो गई", mr: "तक्रार निकाली" },

  // Chatbot
  "chat.title": { en: "KrishiMitra AI", hi: "कृषिमित्र AI", mr: "कृषिमित्र AI" },
  "chat.subtitle": { en: "Your agriculture assistant", hi: "आपका कृषि सहायक", mr: "तुमचा कृषी सहाय्यक" },
  "chat.placeholder": { en: "Ask me anything about schemes...", hi: "योजनाओं के बारे में कुछ भी पूछें...", mr: "योजनांबद्दल काहीही विचारा..." },
  "chat.welcome": { en: "Hello! I'm KrishiMitra AI, your agriculture assistant. I can help you with:\n\n• Finding suitable government schemes\n• Understanding eligibility criteria\n• Guiding you through the application process\n• Answering questions about documents\n\nHow can I help you today?", hi: "नमस्ते! मैं कृषिमित्र AI हूँ, आपका कृषि सहायक। मैं आपकी मदद कर सकता हूँ:\n\n• उपयुक्त सरकारी योजनाएँ खोजने में\n• पात्रता मानदंड समझने में\n• आवेदन प्रक्रिया में मार्गदर्शन\n• दस्तावेजों के बारे में सवालों का जवाब\n\nआज मैं आपकी कैसे मदद कर सकता हूँ?", mr: "नमस्कार! मी कृषिमित्र AI आहे, तुमचा कृषी सहाय्यक. मी तुम्हाला मदत करू शकतो:\n\n• योग्य शासकीय योजना शोधण्यात\n• पात्रता निकष समजून घेण्यात\n• अर्ज प्रक्रियेत मार्गदर्शन\n• कागदपत्रांबद्दल प्रश्नांची उत्तरे\n\nआज मी तुम्हाला कशी मदत करू शकतो?" },

  // Landing page
  "landing.hero_badge": { en: "AI-powered · Built for Bharat", hi: "AI-संचालित · भारत के लिए निर्मित", mr: "AI-चालित · भारतासाठी निर्मित" },
  "landing.hero_title": { en: "Smart Agriculture Administration for India", hi: "भारत के लिए स्मार्ट कृषि प्रशासन", mr: "भारतासाठी स्मार्ट कृषी प्रशासन" },
  "landing.hero_desc": { en: "One unified platform for farmers and agriculture officers. Apply for government schemes, file grievances, and let AI handle document checks, fraud detection and field verification — instantly.", hi: "किसानों और कृषि अधिकारियों के लिए एक एकीकृत मंच। सरकारी योजनाओं के लिए आवेदन करें, शिकायत दर्ज करें, और AI को दस्तावेज़ जांच, धोखाधड़ी पहचान संभालने दें।", mr: "शेतकरी आणि कृषी अधिकाऱ्यांसाठी एक एकत्रित व्यासपीठ. शासकीय योजनांसाठी अर्ज करा, तक्रारी नोंदवा आणि AI ला कागदपत्र तपासणी, फसवणूक शोध हाताळू द्या." },
  "landing.farmer_login": { en: "Farmer Login / Register", hi: "किसान लॉगिन / पंजीकरण", mr: "शेतकरी लॉगिन / नोंदणी" },
  "landing.officer_login": { en: "Officer Sign In", hi: "अधिकारी साइन इन", mr: "अधिकारी साइन इन" },
  "landing.features": { en: "Features", hi: "विशेषताएँ", mr: "वैशिष्ट्ये" },
  "landing.schemes": { en: "Schemes", hi: "योजनाएँ", mr: "योजना" },
  "landing.how": { en: "How it works", hi: "यह कैसे काम करता है", mr: "हे कसे काम करते" },
  "landing.contact": { en: "Contact", hi: "संपर्क", mr: "संपर्क" },

  // Admin Dashboard
  "admin.dashboard": { en: "Officer Dashboard", hi: "अधिकारी डैशबोर्ड", mr: "अधिकारी डॅशबोर्ड" },
  "admin.dashboard_desc": { en: "Real-time view of applications, fraud signals & grievances across your district.", hi: "आपके जिले में आवेदनों, धोखाधड़ी संकेतों और शिकायतों का वास्तविक समय दृश्य।", mr: "तुमच्या जिल्ह्यातील अर्ज, फसवणूक संकेत आणि तक्रारींचे रिअल-टाइम दृश्य." },
  "admin.live": { en: "AI engine processing live", hi: "AI इंजन लाइव प्रोसेसिंग", mr: "AI इंजिन लाइव प्रोसेसिंग" },
  "admin.updated": { en: "Last updated", hi: "अंतिम अपडेट", mr: "शेवटचे अपडेट" },
  "admin.total_apps": { en: "Total Applications", hi: "कुल आवेदन", mr: "एकूण अर्ज" },
  "admin.fraud_alerts": { en: "Fraud Alerts", hi: "धोखाधड़ी चेतावनी", mr: "फसवणूक सूचना" },
  "admin.missing_docs": { en: "Missing Docs", hi: "अनुपलब्ध दस्तावेज़", mr: "गहाळ कागदपत्रे" },
  "admin.high_priority": { en: "High Priority", hi: "उच्च प्राथमिकता", mr: "उच्च प्राधान्य" },
  "admin.delay_risks": { en: "Delay Risks", hi: "विलंब जोखिम", mr: "विलंब धोका" },
  "admin.approved": { en: "approved", hi: "स्वीकृत", mr: "मंजूर" },
  "admin.ai_flagged": { en: "AI flagged", hi: "AI फ्लैग", mr: "AI फ्लॅग" },
  "admin.docs_missing": { en: "Documents missing", hi: "दस्तावेज़ अनुपलब्ध", mr: "कागदपत्रे गहाळ" },
  "admin.filter_by": { en: "Filter by", hi: "फ़िल्टर", mr: "फिल्टर" },
  "admin.district": { en: "District", hi: "जिला", mr: "जिल्हा" },
  "admin.taluka": { en: "Taluka", hi: "तहसील", mr: "तालुका" },
  "admin.all_districts": { en: "All Districts", hi: "सभी जिले", mr: "सर्व जिल्हे" },
  "admin.all_talukas": { en: "All Talukas", hi: "सभी तहसील", mr: "सर्व तालुके" },
  "admin.clear_filters": { en: "Clear filters", hi: "फ़िल्टर हटाएं", mr: "फिल्टर साफ करा" },
  "admin.results": { en: "results", hi: "परिणाम", mr: "निकाल" },
  "admin.app_trend": { en: "Application Trend (14 days)", hi: "आवेदन रुझान (14 दिन)", mr: "अर्ज ट्रेंड (14 दिवस)" },
  "admin.griev_cats": { en: "Grievance Categories", hi: "शिकायत श्रेणियाँ", mr: "तक्रार श्रेण्या" },
  "admin.district_heat": { en: "District Application Density", hi: "जिला आवेदन घनत्व", mr: "जिल्हा अर्ज घनता" },
  "admin.scheme_demand": { en: "Scheme Demand", hi: "योजना मांग", mr: "योजना मागणी" },
  "admin.recent_alerts": { en: "Recent AI Alerts", hi: "हाल की AI चेतावनियाँ", mr: "अलीकडील AI सूचना" },
  "admin.view_all": { en: "View all", hi: "सभी देखें", mr: "सर्व पहा" },
  "admin.no_alerts": { en: "No alerts.", hi: "कोई चेतावनी नहीं।", mr: "कोणत्याही सूचना नाहीत." },
  "admin.pending_apps": { en: "Pending Applications", hi: "लंबित आवेदन", mr: "प्रलंबित अर्ज" },
  "admin.open_queue": { en: "Open queue", hi: "कतार खोलें", mr: "रांग उघडा" },
  "admin.no_pending": { en: "No pending applications.", hi: "कोई लंबित आवेदन नहीं।", mr: "प्रलंबित अर्ज नाहीत." },
  "admin.farmer": { en: "Farmer", hi: "किसान", mr: "शेतकरी" },
  "admin.scheme": { en: "Scheme", hi: "योजना", mr: "योजना" },
  "admin.priority": { en: "Priority", hi: "प्राथमिकता", mr: "प्राधान्य" },
  "admin.status": { en: "Status", hi: "स्थिति", mr: "स्थिती" },

  // Common
  "common.loading": { en: "Loading…", hi: "लोड हो रहा है…", mr: "लोड होत आहे…" },
  "common.error": { en: "Something went wrong", hi: "कुछ गलत हो गया", mr: "काहीतरी चूक झाली" },
  "common.cancel": { en: "Cancel", hi: "रद्द करें", mr: "रद्द करा" },
  "common.save": { en: "Save", hi: "सहेजें", mr: "जतन करा" },
  "common.required": { en: "Required", hi: "आवश्यक", mr: "आवश्यक" },
  "common.yes": { en: "Yes", hi: "हाँ", mr: "हो" },
  "common.no": { en: "No", hi: "नहीं", mr: "नाही" },
  "common.male": { en: "Male", hi: "पुरुष", mr: "पुरुष" },
  "common.female": { en: "Female", hi: "महिला", mr: "स्त्री" },
  "common.other": { en: "Other", hi: "अन्य", mr: "इतर" },
};

/* ──────────────── context ──────────────── */
interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const Ctx = createContext<I18nCtx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("agrigov_lang") as Lang) ?? "en";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("agrigov_lang", l);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const entry = dict[key];
      if (!entry) return fallback ?? key;
      return entry[lang] ?? entry.en ?? fallback ?? key;
    },
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
