import fs from "node:fs";

const file = "app/login/customer-login.tsx";
let text = fs.readFileSync(file, "utf8");

// This patch intentionally removes the unusable Mobile OTP option.
// Real phone OTP needs an SMS delivery provider; Email OTP remains the secure ₹0 path.
text = text.replace(
`              <div className="otp-channel">
                <button type="button" className={channel === "email" ? "active" : ""} onClick={() => { setChannel("email"); setIdentifier(""); setMessage(""); }}>
                  EMAIL OTP
                </button>
                <button type="button" className={channel === "phone" ? "active" : ""} onClick={() => { setChannel("phone"); setIdentifier(""); setMessage(""); }}>
                  MOBILE OTP
                </button>
              </div>`,
`              <div className="otp-channel email-only">
                <button type="button" className="active">
                  EMAIL OTP
                </button>
              </div>
              <p className="auth-free-note">Secure password-free login. Your 6-digit code will be sent to your email.</p>`
);

// Force the login form to use the already-working Email OTP path.
text = text.replace(
`                {channel === "email" ? "Email Address" : "Mobile Number"}
                <input
                  type={channel === "email" ? "email" : "tel"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={channel === "email" ? "you@example.com" : "9876543210"}
                  required
                />`,
`                Email Address
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com"
                  required
                />`
);

text = text.replace(
  `<p>We sent a verification code to {identifier}.</p>`,
  `<p>We sent a 6-digit verification code to {identifier}.</p>`
);
text = text.replace("Change email/mobile", "Change email");

// Preserve the profile Mobile Number field. It is contact/delivery information,
// not falsely represented as SMS-verified.
fs.writeFileSync(file, text);

const cssFile = "app/globals.css";
let css = fs.readFileSync(cssFile, "utf8");
if (!css.includes("auth-free-note")) {
  css += `
/* Zero-cost authentication clarification */
.otp-channel.email-only{grid-template-columns:1fr}
.auth-free-note{font-size:12px;line-height:1.55;color:#6f5c57;margin:-8px 0 16px}
`;
  fs.writeFileSync(cssFile, css);
}

console.log("Zero-cost Email OTP login cleanup applied");
