import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./_layout";

export function SeoInterestEmail({
  clientName,
  businessName,
  email,
  websiteUrl,
  clientAdminUrl,
}: {
  clientName: string;
  businessName: string | null;
  email: string;
  websiteUrl: string | null;
  clientAdminUrl: string;
}) {
  return (
    <EmailLayout preview={`SEO interest from ${clientName}`}>
      <Text style={styles.h1}>SEO interest from {clientName}</Text>
      <Text style={styles.p}>They just clicked &quot;I&apos;m interested&quot; on the SEO upsell card in their portal. Reach out before they cool off.</Text>
      <div style={styles.panel}>
        <Text style={{ ...styles.p, margin: 0, fontWeight: 600 }}>{businessName ?? clientName}</Text>
        <Text style={{ ...styles.muted, margin: "4px 0 0" }}>{email}</Text>
        {websiteUrl && (
          <Text style={{ ...styles.muted, margin: "4px 0 0" }}>{websiteUrl}</Text>
        )}
      </div>
      <Button href={clientAdminUrl} style={styles.button}>Open client in admin</Button>
    </EmailLayout>
  );
}

export default SeoInterestEmail;
