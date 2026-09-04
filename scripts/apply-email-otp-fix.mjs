import fs from "node:fs";

const file = "app/login/customer-login.tsx";
let text = fs.readFileSync(file, "utf8");

const oldBlock = `      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, data },
      });
      if (error) return setMessage(error.message);`;

const newBlock = `      const response = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return setMessage(result?.error || "Unable to send verification code.");`;

if (!text.includes(newBlock)) {
  if (!text.includes(oldBlock)) {
    throw new Error("Email OTP patch failed: expected login block not found.");
  }
  text = text.replace(oldBlock, newBlock);
  fs.writeFileSync(file, text);
}

console.log("Shree Gauri direct email OTP fix applied.");
