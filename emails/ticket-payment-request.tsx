import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./_layout";
import { formatGBP } from "@/lib/format";

export function TicketPaymentRequestEmail({
  name,
  title,
  pricePence,
  ticketUrl,
  checkoutUrl,
}: {
  name: string;
  title: string;
  pricePence: number;
  ticketUrl: string;
  checkoutUrl: string;
}) {
  return (
    <EmailLayout preview={`${title} — ${formatGBP(pricePence)} to approve`}>
      <Text style={styles.h1}>Your change request is ready for payment.</Text>
      <Text style={styles.p}>Hi {name.split(" ")[0]},</Text>
      <Text style={styles.p}>
        We&apos;ve reviewed your request &ldquo;{title}&rdquo; and priced it below. Pay to approve and we&apos;ll get started.
      </Text>
      <div style={styles.panel}>
        <Text style={{ ...styles.muted, margin: 0 }}>{title}</Text>
        <Text style={{ ...styles.p, fontSize: 28, fontWeight: 600, margin: "4px 0 0" }}>
          {formatGBP(pricePence)}
        </Text>
      </div>
      <Button href={checkoutUrl} style={styles.button}>Pay {formatGBP(pricePence)}</Button>
      <Text style={{ ...styles.muted, marginTop: 20 }}>
        Or open the request in your portal:{" "}
        <a href={ticketUrl} style={{ color: styles.colors.primary }}>{ticketUrl}</a>
      </Text>
    </EmailLayout>
  );
}

export default TicketPaymentRequestEmail;
