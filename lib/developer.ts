// Credit for the studio that built the site (shown in the footer).
const env = (v: string | undefined, fallback: string) => (v && v.trim() ? v.trim() : fallback);

export const developer = {
  name: env(process.env.NEXT_PUBLIC_DEVELOPER_NAME, "Kartik's Code Paradise"),
  owner: "Kartik Nareshrao Yamsanwar",
  url: env(process.env.NEXT_PUBLIC_DEVELOPER_URL, "https://kartikscodeparadise.web.app/"),
  email: env(process.env.NEXT_PUBLIC_DEVELOPER_EMAIL, "kartikscodeparadise@gmail.com"),
  logo: "/brand/developer-logo.jpg",
};
