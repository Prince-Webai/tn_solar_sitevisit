import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "site_visit_form": "Solar Site Visit Form",
      "step_1": "Client & Context",
      "step_2": "Perimeter Photos",
      "step_3": "Solar Space Details",
      "step_4": "Structure & Electrical",
      "step_5": "Logistics & Personnel",
      "step_6": "Declaration & Signature",
      "client_name": "Client Name",
      "client_phone": "Client Phone",
      "site_address": "Site Address",
      "no_of_floors": "No of Floors",
      "phase": "Phase",
      "capture_location": "Capture Location",
      "location_captured": "Location Captured Successfully",
      "next": "Next",
      "back": "Back",
      "submit": "Submit Site Visit",
      "declaration_en": "I confirm that the site survey has been conducted in my presence and I have shared all the required information accurately.",
      "declaration_ta": "இந்த தள ஆய்வு எனது முன்னிலையில் நடத்தப்பட்டதை நான் உறுதிசெய்கிறேன் மற்றும் தேவையான அனைத்து தகவல்களையும் நான் துல்லியமாக பகிர்ந்துள்ளேன்.",
      "clear": "Clear",
      "sign_here": "Client Signature",
      "photo_labels": {
        "front": "House Front Photo",
        "left": "House Left Photo",
        "right": "House Right Photo",
        "back": "House Back Photo",
        "solar": "Solar System Location"
      }
    }
  },
  ta: {
    translation: {
      "site_visit_form": "சூரிய சக்தி தள ஆய்வு படிவம்",
      "step_1": "வாடிக்கையாளர் மற்றும் சூழல்",
      "step_2": "சுற்றளவு புகைப்படங்கள்",
      "step_3": "சூரிய சக்தி இட விவரங்கள்",
      "step_4": "கட்டமைப்பு மற்றும் மின்சாரம்",
      "step_5": "தளவாடங்கள் மற்றும் பணியாளர்கள்",
      "step_6": "உறுதிமொழி மற்றும் கையெழுத்து",
      "client_name": "வாடிக்கையாளர் பெயர்",
      "client_phone": "வாடிக்கையாளர் தொலைபேசி",
      "site_address": "தள முகவரி",
      "no_of_floors": "மாடிகளின் எண்ணிக்கை",
      "phase": "மின் கட்டம் (Phase)",
      "capture_location": "இருப்பிடத்தைப் பிடிக்கவும்",
      "location_captured": "இருப்பிடம் வெற்றிகரமாகப் பிடிக்கப்பட்டது",
      "next": "அடுத்து",
      "back": "பின்னால்",
      "submit": "தள ஆய்வை சமர்ப்பிக்கவும்",
      "clear": "அழிக்கவும்",
      "sign_here": "வாடிக்கையாளர் கையெழுத்து",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
