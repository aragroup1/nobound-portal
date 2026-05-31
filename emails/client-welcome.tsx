import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./_layout";

export function ClientWelcomeEmail({
  name,
  checkoutUrl,
  loginUrl,
  hosting,
  seo,
}: {
  name: string;
  checkoutUrl: string;
  loginUrl: string;
  hosting: boolean;
  seo: boolean;
}) {
  const plan = [hosting && "Hosting (£10/mo)", seo && "SEO (£100/mo)"].filter(Boolean).join(" + ");
  return (
    <EmailLayout preview={`Welcome to NoBound — finish setting up your account`}>
      <Text style={styles.h1}>Welcome, {name.split(" ")[0]}.</Text>
      <Text style={styles.p}>
        Your NoBound account is ready. One last step: add your card so we can start your subscription.
      </Text>
      <div style={styles.panel}>
        <Text style={{ ...styles.muted, margin: 0 }}>Your plan</Text>
        <Text style={{ ...styles.p, fontWeight: 600, margin: "4px 0 0" }}>{plan}</Text>
      </div>
      <Button href={checkoutUrl} style={styles.button}>Set up payment</Button>
      <Text style={{ ...styles.muted, marginTop: 20 }}>
        Once paid, sign in any time at{" "}
        <a href={loginUrl} style={{ color: styles.colors.primary }}>{loginUrl}</a>.
      </Text>
    </EmailLayout>
  );
}

export default ClientWelcomeEmail;
