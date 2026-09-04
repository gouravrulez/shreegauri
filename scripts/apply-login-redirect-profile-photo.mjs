import fs from "node:fs";

const loginPath = "app/login/customer-login.tsx";
const cssPath = "app/globals.css";

let text = fs.readFileSync(loginPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

// Add profile image field to customer profile type.
if (!text.includes("profile_image_url: string;")) {
  text = text.replace(
`  phone: string;
  date_of_birth: string;
};`,
`  phone: string;
  date_of_birth: string;
  profile_image_url: string;
};`
  );
}

if (!text.includes('profile_image_url: ""')) {
  text = text.replace(
`const blankProfile: Profile = {
  full_name: "", email: "", phone: "", date_of_birth: ""
};`,
`const blankProfile: Profile = {
  full_name: "", email: "", phone: "", date_of_birth: "", profile_image_url: ""
};`
  );
}

// Load saved photo URL into the dashboard profile.
if (!text.includes('profile_image_url: customer.profile_image_url || "",')) {
  text = text.replace(
`        phone: customer.phone || user.phone || "",
        date_of_birth: customer.date_of_birth || "",
      });`,
`        phone: customer.phone || user.phone || "",
        date_of_birth: customer.date_of_birth || "",
        profile_image_url: customer.profile_image_url || "",
      });`
  );
}

// Add upload/change photo function.
if (!text.includes("async function uploadProfilePhoto")) {
  const marker = `  async function addAddress(e: FormEvent) {`;
  const fn = `  async function uploadProfilePhoto(file?: File) {
    if (!file || !user || !profile.id) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Please choose a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setMessage("Profile photo must be 3 MB or smaller.");
      return;
    }

    setSaving(true);
    setMessage("Uploading profile photo...");

    const ext =
      file.type === "image/png" ? "png" :
      file.type === "image/webp" ? "webp" : "jpg";

    const path = \`\${user.id}/avatar.\${ext}\`;

    const uploaded = await supabase.storage
      .from("customer-avatars")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploaded.error) {
      setSaving(false);
      setMessage(uploaded.error.message);
      return;
    }

    const { data: publicData } = supabase.storage
      .from("customer-avatars")
      .getPublicUrl(path);

    const imageUrl = \`\${publicData.publicUrl}?v=\${Date.now()}\`;

    const updated = await supabase
      .from("customers")
      .update({
        profile_image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);

    if (updated.error) {
      setMessage(updated.error.message);
      return;
    }

    setProfile((p) => ({ ...p, profile_image_url: imageUrl }));
    setMessage("Profile photo updated.");
  }

`;
  if (!text.includes(marker)) throw new Error("Profile photo patch failed: addAddress marker not found.");
  text = text.replace(marker, fn + marker);
}

// Successful regular login should return customer to storefront.
// Checkout-originated login still returns directly to checkout.
const redirectOld = `    setMessage("Welcome to Shree Gauri.");
    const params = new URLSearchParams(window.location.search);
    if (params.get("returnTo") === "checkout") {
      window.location.href = "/?checkout=1";
    }
`;
const redirectNew = `    setMessage("Welcome to Shree Gauri.");
    const params = new URLSearchParams(window.location.search);
    if (params.get("returnTo") === "checkout") {
      window.location.href = "/?checkout=1";
    } else {
      window.location.href = "/";
    }
`;

if (!text.includes('window.location.href = "/";') && text.includes(redirectOld)) {
  text = text.replace(redirectOld, redirectNew);
}

// Replace sidebar avatar with editable customer photo.
const oldAvatar = `<div className="customer-avatar"><UserRound /></div>`;
const newAvatar = `<label className="customer-avatar customer-avatar-edit" title="Change profile photo">
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt="Customer profile" />
            ) : (
              <UserRound />
            )}
            <span>CHANGE PHOTO</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadProfilePhoto(file);
                e.currentTarget.value = "";
              }}
              disabled={saving}
            />
          </label>`;

if (!text.includes("customer-avatar-edit")) {
  if (!text.includes(oldAvatar)) throw new Error("Profile photo patch failed: avatar block not found.");
  text = text.replace(oldAvatar, newAvatar);
}

fs.writeFileSync(loginPath, text);

const styles = `
/* Customer profile photo editor */
.customer-avatar-edit{position:relative;overflow:hidden;cursor:pointer;display:flex;align-items:center;justify-content:center}
.customer-avatar-edit img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.customer-avatar-edit>span{position:absolute;left:50%;bottom:3px;transform:translateX(-50%);white-space:nowrap;background:rgba(58,12,15,.82);color:#fff;font-size:8px;line-height:1;padding:4px 6px;border-radius:999px;opacity:0;transition:opacity .2s ease}
.customer-avatar-edit:hover>span{opacity:1}
.customer-avatar-edit input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
@media(max-width:760px){.customer-avatar-edit>span{opacity:1;font-size:7px}}
`;

if (!css.includes("Customer profile photo editor")) {
  fs.appendFileSync(cssPath, styles);
}

console.log("Shree Gauri login redirect and customer profile photo upgrade applied.");
