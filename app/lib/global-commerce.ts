export type CountryOption = {
  code: string;
  name: string;
  dialCode: string;
  postalLabel: string;
};

// Checkout country/phone foundation. India remains the default and INR remains authoritative.
export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "IN", name: "India", dialCode: "+91", postalLabel: "Postal code" },
  { code: "US", name: "United States", dialCode: "+1", postalLabel: "Postal code" },
  { code: "CA", name: "Canada", dialCode: "+1", postalLabel: "Postal code" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", postalLabel: "Postal code" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", postalLabel: "Postal code" },
  { code: "AU", name: "Australia", dialCode: "+61", postalLabel: "Postal code" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", postalLabel: "Postal code" },
  { code: "SG", name: "Singapore", dialCode: "+65", postalLabel: "Postal code" },
  { code: "DE", name: "Germany", dialCode: "+49", postalLabel: "Postal code" },
  { code: "FR", name: "France", dialCode: "+33", postalLabel: "Postal code" },
  { code: "IT", name: "Italy", dialCode: "+39", postalLabel: "Postal code" },
  { code: "ES", name: "Spain", dialCode: "+34", postalLabel: "Postal code" },
  { code: "NL", name: "Netherlands", dialCode: "+31", postalLabel: "Postal code" },
  { code: "BE", name: "Belgium", dialCode: "+32", postalLabel: "Postal code" },
  { code: "CH", name: "Switzerland", dialCode: "+41", postalLabel: "Postal code" },
  { code: "AT¶»§q«^