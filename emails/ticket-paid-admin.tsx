import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./_layout";
import { formatGBP } from "@/lib/format";

export function TicketPaidAdminEmail({
  clientName,
  title,
  pricePence,
  ticketUrl,
}: {
  clientName: string;
  title: string;
  pricePence: number;
  ticketUrl: string;
}) {
  return (
    <EmailLayout preview={`Paid: ${title} (${formatGBP(pricePence)})`}>
      <Text style={styles.h1}>Paid ticket — time to ship.</Text>
      <Text style={styles.p}>
        {clientName} just paid {formatGBP(pricePence)} for:
      </Text>
      <div style={styles.panel}>
        <Text style={{ ...styles.p, margin: 0, fontWeight: 600 }}>{title}</Text>
      </div>
      <Button href={ticketUrl} style={styles.button}>Open ticket</Button>
    </EmailLayout>
  );
}

export default TicketPaidAdminEmail;
