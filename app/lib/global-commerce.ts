export type CountryOption = {
  code: string;
  name: string;
  dialCode: string;
  postalLabel: string;
};

// Checkout country/phone foundation. India remains the default and INR remains authoritative.
export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "IN", name: "India", dialCode: "+91", postalLabel: "PIN code" },
  { code: "US", name: "United States", dialCode: "+1", postalLabel: "ZIP code" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", postalLabel: "Postcode" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", postalLabel: "Postal code" },
  { code: "CA", name: "Canada", dialCode: "+1", postalLabel: "Postal code" },
  { code: "AU", name: "Australia", dialCode: "+61", postalLabel: "Postcode" },
  { code: "SG", name: "Singapore", dialCode: "+65", postalLabel: "Postal code" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", postalLabel: "Postcode" },
  { code: "DE", name: "Germany", dialCode: "+49", postalLabel: "Postal code" },
  { code: "FR", name: "France", dialCode: "+33", postalLabel: "Postal code" },
  { code: "IT", name: "Italy", dialCode: "+39", postalLabel: "Postal code" },
  { code: "ES", name: "Spain", dialCode: "+34", postalLabel: "Postal code" },
  { code: "NL", name: "Netherlands", dialCode: "+31", postalLabel: "Postal code" },
  { code: "CH", name: "Switzerland", dialCode: "+41", postalLabel: "Postal code" },
  { code: "SE", name: "Sweden", dialCode: "+46", postalLabel: "Postal code" },
  { code: "NO", name: "Norway", dialCode: "+47", postalLabel: "Postal code" },
  { code: "DK", name: "Denmark", dialCode: "+45", postalLabel: "Postal code" },
  { code: "FI", name: "Finland", dialCode: "+358", postalLabel: "Postal code" },
  { code: "IE", name: "Ireland", dialCode: "+353", postalLabel: "Eircode" },
  { code: "PT", name: "Portugal", dialCode: "+351", postalLabel: "Postal code" },
  { code: "JP", name: "Japan", dialCode: "+81", postalLabel: "Postal code" },
  { code: "KR", name: "South Korea", dialCode: "+82", postalLabel: "Postal code" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", postalLabel: "Postal code" },
  { code: "QA", name: "Qatar", dialCode: "+974", postalLabel: "Postal code" },
  { code: "KW", name: "Kuwait", dialCode: "+965", postalLabel: "Postal code" },
  { code: "OM", name: "Oman", dialCode: "+968", postalLabel: "Postal code" },
  { code: "BH", name: "Bahrain", dialCode: "+973", postalLabel: "Postal code" },
  { code: "MY", name: "Malaysia", dialCode: "+60", postalLabel: "Postal code" },
  { code: "TH", name: "Thailand", dialCode: "+66", postalLabel: "Postal code" },
  { code: "ID", name: "Indonesia", dialCode: "+62", postalLabel: "Postal code" },
  { code: "PH", name: "Philippines", dialCode: "+63", postalLabel: "ZIP code" },
  { code: "VN", name: "Vietnam", dialCode: "+84", postalLabel: "Postal code" },
  { code: "ZA", name: "South Africa", dialCode: "+27", postalLabel: "Postal code" },
  { code: "MU", name: "Mauritius", dialCode: "+230", postalLabel: "Postal code" },
  { code: "NP", name: "Nepal", dialCode: "+977", postalLabel: "Postal code" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", postalLabel: "Postal code" },
  { code: "BD", name: "Bangladesh", dialCode: "+880", postalLabel: "Postal code" },
];

export const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0];

export function getCountry(code: string) {
  return COUNTRY_OPTIONS.find((country) => country.code === code) || DEFAULT_COUNTRY;
}

export function canUsePhonePe(countryCode: string) {
  return countryCode === "IN";
}

export const INTERNATIONAL_PAYMENT_MESSAGE =
  "International online payment is not enabled yet. Please contact Shree Gauri for shipping availability and payment assistance.";
