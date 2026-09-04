import fs from "node:fs";

const file = "app/login/customer-login.tsx";
let text = fs.readFileSync(file, "utf8");

if (!text.includes('const [challengeId, setChallengeId] = useState("");')) {
  text = text.replace(
    '  const [otp, setOtp] = useState("");\n',
    '  const [otp, setOtp] = useState("");\n  const [challengeId, setChallengeId] = useState("");\n'
  );
}

const candidates = [
`      const response = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return setMessage(result?.error || "Unable to send verification code.");`,
`      const response = await fetch("/api/auth/email-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return setMessage(result?.error || "Unable to send verification code.");
      setChallengeId(String(result.challenge_id || ""));`,
`      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, data },
      });
      if (error) return setMessage(error.message);`
];

const finalSend = `      const response = await fetch("/api/auth/email-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return setMessage(result?.error || "Unable to send verification code.");
      setChallengeId(String(result.challenge_id || ""));`;

if (!text.includes(finalSend)) {
  const found = candidates.find((x) => text.includes(x));
  if (!found) throw new Error("OTP V2 patch failed: send block not found.");
  text = text.replace(found, finalSend);
}

const start = text.indexOf('  async function verifyOtp(e: FormEvent) {');
const end = text.indexOf('\n  async function loadAccount()', start);

if (start === -1 || end === -1) {
  throw new Error("OTP V2 patch failed: verify function not found.");
}

const verifyFn = `  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setMessage("Verifying...");

    if (channel === "email") {
      const response = await fetch("/api/auth/email-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier.trim().toLowerCase(),
          code: otp.trim(),
          challenge_id: challengeId,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return setMessage(result?.error || "Unable to verify code.");

      const access_token = result?.session?.access_token;
      const refresh_token = result?.session?.refresh_token;

      if (!access_token || !refresh_token) {
        return setMessage("Unable to establish your login session.");
      }

      const setResult = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (setResult.error) return setMessage(setResult.error.message);
    } else {
      const result = await supabase.auth.verifyOtp({
        phone: identifier.trim(),
        token: otp.trim(),
        type: "sms",
      });

      if (result.error) return setMessage(result.error.message);
    }

    setMessage("Welcome to Shree Gauri.");

    const params = new URLSearchParams(window.location.search);
    if (params.get("returnTo") === "checkout") {
      window.location.href = "/?checkout=1";
    }
  }
`;

text = text.slice(0, start) + verifyFn + text.slice(end);

text = text.replaceAll(
  'setOtpSent(false); setOtp(""); setMessage("");',
  'setOtpSent(false); setOtp(""); setChallengeId(""); setMessage("");'
);

fs.writeFileSync(file, text);
console.log("Shree Gauri OTP final V2 applied.");
